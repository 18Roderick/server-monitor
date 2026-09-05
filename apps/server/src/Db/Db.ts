import { Context, Effect, Layer } from 'effect';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { AppConfig } from '@/Config';
import * as schema from '@/Db/schemas';

export type Database = PostgresJsDatabase<typeof schema>;

export class Db extends Context.Tag('Db')<Db, Database>() {}

export const DbLive = Layer.scoped(
  Db,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const connection = postgres(config.databaseUrl, { ssl: 'prefer' });
    yield* Effect.addFinalizer(() => Effect.promise(() => connection.end()));
    return drizzle(connection, { schema });
  }),
);
