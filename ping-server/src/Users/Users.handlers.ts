import { HttpApiBuilder } from '@effect/platform';
import { Effect } from 'effect';

import { Api } from '@/Http/Api';
import { UsersService } from '@/Users/Users.service';
import { FindAllUsersResponse, type UserSummary } from '@/Users/Users.schema';
import { hideInternalErrors } from '@/Errors';

export const UsersHandlersLive = HttpApiBuilder.group(Api, 'Users', (handlers) =>
  Effect.gen(function* () {
    const users = yield* UsersService;

    return handlers
      .handle('findAll', () =>
        users.findAll().pipe(Effect.map((result) => new FindAllUsersResponse({ result }))),
      )
      .handle('findOne', ({ path }) =>
        users.findOne(path.id).pipe(
          Effect.map((result) => result as readonly UserSummary[]),
          hideInternalErrors,
        ),
      )
      .handle('update', ({ path, payload }) =>
        users.update(path.id, payload).pipe(
          Effect.map((result) => result as readonly UserSummary[]),
          hideInternalErrors,
        ),
      )
      .handle('remove', ({ path }) => users.remove(path.id).pipe(hideInternalErrors));
  }),
);
