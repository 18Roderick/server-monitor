import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context, Effect, Exit, Layer, Redacted } from 'effect';
import { eq } from 'drizzle-orm';
import type { Job, Queue } from 'bullmq';

vi.mock('@/Ping/ping', () => ({ makePing: vi.fn() }));

import { makePing } from '@/Ping/ping';
import { AppConfig } from '@/Config';
import { Db, DbLive, type Database } from '@/Db/Db';
import { logs, pings, servers, tasks, users } from '@/Db/schemas';
import { PingError } from '@/Errors';
import { runPingJob, type AddPingTask } from '@/Queue/QueuePing';
import type { PingEventsService } from '@/Queue/PingEvents';

/**
 * Exercises the QueuePing worker's job handler — the coordinator logic that
 * decides when a Task auto-pauses (see CONTEXT.md's Task lifecycle and ADR
 * 0003) — against the real Postgres container (see docker-compose.yml).
 * `makePing` is mocked so this never makes a real network call.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://monitoruser:123456@localhost:5432/pingdom';

const AppConfigTestLive = Layer.succeed(AppConfig, {
  databaseUrl: TEST_DATABASE_URL,
  port: 3000,
  redisHost: 'localhost',
  redisPort: 6379,
  redisPassword: undefined,
  jwtSecret: Redacted.make('test-secret'),
});

const TestLive = DbLive.pipe(Layer.provide(AppConfigTestLive));

const runDb = <A, E>(f: (db: Database) => Effect.Effect<A, E>) =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const db = yield* Db;
        return yield* f(db);
      }).pipe(Effect.provide(TestLive)),
    ),
  );

const exitDb = <A, E>(f: (db: Database) => Effect.Effect<A, E>) =>
  Effect.runPromiseExit(
    Effect.scoped(
      Effect.gen(function* () {
        const db = yield* Db;
        return yield* f(db);
      }).pipe(Effect.provide(TestLive)),
    ),
  );

const USER_ID = 'queue-ping-spec-user';
const SERVER_ID = 'queue-ping-spec-server';
const TASK_ID = 'queue-ping-spec-task';

const fakeJob = (data: AddPingTask) => ({ data }) as unknown as Job<AddPingTask>;

const fakePingEvents = () =>
  ({ publish: vi.fn(() => Effect.void) }) as unknown as Context.Tag.Service<
    typeof PingEventsService
  >;

const pingSuccess = (overrides: Partial<Record<string, unknown>> = {}) => ({
  inputHost: 'example.com',
  host: 'example.com',
  alive: true,
  output: 'PING example.com...',
  time: 12.3,
  times: [12.3],
  numeric_host: '93.184.216.34',
  min: 12.3,
  avg: 12.3,
  max: 12.3,
  stddev: 0,
  packetLoss: 0,
  ...overrides,
});

const resetTask = (retriesFailed: number) =>
  runDb((db) =>
    Effect.promise(() =>
      db
        .update(tasks)
        .set({ retries_failed: retriesFailed, status: 'running' })
        .where(eq(tasks.id_task, TASK_ID)),
    ),
  );

const resetServerIp = (ip: string | null) =>
  runDb((db) =>
    Effect.promise(() => db.update(servers).set({ ip }).where(eq(servers.id_server, SERVER_ID))),
  );

const getTask = () =>
  runDb((db) =>
    Effect.promise(() => db.query.tasks.findFirst({ where: eq(tasks.id_task, TASK_ID) })),
  );

const cleanup = () =>
  runDb((db) =>
    Effect.promise(async () => {
      await db.delete(logs).where(eq(logs.affected_entity, 'TASKS'));
      await db.delete(tasks).where(eq(tasks.id_server, SERVER_ID));
      await db.delete(servers).where(eq(servers.id_server, SERVER_ID));
      await db.delete(users).where(eq(users.id_user, USER_ID));
    }),
  );

describe('runPingJob (integration)', () => {
  beforeAll(async () => {
    await cleanup();
    await runDb((db) =>
      Effect.promise(async () => {
        await db.insert(users).values({
          id_user: USER_ID,
          name: 'Queue Ping',
          last_name: 'Spec',
          email: 'queue-ping-spec@example.com',
          password: 'unused',
        });
        await db.insert(servers).values({
          id_server: SERVER_ID,
          title: 'Queue ping spec server',
          url: 'https://example.com',
          worker_type: 'url',
          id_user: USER_ID,
        });
        await db.insert(tasks).values({
          id_task: TASK_ID,
          id_job: SERVER_ID,
          log: 'NO ISSUES',
          cron: '* * * * *',
          type: 'server',
          id_server: SERVER_ID,
        });
      }),
    );
  });

  afterAll(cleanup);

  beforeEach(() => {
    vi.mocked(makePing).mockReset();
  });

  it('records a Ping and backfills the Server ip on a successful check', async () => {
    await resetServerIp(null);
    vi.mocked(makePing).mockReturnValue(Effect.succeed(pingSuccess() as never));

    const fakeQueue = { removeJobScheduler: vi.fn(async () => {}) } as unknown as Queue<AddPingTask>;
    await runDb((db) =>
      runPingJob(db, fakeQueue, fakeJob({ idServer: SERVER_ID, idUser: USER_ID }), fakePingEvents()),
    );

    const server = await runDb((db) =>
      Effect.promise(() => db.query.servers.findFirst({ where: eq(servers.id_server, SERVER_ID) })),
    );
    expect(server?.ip).toBe('93.184.216.34');

    const recordedPings = await runDb((db) =>
      Effect.promise(() => db.select().from(pings).where(eq(pings.id_server, SERVER_ID))),
    );
    expect(recordedPings.length).toBeGreaterThan(0);
  });

  it('increments retries_failed without pausing before the 3rd consecutive failure', async () => {
    await resetTask(0);
    vi.mocked(makePing).mockReturnValue(Effect.fail(new PingError({ message: 'unreachable' })));
    const fakeQueue = { removeJobScheduler: vi.fn(async () => {}) } as unknown as Queue<AddPingTask>;

    const exit = await exitDb((db) =>
      runPingJob(db, fakeQueue, fakeJob({ idServer: SERVER_ID, idUser: USER_ID }), fakePingEvents()),
    );

    expect(Exit.isFailure(exit)).toBe(true);
    const task = await getTask();
    expect(task).toMatchObject({ retries_failed: 1, status: 'running' });
    expect(fakeQueue.removeJobScheduler).not.toHaveBeenCalled();
  });

  it('auto-pauses the Task on the 3rd consecutive failure', async () => {
    await resetTask(2);
    vi.mocked(makePing).mockReturnValue(Effect.fail(new PingError({ message: 'unreachable' })));
    const fakeQueue = { removeJobScheduler: vi.fn(async () => {}) } as unknown as Queue<AddPingTask>;

    const exit = await exitDb((db) =>
      runPingJob(db, fakeQueue, fakeJob({ idServer: SERVER_ID, idUser: USER_ID }), fakePingEvents()),
    );

    expect(Exit.isFailure(exit)).toBe(true);
    const task = await getTask();
    expect(task).toMatchObject({ retries_failed: 3, status: 'stopped' });
    expect(fakeQueue.removeJobScheduler).toHaveBeenCalledWith(SERVER_ID);
  });
});
