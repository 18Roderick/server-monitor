import { createServer } from 'node:http';
import { Effect, Layer } from 'effect';
import { HttpApiBuilder, HttpApiScalar, HttpMiddleware } from '@effect/platform';
import { NodeHttpServer } from '@effect/platform-node';

import { AppConfig } from '@/Config';
import { Api } from '@/Http/Api';
import { AuthorizationLive } from '@/Auth/CurrentUser';
import { AuthHandlersLive } from '@/Auth/Auth.handlers';
import { UsersHandlersLive } from '@/Users/Users.handlers';
import { ServersHandlersLive } from '@/Servers/Servers.handlers';
import { PingsHandlersLive } from '@/Pings/Pings.handlers';
import { TaskHandlersLive } from '@/Queue/Task.handlers';

const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(AuthHandlersLive),
  Layer.provide(UsersHandlersLive),
  Layer.provide(ServersHandlersLive),
  Layer.provide(PingsHandlersLive),
  Layer.provide(TaskHandlersLive),
  Layer.provide(AuthorizationLive),
);

const DocsLive = HttpApiScalar.layer({ path: '/docs' });

const HttpLive = HttpApiBuilder.serve((app) => HttpMiddleware.cors()(HttpMiddleware.logger(app))).pipe(
  Layer.provide(DocsLive),
  Layer.provide(ApiLive),
);

export const HttpServerLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* AppConfig;
    return HttpLive.pipe(
      Layer.provide(NodeHttpServer.layer(() => createServer(), { port: config.port })),
    );
  }),
);
