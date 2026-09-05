import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform';
import { Schema } from 'effect';

import { Authorization } from '@/Auth/CurrentUser';
import { IdParam } from '@/Http/Params';
import {
  FindAllUsersResponse,
  RemoveUserResponse,
  UpdateUserInput,
  UserSummary,
} from '@/Users/Users.schema';
import { InternalServerError, NotFoundError } from '@/Errors';

export const UsersGroup = HttpApiGroup.make('Users')
  .add(HttpApiEndpoint.get('findAll', '/user').addSuccess(FindAllUsersResponse))
  .add(
    HttpApiEndpoint.get('findOne', '/user/:id')
      .setPath(IdParam)
      .addSuccess(Schema.Array(UserSummary))
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.patch('update', '/user/:id')
      .setPath(IdParam)
      .setPayload(UpdateUserInput)
      .addSuccess(Schema.Array(UserSummary))
      .addError(NotFoundError)
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.del('remove', '/user/:id')
      .setPath(IdParam)
      .addSuccess(RemoveUserResponse)
      .addError(NotFoundError)
      .addError(InternalServerError),
  )
  .middleware(Authorization);
