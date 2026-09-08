import { spawn } from 'node:child_process';
import dns from 'node:dns/promises';

import { Effect, Schema } from 'effect';

import { PingError } from '@/Errors';

export class PingResult extends Schema.Class<PingResult>('PingResult')({
  inputHost: Schema.String,
  host: Schema.String,
  alive: Schema.Boolean,
  output: Schema.String,
  time: Schema.Union(Schema.Number, Schema.Literal('unknown')),
  times: Schema.Array(Schema.Number),
  numeric_host: Schema.optional(Schema.String),
  min: Schema.Number,
  avg: Schema.Number,
  max: Schema.Number,
  stddev: Schema.Number,
  packetLoss: Schema.Number,
}) {}

const PING_TIMEOUT_MS = 10_000;
const PING_COUNT = 3;

export interface ParsedFpingResult {
  readonly times: readonly number[];
  readonly alive: boolean;
  readonly packetLoss: number;
  readonly min: number;
  readonly avg: number;
  readonly max: number;
  readonly stddev: number;
}

/**
 * `fping -C n` always reports its per-target line to stderr as
 * `<target> : <t1> <t2> ... <tn>`, with `-` in place of a lost packet's
 * time. A target fping couldn't probe at all (e.g. a resolution error, when
 * called without a pre-resolved address) reports a non-numeric message
 * instead — that's the signal to treat the run as unparseable.
 */
export const parseFpingOutput = (stderr: string): ParsedFpingResult | null => {
  const line = stderr
    .trim()
    .split('\n')
    .find((candidate) => candidate.includes(':'));
  if (!line) return null;

  const rawTokens = line.slice(line.indexOf(':') + 1).trim();
  const tokens = rawTokens.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const times: number[] = [];
  for (const token of tokens) {
    if (token === '-') continue;
    const value = Number(token);
    if (Number.isNaN(value)) return null;
    times.push(value);
  }

  const sent = tokens.length;
  const received = times.length;
  const alive = received > 0;
  const packetLoss = sent === 0 ? 100 : ((sent - received) / sent) * 100;
  const min = alive ? Math.min(...times) : 0;
  const max = alive ? Math.max(...times) : 0;
  const avg = alive ? times.reduce((sum, t) => sum + t, 0) / received : 0;
  const variance = alive
    ? times.reduce((sum, t) => sum + (t - avg) ** 2, 0) / received
    : 0;
  const stddev = Math.sqrt(variance);

  return { times, alive, packetLoss, min, avg, max, stddev };
};

const runFping = (destination: string): Effect.Effect<{ stderr: string }, PingError> =>
  Effect.async<{ stderr: string }, PingError>((resume) => {
    const child = spawn('fping', ['-e', '-C', String(PING_COUNT), '-q', destination]);
    let stderr = '';

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (cause) => {
      resume(Effect.fail(new PingError({ message: `Failed to spawn fping: ${String(cause)}` })));
    });
    child.on('close', () => {
      resume(Effect.succeed({ stderr }));
    });
  });

// resolution failure isn't fatal on its own — fping's own attempt against
// the raw destination will fail below and surface as a real PingError
const resolveNumericHost = (
  destination: string,
): Effect.Effect<{ address: string | undefined; resolutionError: string | undefined }> =>
  Effect.tryPromise({
    try: () => dns.lookup(destination).then((result) => result.address),
    catch: (cause) => cause,
  }).pipe(
    Effect.match({
      onFailure: (cause) => ({ address: undefined, resolutionError: String(cause) }),
      onSuccess: (address) => ({ address, resolutionError: undefined }),
    }),
  );

export const makePing = (destination: string): Effect.Effect<PingResult, PingError> =>
  Effect.gen(function* () {
    const { address: numericHost, resolutionError } = yield* resolveNumericHost(destination);
    const { stderr } = yield* runFping(numericHost ?? destination);
    const parsed = parseFpingOutput(stderr);

    if (!parsed) {
      // fping run with -q reports nothing at all — not even to stderr — for
      // a target it can't resolve, so surface the earlier DNS failure instead
      const detail = resolutionError ?? (stderr.trim() || 'no output');
      return yield* Effect.fail(
        new PingError({ message: `fping produced no parseable output for ${destination}: ${detail}` }),
      );
    }

    return new PingResult({
      inputHost: destination,
      host: destination,
      alive: parsed.alive,
      output: stderr.trim(),
      time: parsed.times[0] ?? 'unknown',
      times: [...parsed.times],
      numeric_host: numericHost,
      min: parsed.min,
      avg: parsed.avg,
      max: parsed.max,
      stddev: parsed.stddev,
      packetLoss: parsed.packetLoss,
    });
  }).pipe(
    Effect.timeoutFail({
      duration: `${PING_TIMEOUT_MS} millis`,
      onTimeout: () => new PingError({ message: `Ping to ${destination} timed out` }),
    }),
  );
