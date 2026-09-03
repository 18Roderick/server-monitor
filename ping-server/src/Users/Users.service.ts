import { Context, Effect, Layer } from 'effect';
import { eq } from 'drizzle-orm';

import { Db } from '@/Db/Db';
import { users } from '@/Db/schemas';
import { UpdateUserInput } from '@/Users/Users.schema';
import { DbError, NotFoundError } from '@/Errors';

const userProjection = {
  email: users.email,
  name: users.name,
  lastName: users.last_name,
  updatedAt: users.updated_at,
};

export class UsersService extends Context.Tag('UsersService')<
  UsersService,
  {
    readonly findAll: () => Effect.Effect<string>;
    readonly findOne: (userId: string) => Effect.Effect<unknown, DbError>;
    readonly update: (
      userId: string,
      input: UpdateUserInput,
    ) => Effect.Effect<unknown, DbError | NotFoundError>;
    readonly remove: (userId: string) => Effect.Effect<{ affected: unknown }, DbError | NotFoundError>;
  }
>() {}

export const UsersServiceLive = Layer.effect(
  UsersService,
  Effect.gen(function* () {
    const db = yield* Db;

    const getUser = (userId: string) =>
      Effect.tryPromise({
        try: () => db.select(userProjection).from(users).where(eq(users.id_user, userId)),
        catch: (cause) => new DbError({ cause }),
      });

    return {
      // preserved as-is: only meant to be available for admins, not implemented yet
      findAll: () => Effect.succeed('This action returns all user'),

      findOne: (userId) => getUser(userId),

      update: (userId, input) =>
        Effect.gen(function* () {
          const existing = yield* getUser(userId);
          if (existing.length < 1) {
            return yield* new NotFoundError({ message: 'user not found' });
          }

          yield* Effect.tryPromise({
            try: () => db.update(users).set(input).where(eq(users.id_user, userId)),
            catch: (cause) => new DbError({ cause }),
          });

          return yield* getUser(userId);
        }),

      remove: (userId) =>
        Effect.gen(function* () {
          const existing = yield* getUser(userId);
          if (existing.length < 1) {
            return yield* new NotFoundError({ message: 'user not found' });
          }

          const deleted = yield* Effect.tryPromise({
            try: () => db.delete(users).where(eq(users.id_user, userId)),
            catch: (cause) => new DbError({ cause }),
          });

          return { affected: deleted[0] };
        }),
    };
  }),
);
