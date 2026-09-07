import { HttpApiBuilder } from '@effect/platform';
import { Effect } from 'effect';

import { Api } from '@/Http/Api';
import { CurrentUser } from '@/Auth/CurrentUser';
import { PingsService } from '@/Pings/Pings.service';
import { PingStubResponse, type PingEntity } from '@/Pings/Pings.schema';
import { DeletedResponse } from '@/Servers/Servers.schema';
import { hideInternalErrors } from '@/Errors';

export const PingsHandlersLive = HttpApiBuilder.group(Api, 'Pings', (handlers) =>
  Effect.gen(function* () {
    const pings = yield* PingsService;

    return handlers
      .handle('findAll', ({ path, urlParams }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const result = yield* pings.findAll(user.sub, path.id, {
            from: urlParams.from,
            to: urlParams.to,
          });
          return result as readonly PingEntity[];
        }).pipe(hideInternalErrors),
      )
      .handle('update', ({ path }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const result = yield* pings.update(user.sub, path.id);
          return new PingStubResponse({ result });
        }).pipe(hideInternalErrors),
      )
      .handle('remove', ({ path }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* pings.remove(user.sub, path.id);
          return new DeletedResponse({ deleted: true });
        }).pipe(hideInternalErrors),
      );
  }),
);
