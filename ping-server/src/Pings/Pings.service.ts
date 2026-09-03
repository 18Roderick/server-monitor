import { Context, Effect, Layer } from 'effect';
import { eq } from 'drizzle-orm';

import { Db } from '@/Db/Db';
import { pings } from '@/Db/schemas';
import { DbError } from '@/Errors';

export class PingsService extends Context.Tag('PingsService')<
  PingsService,
  {
    readonly findAll: (idServer: string) => Effect.Effect<unknown, DbError>;
    readonly update: (id: string) => Effect.Effect<string>;
    readonly remove: (id: string) => Effect.Effect<string>;
  }
>() {}

export const PingsServiceLive = Layer.effect(
  PingsService,
  Effect.gen(function* () {
    const db = yield* Db;

    return {
      findAll: (idServer) =>
        Effect.tryPromise({
          try: () => db.select().from(pings).where(eq(pings.id_server, idServer)),
          catch: (cause) => new DbError({ cause }),
        }),

      // not implemented yet in the original either — preserved as a stub
      update: (id) => Effect.succeed(`This action updates a #${id} ping`),
      remove: (id) => Effect.succeed(`This action removes a #${id} ping`),
    };
  }),
);
