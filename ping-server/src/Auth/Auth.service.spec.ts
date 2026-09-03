import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Effect, Layer, Exit, Redacted } from 'effect';
import { eq } from 'drizzle-orm';

import { AppConfig } from '@/Config';
import { Db, DbLive } from '@/Db/Db';
import { users } from '@/Db/schemas';
import { Jwt, JwtLive } from '@/Auth/Jwt';
import { AuthService, AuthServiceLive } from '@/Auth/Auth.service';
import { SignInInput, SignUpInput } from '@/Auth/Auth.schema';

/**
 * Exercises AuthService against the real Postgres container (see docker-compose.yml).
 * This is the layer that a fully-mocked HTTP test (Api.integration.spec.ts) cannot cover,
 * and is what let the DB-level 500 on /auth/signup slip through undetected.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://monitoruser:123456@localhost:5432/pingdom';

const AppConfigTestLive = Layer.succeed(AppConfig, {
  databaseUrl: TEST_DATABASE_URL,
  port: 3000,
  redisHost: 'localhost',
  redisPort: 6379,
  redisPassword: undefined,
  jwtSecret: Redacted.make('test-secret'),
});

const TestLive = AuthServiceLive.pipe(
  Layer.provideMerge(DbLive),
  Layer.provideMerge(JwtLive),
  Layer.provideMerge(AppConfigTestLive),
);

const run = <A, E>(effect: Effect.Effect<A, E, AuthService | Db | Jwt>) =>
  Effect.runPromise(Effect.scoped(effect.pipe(Effect.provide(TestLive))));

const testEmail = (suffix: string) => `auth-service-spec-${suffix}@example.com`;

const cleanup = () =>
  run(
    Effect.gen(function* () {
      const db = yield* Db;
      yield* Effect.tryPromise(() =>
        db.delete(users).where(eq(users.email, testEmail('signup'))),
      );
      yield* Effect.tryPromise(() =>
        db.delete(users).where(eq(users.email, testEmail('signin'))),
      );
    }),
  );

describe('AuthService (integration)', () => {
  beforeAll(cleanup);
  afterAll(cleanup);

  it('signUp persists the user and returns a token', async () => {
    const result = await run(
      Effect.gen(function* () {
        const auth = yield* AuthService;
        return yield* auth.signUp(
          new SignUpInput({
            name: 'Auth Spec User',
            email: testEmail('signup'),
            password: 'Str0ng!Pass',
          }),
        );
      }),
    );

    expect(result.token).toEqual(expect.any(String));
  });

  it('signUp with an already-registered email is rejected', async () => {
    const email = testEmail('signup');
    const input = new SignUpInput({ name: 'Dup User', email, password: 'Str0ng!Pass' });

    const exit = await Effect.runPromiseExit(
      Effect.scoped(
        Effect.gen(function* () {
          const auth = yield* AuthService;
          yield* auth.signUp(input);
        }).pipe(Effect.provide(TestLive)),
      ),
    );

    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('signIn succeeds with the correct password and fails with the wrong one', async () => {
    const email = testEmail('signin');

    await run(
      Effect.gen(function* () {
        const auth = yield* AuthService;
        yield* auth.signUp(new SignUpInput({ name: 'Signin User', email, password: 'Str0ng!Pass' }));
      }),
    );

    const success = await run(
      Effect.gen(function* () {
        const auth = yield* AuthService;
        return yield* auth.signIn(new SignInInput({ email, password: 'Str0ng!Pass' }));
      }),
    );
    expect(success.token).toEqual(expect.any(String));

    const failureExit = await Effect.runPromiseExit(
      Effect.scoped(
        Effect.gen(function* () {
          const auth = yield* AuthService;
          yield* auth.signIn(new SignInInput({ email, password: 'wrong-password' }));
        }).pipe(Effect.provide(TestLive)),
      ),
    );
    expect(Exit.isFailure(failureExit)).toBe(true);
  });
});
