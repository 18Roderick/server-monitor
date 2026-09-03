import { Cause, Context, Effect, Layer, Runtime } from 'effect';
import { Queue, Worker, type Job } from 'bullmq';
import { DateTime } from 'luxon';

import { RedisConnection } from '@/Queue/Connection';
import { Db, type Database } from '@/Db/Db';
import { logs } from '@/Db/schemas';
import { summaryPingByRange } from '@/Jobs/SummaryPings';

export const QUEUE_JOBS_NAME = '{QUEUE_JOBS}';

export enum PROCESS {
  HOURLY_PROCESS = 'HOURLY_PROCESS',
  DAILY_PROCESS = 'DAILY_PROCESS',
}

// same cron expressions as the original @nestjs/schedule CronExpression values
const EVERY_2_HOURS = '0 */2 * * *';
const EVERY_DAY_AT_MIDNIGHT = '0 0 * * *';

const hourlyRange = () => {
  const date = DateTime.now().startOf('hour');
  return { start: date.startOf('hour'), end: date.minus({ hour: 1 }).endOf('hour') };
};

const dailyRange = () => {
  const date = DateTime.now();
  const start = date.minus({ hour: 5 }).startOf('day');
  return { start, end: start.endOf('day') };
};

const runSummaryJob = (db: Database, job: Job) =>
  Effect.gen(function* () {
    const { start, end } = job.name === PROCESS.HOURLY_PROCESS ? hourlyRange() : dailyRange();
    yield* summaryPingByRange(db, start, end);
  }).pipe(
    Effect.tapErrorCause((cause) =>
      Effect.promise(() =>
        db.insert(logs).values({
          description: Cause.pretty(cause).slice(0, 5000),
          action: job.name,
          affected_entity: 'PINGS',
        }),
      ),
    ),
  );

export class SchedulerService extends Context.Tag('SchedulerService')<
  SchedulerService,
  Record<string, never>
>() {}

export const SchedulerServiceLive = Layer.scoped(
  SchedulerService,
  Effect.gen(function* () {
    const connection = yield* RedisConnection;
    const db = yield* Db;
    const runtime = yield* Effect.runtime<never>();

    const queue = new Queue(QUEUE_JOBS_NAME, { connection });

    const worker = new Worker(
      QUEUE_JOBS_NAME,
      (job) => Runtime.runPromise(runtime)(runSummaryJob(db, job)),
      { connection },
    );

    // registered in the background so a slow/unreachable Redis doesn't block
    // the HTTP server from starting to listen
    yield* Effect.forkDaemon(
      Effect.promise(() =>
        queue.upsertJobScheduler(PROCESS.HOURLY_PROCESS, { pattern: EVERY_2_HOURS }, {
          name: PROCESS.HOURLY_PROCESS,
        }),
      ),
    );
    yield* Effect.forkDaemon(
      Effect.promise(() =>
        queue.upsertJobScheduler(PROCESS.DAILY_PROCESS, { pattern: EVERY_DAY_AT_MIDNIGHT }, {
          name: PROCESS.DAILY_PROCESS,
        }),
      ),
    );

    yield* Effect.addFinalizer(() =>
      Effect.promise(async () => {
        await worker.close();
        await queue.close();
      }),
    );

    return {};
  }),
);
