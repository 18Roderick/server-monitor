import { HttpApiBuilder } from '@effect/platform';
import { Effect } from 'effect';

import { Api } from '@/Http/Api';
import { QueuePingService } from '@/Queue/QueuePing';
import { hideInternalErrors } from '@/Errors';
import type { TaskEntity } from '@/Queue/Task.schema';

export const TaskHandlersLive = HttpApiBuilder.group(Api, 'Task', (handlers) =>
  Effect.gen(function* () {
    const queuePing = yield* QueuePingService;

    return handlers
      .handle('listTasks', () =>
        queuePing.listTasks().pipe(
          Effect.map((tasks) => tasks as readonly TaskEntity[]),
          hideInternalErrors,
        ),
      )
      .handle('getTask', ({ path }) =>
        queuePing.getTask(path.id).pipe(
          Effect.map((task) => task as TaskEntity),
          hideInternalErrors,
        ),
      )
      .handle('stopTask', ({ path }) =>
        queuePing.stopTask(path.id).pipe(
          Effect.map((task) => task as TaskEntity),
          hideInternalErrors,
        ),
      )
      .handle('resumeTask', ({ path }) =>
        queuePing.resumeTask(path.id).pipe(
          Effect.map((task) => task as TaskEntity),
          hideInternalErrors,
        ),
      );
  }),
);
