import { Context, Effect, Layer, Redacted } from 'effect';
import { HttpApiMiddleware, HttpApiSecurity } from '@effect/platform';

import { Jwt, type JwtPayload } from '@/Auth/Jwt';
import { UnauthorizedError } from '@/Errors';

export class CurrentUser extends Context.Tag('CurrentUser')<CurrentUser, JwtPayload>() {}

export class Authorization extends HttpApiMiddleware.Tag<Authorization>()('Authorization', {
  failure: UnauthorizedError,
  provides: CurrentUser,
  security: {
    bearer: HttpApiSecurity.bearer,
  },
}) {}

export const AuthorizationLive = Layer.effect(
  Authorization,
  Effect.gen(function* () {
    const jwtService = yield* Jwt;

    return {
      bearer: (token: Redacted.Redacted) => jwtService.verify(Redacted.value(token)),
    };
  }),
);
