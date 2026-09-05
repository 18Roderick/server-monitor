import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform';
import { Schema } from 'effect';

import { Authorization } from '@/Auth/CurrentUser';
import { IdParam } from '@/Http/Params';
import {
  CreateServerInputSchema,
  DeletedResponse,
  ServerEntity,
  ServerSummary,
  UpdateServerInput,
} from '@/Servers/Servers.schema';
import { InternalServerError, NotFoundError } from '@/Errors';

export const ServersGroup = HttpApiGroup.make('Servers')
  .add(
    HttpApiEndpoint.get('getUserServers', '/servers')
      .addSuccess(Schema.Array(ServerSummary))
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.get('getServer', '/servers/:id')
      .setPath(IdParam)
      .addSuccess(Schema.Array(ServerSummary))
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.post('create', '/servers')
      .setPayload(CreateServerInputSchema)
      .addSuccess(ServerEntity)
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.put('updateUserServer', '/servers/:id')
      .setPath(IdParam)
      .setPayload(UpdateServerInput)
      .addSuccess(Schema.Array(ServerEntity))
      .addError(NotFoundError)
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.del('deleteServer', '/servers/:id')
      .setPath(IdParam)
      .addSuccess(DeletedResponse)
      .addError(InternalServerError),
  )
  .middleware(Authorization);
