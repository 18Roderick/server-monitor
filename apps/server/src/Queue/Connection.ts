import { Context, Effect, Layer } from 'effect';
import IORedis from 'ioredis';

import { AppConfig } from '@/Config';

export class RedisConnection extends Context.Tag('RedisConnection')<
  RedisConnection,
  IORedis
>() {}

export const RedisConnectionLive = Layer.scoped(
  RedisConnection,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const connection = new IORedis({
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword,
      maxRetriesPerRequest: null,
      retryStrategy: (attempt) => Math.min(attempt * 500, 5_000),
    });
    yield* Effect.addFinalizer(() => Effect.sync(() => connection.disconnect()));
    return connection;
  }),
);
