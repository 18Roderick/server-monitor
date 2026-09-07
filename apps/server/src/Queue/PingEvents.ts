import { Context, Effect, Layer, Stream } from 'effect';
import IORedis from 'ioredis';

import { AppConfig } from '@/Config';

export const PING_EVENTS_CHANNEL = 'ping-events';

export type PingEvent =
  | {
      readonly type: 'ping';
      readonly idServer: string;
      readonly idUser: string;
      readonly isAlive: boolean;
      readonly avg: number;
      readonly createdAt: string;
    }
  | {
      readonly type: 'task-stopped' | 'task-resumed';
      readonly idServer: string;
      readonly idUser: string;
      readonly idTask: string;
    };

export class PingEventsService extends Context.Tag('PingEventsService')<
  PingEventsService,
  {
    readonly publish: (event: PingEvent) => Effect.Effect<void>;
    readonly subscribe: () => Stream.Stream<PingEvent>;
  }
>() {}

const makeConnection = (config: {
  readonly redisHost: string;
  readonly redisPort: number;
  readonly redisPassword: string | undefined;
}) =>
  new IORedis({
    host: config.redisHost,
    port: config.redisPort,
    password: config.redisPassword,
    maxRetriesPerRequest: null,
  });

export const PingEventsServiceLive = Layer.scoped(
  PingEventsService,
  Effect.gen(function* () {
    const config = yield* AppConfig;

    // BullMQ's connection is dedicated to queue traffic — pub/sub needs its
    // own connection, and each subscriber needs a dedicated one too (once an
    // ioredis client subscribes, it can't run any other command)
    const publisher = makeConnection(config);
    yield* Effect.addFinalizer(() => Effect.sync(() => publisher.disconnect()));

    return {
      publish: (event) =>
        Effect.promise(() => publisher.publish(PING_EVENTS_CHANNEL, JSON.stringify(event))).pipe(
          Effect.asVoid,
        ),

      subscribe: () =>
        Stream.asyncScoped<PingEvent>((emit) =>
          Effect.gen(function* () {
            const subscriber = makeConnection(config);
            yield* Effect.addFinalizer(() => Effect.sync(() => subscriber.disconnect()));

            subscriber.on('message', (_channel, message) => {
              try {
                emit.single(JSON.parse(message) as PingEvent);
              } catch {
                // ignore malformed messages rather than tear down the stream
              }
            });

            yield* Effect.promise(() => subscriber.subscribe(PING_EVENTS_CHANNEL));
          }),
        ),
    };
  }),
);
