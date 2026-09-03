import { Context, Effect, Layer, Redacted } from 'effect';
import jwt from 'jsonwebtoken';

import { AppConfig } from '@/Config';
import { UnauthorizedError } from '@/Errors';

export interface JwtPayload {
  readonly sub: string;
  readonly email: string;
}

export class Jwt extends Context.Tag('Jwt')<
  Jwt,
  {
    readonly sign: (payload: JwtPayload) => Effect.Effect<string>;
    readonly verify: (token: string) => Effect.Effect<JwtPayload, UnauthorizedError>;
  }
>() {}

export const JwtLive = Layer.effect(
  Jwt,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const secret = Redacted.value(config.jwtSecret);

    return {
      sign: (payload) =>
        Effect.sync(() => jwt.sign(payload, secret, { expiresIn: '1h' })),
      verify: (token) =>
        Effect.try({
          try: () => jwt.verify(token, secret) as JwtPayload,
          catch: () => new UnauthorizedError({ message: 'Invalid or expired token' }),
        }),
    };
  }),
);
