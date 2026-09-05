import { Effect, Schema } from 'effect';
import { HttpApiSchema } from '@effect/platform';

export class NotFoundError extends Schema.TaggedError<NotFoundError>()(
  'NotFoundError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 404 }),
) {}

export class UnauthorizedError extends Schema.TaggedError<UnauthorizedError>()(
  'UnauthorizedError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 401 }),
) {}

export class ForbiddenError extends Schema.TaggedError<ForbiddenError>()(
  'ForbiddenError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 403 }),
) {}

/**
 * Internal-only: carries the raw cause for logging but is never returned to
 * clients directly — {@link hideInternalErrors} maps it to
 * {@link InternalServerError} at the HTTP boundary so DB internals never leak
 * into an API response or its OpenAPI schema.
 */
export class DbError extends Schema.TaggedError<DbError>()('DbError', {
  cause: Schema.Defect,
}) {}

export class InternalServerError extends Schema.TaggedError<InternalServerError>()(
  'InternalServerError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 500 }),
) {}

export class PingError extends Schema.TaggedError<PingError>()(
  'PingError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 502 }),
) {}

export const hideInternalErrors = <A, E, R>(effect: Effect.Effect<A, E | DbError, R>) =>
  effect.pipe(
    Effect.catchTag('DbError', () => new InternalServerError({ message: 'Internal server error' })),
  );
