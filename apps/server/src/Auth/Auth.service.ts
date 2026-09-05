import { Context, Effect, Layer } from 'effect';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { Db } from '@/Db/Db';
import { users } from '@/Db/schemas';
import { Jwt } from '@/Auth/Jwt';
import { SignInInput, SignUpInput, TokenResponse } from '@/Auth/Auth.schema';
import { DbError, ForbiddenError } from '@/Errors';

const ROUNDS = 10;

export class AuthService extends Context.Tag('AuthService')<
  AuthService,
  {
    readonly signUp: (input: SignUpInput) => Effect.Effect<TokenResponse, DbError | ForbiddenError>;
    readonly signIn: (input: SignInInput) => Effect.Effect<TokenResponse, DbError | ForbiddenError>;
  }
>() {}

export const AuthServiceLive = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    const db = yield* Db;
    const jwtService = yield* Jwt;

    const signUp = (input: SignUpInput) =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () => db.query.users.findFirst({ where: eq(users.email, input.email) }),
          catch: (cause) => new DbError({ cause }),
        });

        if (existing) {
          return yield* new ForbiddenError({ message: 'Email already exists' });
        }

        const hash = yield* Effect.promise(() => bcrypt.hash(input.password, ROUNDS));

        yield* Effect.tryPromise({
          try: () =>
            db.insert(users).values({
              name: input.name,
              email: input.email,
              password: hash,
              last_name: '',
              status: 'active',
            }),
          catch: (cause) => new DbError({ cause }),
        });

        const created = yield* Effect.tryPromise({
          try: () => db.query.users.findFirst({ where: eq(users.email, input.email) }),
          catch: (cause) => new DbError({ cause }),
        });

        if (!created) {
          return yield* new DbError({ cause: 'user not found after insert' });
        }

        const token = yield* jwtService.sign({ sub: created.id_user, email: created.email });
        return new TokenResponse({ token });
      });

    const signIn = (input: SignInInput) =>
      Effect.gen(function* () {
        const user = yield* Effect.tryPromise({
          try: () => db.query.users.findFirst({ where: eq(users.email, input.email) }),
          catch: (cause) => new DbError({ cause }),
        });

        if (!user) {
          return yield* new ForbiddenError({ message: 'Email or password invalid' });
        }

        const passwordMatches = yield* Effect.promise(() =>
          bcrypt.compare(input.password, user.password),
        );

        if (!passwordMatches) {
          return yield* new ForbiddenError({ message: 'Email or password invalid' });
        }

        const token = yield* jwtService.sign({ sub: user.id_user, email: user.email });
        return new TokenResponse({ token });
      });

    return { signUp, signIn };
  }),
);
