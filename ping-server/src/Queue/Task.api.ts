import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform';
import { Schema } from 'effect';

import { Authorization } from '@/Auth/CurrentUser';
import { IdParam } from '@/Http/Params';
import { InternalServerError, NotFoundError } from '@/Errors';
import { TaskEntity } from '@/Queue/Task.schema';

export const TaskGroup = HttpApiGroup.make('Task')
  .add(
    HttpApiEndpoint.get('listTasks', '/task')
      .addSuccess(Schema.Array(TaskEntity))
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.get('getTask', '/task/:id')
      .setPath(IdParam)
      .addSuccess(TaskEntity)
      .addError(NotFoundError)
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.post('stopTask', '/task/:id/stop')
      .setPath(IdParam)
      .addSuccess(TaskEntity)
      .addError(NotFoundError)
      .addError(InternalServerError),
  )
  .add(
    HttpApiEndpoint.post('resumeTask', '/task/:id/resume')
      .setPath(IdParam)
      .addSuccess(TaskEntity)
      .addError(NotFoundError)
      .addError(InternalServerError),
  )
  .middleware(Authorization);
