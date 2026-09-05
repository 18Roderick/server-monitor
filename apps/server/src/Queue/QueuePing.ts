import { Cause, Context, Effect, Layer, Runtime } from 'effect';
import { Queue, Worker, type Job } from 'bullmq';
import { eq } from 'drizzle-orm';

import { RedisConnection } from '@/Queue/Connection';
import { Db, type Database } from '@/Db/Db';
import { logs, pings, servers, tasks, type Task } from '@/Db/schemas';
import { makePing } from '@/Ping/ping';
import { DbError, NotFoundError } from '@/Errors';

export const QUEUE_PING_NAME = '{QUEUE_PING}';

export enum CRON_TIME {
  EVERY_MINUTE = '* * * * *',
  EVERY_FIVE_MINUTES = '*/5 * * * *',
}

export enum CONSUMERS {
  PING_SERVER = '#PING_SERVER',
}

// after this many consecutive ping failures, the coordinator auto-pauses the
// Task rather than let it keep pinging something that's permanently down
const MAX_RETRIES_FAILED = 3;

export interface AddPingTask {
  readonly idServer: string;
  readonly idUser: string;
}

export class QueuePingService extends Context.Tag('QueuePingService')<
  QueuePingService,
  {
    readonly createPingTask: (data: AddPingTask) => Effect.Effect<string>;
    readonly listTasks: () => Effect.Effect<readonly Task[], DbError>;
    readonly getTask: (idTask: string) => Effect.Effect<Task, DbError | NotFoundError>;
    readonly stopTask: (idTask: string) => Effect.Effect<Task, DbError | NotFoundError>;
    readonly resumeTask: (idTask: string) => Effect.Effect<Task, DbError | NotFoundError>;
    readonly deleteTaskForServer: (idServer: string) => Effect.Effect<void, DbError>;
    readonly reconcile: () => Effect.Effect<void, DbError>;
  }
>() {}

const runPingJob = (
  db: Database,
  queue: Queue<AddPingTask>,
  job: Job<AddPingTask>,
) =>
  Effect.gen(function* () {
    const server = yield* Effect.promise(() =>
      db
        .select({
          id_user: servers.id_user,
          id_server: servers.id_server,
          url: servers.url,
          ip: servers.ip,
          id_task: tasks.id_task,
          retries_failed: tasks.retries_failed,
        })
        .from(servers)
        .leftJoin(tasks, eq(servers.id_server, tasks.id_server))
        .where(eq(servers.id_server, job.data.idServer)),
    );

    const row = server[0];
    if (!row) {
      return yield* Effect.fail(new Error(`SERVER NOT FOUND: ${job.data.idServer}`));
    }

    const destination = row.url ? new URL(row.url).host : (row.ip as string);
    const pingResult = yield* makePing(destination).pipe(Effect.either);

    if (pingResult._tag === 'Right') {
      const data = pingResult.right;

      if (!row.ip) {
        yield* Effect.promise(() =>
          db
            .update(servers)
            .set({ ip: data.numeric_host })
            .where(eq(servers.id_server, row.id_server)),
        );
      }

      yield* Effect.promise(() =>
        db.insert(pings).values({
          id_server: row.id_server,
          times: data.times.length,
          packet_loss: data.packetLoss,
          min: data.min,
          max: data.max,
          avg: data.avg,
          log: `Server is ${data.alive ? 'alive' : 'dead'}`,
          is_alive: data.alive ? 1 : 0,
          numeric_host: data.numeric_host ?? destination,
        }),
      );
      return;
    }

    const task = yield* Effect.promise(() =>
      db.query.tasks.findFirst({ where: eq(tasks.id_server, row.id_server) }),
    );

    if (task && task.status === 'running') {
      const retriesFailed = task.retries_failed + 1;

      if (retriesFailed >= MAX_RETRIES_FAILED) {
        // auto-pause: the coordinator (this row) decided to stop, so the
        // executor's recurring definition must actually stop being created
        yield* Effect.promise(() => queue.removeJobScheduler(row.id_server));
        yield* Effect.promise(() =>
          db
            .update(tasks)
            .set({ retries_failed: retriesFailed, status: 'stopped', updated_at: new Date() })
            .where(eq(tasks.id_task, task.id_task)),
        );
        yield* Effect.promise(() =>
          db.insert(logs).values({
            description: `Task ${task.id_task} auto-paused after ${retriesFailed} consecutive failures for server ${row.id_server}`,
            error_level: 'warning',
            action: CONSUMERS.PING_SERVER,
            affected_entity: 'TASKS',
          }),
        );
      } else {
        yield* Effect.promise(() =>
          db
            .update(tasks)
            .set({ retries_failed: retriesFailed, updated_at: new Date() })
            .where(eq(tasks.id_task, task.id_task)),
        );
      }
    }

    // fails the job so BullMQ's retry/backoff actually engages, instead of
    // silently swallowing the failure and marking the job "completed"
    return yield* Effect.fail(new Error(pingResult.left.message));
  }).pipe(
    Effect.tapErrorCause((cause) =>
      Effect.promise(() =>
        db.insert(logs).values({
          description: Cause.pretty(cause).slice(0, 5000),
          error_level: 'critical',
          action: CONSUMERS.PING_SERVER,
        }),
      ),
    ),
  );

