import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Effect, Exit, Layer, Redacted } from 'effect';
import { eq } from 'drizzle-orm';
import type { Job } from 'bullmq';

import { AppConfig } from '@/Config';
import { Db, DbLive, type Database } from '@/Db/Db';
import { logs, servers, tasks, users } from '@/Db/schemas';
import type { AddPingTask } from '@/Queue/QueuePing';
import { runAddPingTaskJob, QUEUE_MANAGER_ACTIONS } from '@/Queue/QueueManager';

/**
 * Exercises the QueueManager worker's job handler against the real Postgres
 * container (see docker-compose.yml) — this is the coordinator logic ADR
 * 0003 calls out as previously buggy (a "server not found" fell through to
 * use `undefined`, and insert failures were silently swallowed).
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

const USER_ID = 'queue-manager-spec-user';
const SERVER_ID = 'queue-manager-spec-server';

const fakeJob = (data: AddPingTask, moveToFailed = vi.fn(async () => {})) =>
  ({ data, token: 'test-token', moveToFailed }) as unknown as Job<AddPingTask>;

const fakeQueuePing = (createPingTask = vi.fn(() => Effect.succeed('job-1'))) =>
  ({
    createPingTask,
    listTasks: () => Effect.succeed([]),
    getTask: () => Effect.die('not used in this test'),
    stopTask: () => Effect.die('not used in this test'),
    resumeTask: () => Effect.die('not used in this test'),
    deleteTaskForServer: () => Effect.succeed(undefined),
    reconcile: () => Effect.succeed(undefined),
  }) as unknown as Parameters<typeof runAddPingTaskJob>[1];

const cleanup = () =>
  runDb((db) =>
    Effect.promise(async () => {
      await db.delete(logs).where(eq(logs.action, QUEUE_MANAGER_ACTIONS.ADD_PING_TASK));
      await db.delete(tasks).where(eq(tasks.id_server, SERVER_ID));
      await db.delete(servers).where(eq(servers.id_server, SERVER_ID));
      await db.delete(users).where(eq(users.id_user, USER_ID));
    }),
  );

describe('runAddPingTaskJob (integration)', () => {
  beforeAll(async () => {
    await cleanup();
    await runDb((db) =>
      Effect.promise(async () => {
        await db.insert(users).values({
          id_user: USER_ID,
          name: 'Queue Manager',
          last_name: 'Spec',
          email: 'queue-manager-spec@example.com',
          password: 'unused',
        });
        await db.insert(servers).values({
          id_server: SERVER_ID,
          title: 'Queue manager spec server',
          url: 'https://example.com',
          worker_type: 'url',
          id_user: USER_ID,
        });
      }),
    );
  });

  afterAll(cleanup);

  it('creates a running Task row for the pinged Server', async () => {
    await runDb((db) =>
      runAddPingTaskJob(db, fakeQueuePing(), fakeJob({ idServer: SERVER_ID, idUser: USER_ID })),
    );

    const task = await runDb((db) =>
      Effect.promise(() => db.query.tasks.findFirst({ where: eq(tasks.id_server, SERVER_ID) })),
    );
    expect(task).toMatchObject({ id_server: SERVER_ID, status: 'running' });
  });

  it('is idempotent when a Task already exists for the Server', async () => {
    const before = await runDb((db) =>
      Effect.promise(() => db.query.tasks.findFirst({ where: eq(tasks.id_server, SERVER_ID) })),
    );

    await runDb((db) =>
      runAddPingTaskJob(db, fakeQueuePing(), fakeJob({ idServer: SERVER_ID, idUser: USER_ID })),
    );

    const after = await runDb((db) =>
      Effect.promise(() => db.query.tasks.findFirst({ where: eq(tasks.id_server, SERVER_ID) })),
    );
    expect(after?.id_task).toBe(before?.id_task);
  });

  it('fails and marks the BullMQ job failed when the Server no longer exists', async () => {
    const moveToFailed = vi.fn(async () => {});
    const job = fakeJob({ idServer: 'queue-manager-spec-missing-server', idUser: USER_ID }, moveToFailed);

    const exit = await exitDb((db) => runAddPingTaskJob(db, fakeQueuePing(), job));

    expect(Exit.isFailure(exit)).toBe(true);
    expect(moveToFailed).toHaveBeenCalledOnce();
  });
});
