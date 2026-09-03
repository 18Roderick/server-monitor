import { HttpApiBuilder } from '@effect/platform';
import { Effect } from 'effect';

import { Api } from '@/Http/Api';
import { CurrentUser } from '@/Auth/CurrentUser';
import { ServersService } from '@/Servers/Servers.service';
import { DeletedResponse, type ServerEntity, type ServerSummary } from '@/Servers/Servers.schema';
import { hideInternalErrors } from '@/Errors';

export const ServersHandlersLive = HttpApiBuilder.group(Api, 'Servers', (handlers) =>
  Effect.gen(function* () {
    const servers = yield* ServersService;

    return handlers
      .handle('getUserServers', () =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const result = yield* servers.getUserServers(user.sub);
          return result as readonly ServerSummary[];
        }).pipe(hideInternalErrors),
      )
      .handle('getServer', ({ path }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const result = yield* servers.getServer(user.sub, path.id);
          return result as readonly ServerSummary[];
        }).pipe(hideInternalErrors),
      )
      .handle('create', ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const result = yield* servers.create(payload, user.sub);
          return result as ServerEntity;
        }).pipe(hideInternalErrors),
      )
      .handle('updateUserServer', ({ path, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const result = yield* servers.updateUserServer(path.id, user.sub, payload);
          return result as readonly ServerEntity[];
        }).pipe(hideInternalErrors),
      )
      .handle('deleteServer', ({ path }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* servers.deleteServer(path.id, user.sub);
          return new DeletedResponse({ deleted: true });
        }).pipe(hideInternalErrors),
      );
  }),
);
