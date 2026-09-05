import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform';

import { SignInInput, SignUpInput, TokenResponse } from '@/Auth/Auth.schema';
import { ForbiddenError, InternalServerError } from '@/Errors';

export const AuthGroup = HttpApiGroup.make('Auth')
  .add(
    HttpApiEndpoint.post('signUp', '/auth/signup')
      .setPayload(SignUpInput)
      .addSuccess(TokenResponse)
      .addError(ForbiddenError)
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.post('signIn', '/auth/signin')
      .setPayload(SignInInput)
      .addSuccess(TokenResponse)
      .addError(ForbiddenError)
      .addError(InternalServerError),
  );
