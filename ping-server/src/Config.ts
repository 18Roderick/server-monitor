import { Config, Context, Effect, Layer, Redacted } from 'effect';

export class AppConfig extends Context.Tag('AppConfig')<
  AppConfig,
  {
    readonly databaseUrl: string;
    readonly port: number;
    readonly redisHost: string;
    readonly redisPort: number;
    readonly redisPassword: string | undefined;
    readonly jwtSecret: Redacted.Redacted<string>;
  }
>() {}

export const AppConfigLive = Layer.effect(
  AppConfig,
  Effect.gen(function* () {
    const databaseUrl = yield* Config.string('DATABASE_URL');
    const port = yield* Config.integer('PORT').pipe(Config.withDefault(3000));
    const redisHost = yield* Config.string('REDIS_HOST');
    const redisPort = yield* Config.integer('REDIS_PORT');
    const redisPassword = yield* Config.string('REDIS_PASSWORD').pipe(
      Config.withDefault(undefined as string | undefined),
    );
    const jwtSecret = yield* Config.redacted('JWT_SECRET');

    return { databaseUrl, port, redisHost, redisPort, redisPassword, jwtSecret };
  }),
);
