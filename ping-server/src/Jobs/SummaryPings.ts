import { Effect } from 'effect';
import { DateTime } from 'luxon';
import { and, avg, gte, lte, max, min, sql } from 'drizzle-orm';

import type { Database } from '@/Db/Db';
import { pings, type PingInsert } from '@/Db/schemas';
import { DbError } from '@/Errors';

const BATCH_SIZE = 10;

export const summaryPingByRange = (
  db: Database,
  startDate: DateTime,
  endDate: DateTime,
): Effect.Effect<void, DbError> =>
  Effect.gen(function* () {
    yield* Effect.tryPromise({
      try: () =>
        db.transaction(async (ctx) => {
          const groupedPings = await ctx
            .select({
              idServer: pings.id_server,
              times: sql<number>`${avg(pings.times)}`.as('times'),
              avg: sql<number>`avg(${pings.avg})`.as('avg'),
              min: sql<number>`${min(pings.avg)}`.as('min'),
              max: sql<number>`${max(pings.avg)}`.as('max'),
              numericHost: max(pings.numeric_host).as('numericHost'),
              packetLoss: sql<number>`${avg(pings.packet_loss)}`.as('packetLoss'),
              isAlive: sql<number>`CASE WHEN ${avg(pings.is_alive)} >= 0.5 THEN 1 ELSE 0 END`.as(
                'isAlive',
              ),
            })
            .from(pings)
            .where(
              and(
                gte(pings.created_at, startDate.toJSDate()),
                lte(pings.created_at, endDate.toJSDate()),
              ),
            )
            .groupBy(pings.id_server);

          await ctx
            .delete(pings)
            .where(
              and(
                gte(pings.created_at, startDate.toJSDate()),
                lte(pings.created_at, endDate.toJSDate()),
              ),
            );

          for (let index = 0; index < groupedPings.length; index += BATCH_SIZE) {
            const part = groupedPings.slice(index, index + BATCH_SIZE).map(
              (g) =>
                ({
                  id_server: g.idServer,
                  times: g.times,
                  packet_loss: g.packetLoss,
                  min: g.min,
                  max: g.max,
                  avg: g.avg,
                  log: 'SUMARIZE OF THE HOUR',
                  is_alive: g.isAlive,
                  numeric_host: g.numericHost ?? '',
                }) satisfies PingInsert,
            );

            if (part.length > 0) {
              await ctx.insert(pings).values(part);
            }
          }
        }),
      catch: (cause) => new DbError({ cause }),
    });
  });
