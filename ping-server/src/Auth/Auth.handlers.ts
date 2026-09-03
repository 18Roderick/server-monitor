import { HttpApiBuilder } from '@effect/platform';
import { Effect } from 'effect';

import { Api } from '@/Http/Api';
import { AuthService } from '@/Auth/Auth.service';
import { hideInternalErrors } from '@/Errors';

export const AuthHandlersLive = HttpApiBuilder.group(Api, 'Auth', (handlers) =>
  Effect.gen(function* () {
    const auth = yield* AuthService;

    return handlers
      .handle('signUp', ({ payload }) => auth.signUp(payload).pipe(hideInternalErrors))
      .handle('signIn', ({ payload }) => auth.signIn(payload).pipe(hideInternalErrors));
  }),
);
