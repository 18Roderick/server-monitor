import { Context, Effect, Layer } from 'effect';
import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { Db } from '@/Db/Db';
import { pings, servers } from '@/Db/schemas';
import { DbError, NotFoundError } from '@/Errors';

// Pings are recorded every minute (~1,440 rows/day/server) — findAll always
// caps the result, range filter or not, so a client can never pull an
// unbounded history in one request.
const PINGS_FIND_ALL_LIMIT = 1000;

export class PingsService extends Context.Tag('PingsService')<
  PingsService,
  {
    readonly findAll: (
      idUser: string,
      idServer: string,
      range?: { readonly from?: Date; readonly to?: Date },
    ) => Effect.Effect<unknown, DbError>;
    // no mutable fields exist on a Ping (see CONTEXT.md: it is a recorded
    // measurement, not an editable record) — ownership is still enforced so a
    // future implementation can't reintroduce the IDOR this replaced.
    readonly update: (idUser: string, idPing: string) => Effect.Effect<string, DbError | NotFoundError>;
    readonly remove: (idUser: string, idPing: string) => Effect.Effect<void, DbError | NotFoundError>;
  }
>() {}

export const PingsServiceLive = Layer.effect(
  PingsService,
  Effect.gen(function* () {
    const db = yield* Db;

    // a Ping only carries ownership transitively through its Server
    const findOwnedPing = (idUser: string, idPing: string) =>
      Effect.tryPromise({
        try: () =>
          db
            .select({ id_ping: pings.id_ping })
            .from(pings)
            .innerJoin(servers, eq(servers.id_server, pings.id_server))
            .where(and(eq(pings.id_ping, idPing), eq(servers.id_user, idUser)))
            .limit(1),
        catch: (cause) => new DbError({ cause }),
      });

    return {
      findAll: (idUser, idServer, range) =>
        Effect.tryPromise({
          try: () =>
            db
              .select({
                id_ping: pings.id_ping,
                times: pings.times,
                packet_loss: pings.packet_loss,
                min: pings.min,
                max: pings.max,
                avg: pings.avg,
                log: pings.log,
                is_alive: pings.is_alive,
                numeric_host: pings.numeric_host,
                created_at: pings.created_at,
                id_server: pings.id_server,
              })
              .from(pings)
              .innerJoin(servers, eq(servers.id_server, pings.id_server))
              .where(
                and(
                  eq(pings.id_server, idServer),
                  eq(servers.id_user, idUser),
                  range?.from ? gte(pings.created_at, range.from) : undefined,
                  range?.to ? lte(pings.created_at, range.to) : undefined,
                ),
              )
              .orderBy(desc(pings.created_at))
              .limit(PINGS_FIND_ALL_LIMIT),
          catch: (cause) => new DbError({ cause }),
        }),

      update: (idUser, idPing) =>
        Effect.gen(function* () {
          const owned = yield* findOwnedPing(idUser, idPing);
          if (owned.length < 1) {
            return yield* new NotFoundError({ message: 'Ping not found' });
          }
          // Pings have no mutable fields — see the type comment above.
          return `This action updates a #${idPing} ping`;
        }),

      remove: (idUser, idPing) =>
        Effect.gen(function* () {
          const owned = yield* findOwnedPing(idUser, idPing);
          if (owned.length < 1) {
            return yield* new NotFoundError({ message: 'Ping not found' });
          }

          yield* Effect.tryPromise({
            try: () => db.delete(pings).where(eq(pings.id_ping, idPing)),
            catch: (cause) => new DbError({ cause }),
          });
        }),
    };
  }),
);
