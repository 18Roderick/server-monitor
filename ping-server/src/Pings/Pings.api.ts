import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform';
import { Schema } from 'effect';

import { Authorization } from '@/Auth/CurrentUser';
import { IdParam } from '@/Http/Params';
import { PingEntity, PingStubResponse } from '@/Pings/Pings.schema';
import { InternalServerError } from '@/Errors';

export const PingsGroup = HttpApiGroup.make('Pings')
  .add(
    HttpApiEndpoint.get('findAll', '/pings/:id')
      .setPath(IdParam)
      .addSuccess(Schema.Array(PingEntity))
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.patch('update', '/pings/:id').setPath(IdParam).addSuccess(PingStubResponse),
  )
  .add(HttpApiEndpoint.del('remove', '/pings/:id').setPath(IdParam).addSuccess(PingStubResponse))
  .middleware(Authorization);