export const QueuePingServiceLive = Layer.scoped(
  QueuePingService,
  Effect.gen(function* () {
    const connection = yield* RedisConnection;
    const db = yield* Db;
    const runtime = yield* Effect.runtime<never>();

    const queue = new Queue<AddPingTask>(QUEUE_PING_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
      },
    });

    const worker = new Worker<AddPingTask>(
      QUEUE_PING_NAME,
      (job) => Runtime.runPromise(runtime)(runPingJob(db, queue, job)),
      { connection },
    );

    yield* Effect.addFinalizer(() =>
      Effect.promise(async () => {
        await worker.close();
        await queue.close();
      }),
    );

    const upsertScheduler = (data: AddPingTask) =>
      Effect.promise(async () => {
        const job = await queue.upsertJobScheduler(
          data.idServer,
          { pattern: CRON_TIME.EVERY_MINUTE },
          { name: CONSUMERS.PING_SERVER, data },
        );
        return job.id as string;
      });

    const findTask = (idTask: string) =>
      Effect.tryPromise({
        try: () => db.query.tasks.findFirst({ where: eq(tasks.id_task, idTask) }),
        catch: (cause) => new DbError({ cause }),
      }).pipe(
        Effect.flatMap((task) =>
          task ? Effect.succeed(task) : new NotFoundError({ message: 'Task not found' }),
        ),
      );

    return {
      createPingTask: upsertScheduler,

      listTasks: () =>
        Effect.tryPromise({
          try: () => db.select().from(tasks),
          catch: (cause) => new DbError({ cause }),
        }),

      getTask: (idTask) => findTask(idTask),

      stopTask: (idTask) =>
        Effect.gen(function* () {
          const task = yield* findTask(idTask);
          if (task.status !== 'running') return task;

          if (task.id_server) {
            yield* Effect.promise(() => queue.removeJobScheduler(task.id_server as string));
          }

          const updated = yield* Effect.tryPromise({
            try: () =>
              db
                .update(tasks)
                .set({ status: 'stopped', updated_at: new Date() })
                .where(eq(tasks.id_task, idTask))
                .returning(),
            catch: (cause) => new DbError({ cause }),
          });
          return updated[0] ?? task;
        }),

      resumeTask: (idTask) =>
        Effect.gen(function* () {
          const task = yield* findTask(idTask);
          if (task.status !== 'stopped') return task;
          if (!task.id_server) {
            return yield* new NotFoundError({ message: 'Task has no server to resume' });
          }

          const server = yield* Effect.tryPromise({
            try: () =>
              db.query.servers.findFirst({ where: eq(servers.id_server, task.id_server as string) }),
            catch: (cause) => new DbError({ cause }),
          });
          if (!server) {
            return yield* new NotFoundError({ message: 'Server not found' });
          }

          yield* upsertScheduler({ idServer: server.id_server, idUser: server.id_user });

          const updated = yield* Effect.tryPromise({
            try: () =>
              db
                .update(tasks)
                .set({ status: 'running', retries_failed: 0, updated_at: new Date() })
                .where(eq(tasks.id_task, idTask))
                .returning(),
            catch: (cause) => new DbError({ cause }),
          });
          return updated[0] ?? task;
        }),

      deleteTaskForServer: (idServer) =>
        Effect.gen(function* () {
          const task = yield* Effect.tryPromise({
            try: () => db.query.tasks.findFirst({ where: eq(tasks.id_server, idServer) }),
            catch: (cause) => new DbError({ cause }),
          });
          if (!task || task.status === 'deleted') return;

          yield* Effect.promise(() => queue.removeJobScheduler(idServer));

          yield* Effect.tryPromise({
            try: () =>
              db
                .update(tasks)
                .set({ status: 'deleted', updated_at: new Date() })
                .where(eq(tasks.id_task, task.id_task)),
            catch: (cause) => new DbError({ cause }),
          });
        }),

      reconcile: () =>
        Effect.gen(function* () {
          const running = yield* Effect.tryPromise({
            try: () =>
              db
                .select({ idServer: tasks.id_server, idUser: servers.id_user })
                .from(tasks)
                .innerJoin(servers, eq(servers.id_server, tasks.id_server))
                .where(eq(tasks.status, 'running')),
            catch: (cause) => new DbError({ cause }),
          });

          yield* Effect.forEach(
            running,
            ({ idServer, idUser }) => upsertScheduler({ idServer: idServer as string, idUser }),
            { discard: true },
          );
        }),
    };
  }),
);
