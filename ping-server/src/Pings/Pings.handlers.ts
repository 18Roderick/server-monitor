import { HttpApiBuilder } from '@effect/platform';
import { Effect } from 'effect';

import { Api } from '@/Http/Api';
import { PingsService } from '@/Pings/Pings.service';
import { PingStubResponse, type PingEntity } from '@/Pings/Pings.schema';
import { hideInternalErrors } from '@/Errors';

export const PingsHandlersLive = HttpApiBuilder.group(Api, 'Pings', (handlers) =>
  Effect.gen(function* () {
    const pings = yield* PingsService;

    return handlers
      .handle('findAll', ({ path }) =>
        pings.findAll(path.id).pipe(
          Effect.map((result) => result as readonly PingEntity[]),
          hideInternalErrors,
        ),
      )
      .handle('update', ({ path }) =>
        pings.update(path.id).pipe(Effect.map((result) => new PingStubResponse({ result }))),
      )
      .handle('remove', ({ path }) =>
        pings.remove(path.id).pipe(Effect.map((result) => new PingStubResponse({ result }))),
      );
  }),
);
