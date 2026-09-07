import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform';
import { Schema } from 'effect';

import { Authorization } from '@/Auth/CurrentUser';
import { IdParam } from '@/Http/Params';
import { FindAllPingsParams, PingEntity, PingStubResponse } from '@/Pings/Pings.schema';
import { DeletedResponse } from '@/Servers/Servers.schema';
import { InternalServerError, NotFoundError } from '@/Errors';

export const PingsGroup = HttpApiGroup.make('Pings')
  .add(
    HttpApiEndpoint.get('findAll', '/pings/:id')
      .setPath(IdParam)
      .setUrlParams(FindAllPingsParams)
      .addSuccess(Schema.Array(PingEntity))
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.patch('update', '/pings/:id')
      .setPath(IdParam)
      .addSuccess(PingStubResponse)
      .addError(NotFoundError)
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.del('remove', '/pings/:id')
      .setPath(IdParam)
      .addSuccess(DeletedResponse)
      .addError(NotFoundError)
      .addError(InternalServerError),
  )
  .middleware(Authorization);
