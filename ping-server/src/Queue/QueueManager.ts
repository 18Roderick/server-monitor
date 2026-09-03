import { Cause, Context, Effect, Layer, Runtime } from 'effect';
import { Queue, Worker, type Job } from 'bullmq';
import { eq } from 'drizzle-orm';

import { RedisConnection } from '@/Queue/Connection';
import { Db, type Database } from '@/Db/Db';
import { logs, servers, tasks } from '@/Db/schemas';
import { CRON_TIME, QueuePingService, type AddPingTask } from '@/Queue/QueuePing';

export const QUEUE_MANAGER_NAME = '{QUEUE_MANAGER}';

export enum QUEUE_MANAGER_ACTIONS {
  ADD_PING_TASK = 'ADD_PING_TASK',
}

export class QueueManagerService extends Context.Tag('QueueManagerService')<
  QueueManagerService,
  {
    readonly addServerPing: (data: AddPingTask) => Effect.Effect<void>;
  }
>() {}

const runAddPingTaskJob = (
  db: Database,
  queuePing: Context.Tag.Service<typeof QueuePingService>,
  job: Job<AddPingTask>,
) =>
  Effect.gen(function* () {
    const server = yield* Effect.promise(() =>
      db.query.servers.findFirst({ where: eq(servers.id_server, job.data.idServer) }),
    );

    if (!server) {
      // fixed: the original code fell through to use `server` as undefined
      // after marking the job failed instead of stopping here
      yield* Effect.promise(() => job.moveToFailed(new Error('SERVER NOT FOUND'), job.token ?? ''));
      return yield* Effect.fail(new Error(`SERVER NOT FOUND: ${job.data.idServer}`));
    }

    const jobId = yield* queuePing.createPingTask({
      idServer: server.id_server,
      idUser: server.id_user,
    });

    // an active Server has exactly one live Task — if a retry lands here after
    // the row was already created, this is a no-op instead of a duplicate
    yield* Effect.promise(() =>
      db
        .insert(tasks)
        .values({
          id_job: jobId,
          cron: CRON_TIME.EVERY_MINUTE,
          type: 'server',
          log: 'NO ISSUES',
          id_server: server.id_server,
        })
        .onConflictDoNothing({ target: tasks.id_server }),
    );
  }).pipe(
    // fixed: the original catch here was empty, silently swallowing insert
    // failures and leaving a repeatable job with no matching `tasks` row
    Effect.tapErrorCause((cause) =>
      Effect.promise(() =>
        db.insert(logs).values({
          description: Cause.pretty(cause).slice(0, 5000),
          error_level: 'critical',
          action: QUEUE_MANAGER_ACTIONS.ADD_PING_TASK,
        }),
      ),
    ),
  );

export const QueueManagerServiceLive = Layer.scoped(
  QueueManagerService,
  Effect.gen(function* () {
    const connection = yield* RedisConnection;
    const db = yield* Db;
    const queuePing = yield* QueuePingService;
    const runtime = yield* Effect.runtime<never>();

    const queue = new Queue<AddPingTask>(QUEUE_MANAGER_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
      },
    });

    const worker = new Worker<AddPingTask>(
      QUEUE_MANAGER_NAME,
      (job) => Runtime.runPromise(runtime)(runAddPingTaskJob(db, queuePing, job)),
      { connection },
    );

    yield* Effect.addFinalizer(() =>
      Effect.promise(async () => {
        await worker.close();
        await queue.close();
      }),
    );

    return {
      addServerPing: (data) =>
        Effect.promise(() => queue.add(QUEUE_MANAGER_ACTIONS.ADD_PING_TASK, data)).pipe(
          Effect.asVoid,
        ),
    };
  }),
);
