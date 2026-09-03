import { Effect, Schema } from 'effect';
import ping from 'ping';

import { PingError } from '@/Errors';

const NumberFromString = Schema.NumberFromString;

export class PingResult extends Schema.Class<PingResult>('PingResult')({
  inputHost: Schema.String,
  host: Schema.String,
  alive: Schema.Boolean,
  output: Schema.String,
  time: Schema.Union(Schema.Number, Schema.Literal('unknown')),
  times: Schema.Array(Schema.Number),
  numeric_host: Schema.optional(Schema.String),
  min: NumberFromString,
  avg: NumberFromString,
  max: NumberFromString,
  stddev: NumberFromString,
  packetLoss: NumberFromString,
}) {}

const PING_TIMEOUT_MS = 10_000;

export const makePing = (destination: string): Effect.Effect<PingResult, PingError> =>
  Effect.tryPromise({
    try: () => ping.promise.probe(destination),
    catch: (cause) => new PingError({ message: `Ping probe failed: ${String(cause)}` }),
  }).pipe(
    Effect.flatMap((data) =>
      Schema.decodeUnknown(PingResult)(data).pipe(
        Effect.mapError(
          (cause) => new PingError({ message: `Unexpected ping output: ${String(cause)}` }),
        ),
      ),
    ),
    Effect.timeoutFail({
      duration: `${PING_TIMEOUT_MS} millis`,
      onTimeout: () => new PingError({ message: `Ping to ${destination} timed out` }),
    }),
  );
