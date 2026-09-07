import { Effect, Layer } from 'effect';
import { NodeRuntime } from '@effect/platform-node';

import { AppConfigLive } from '@/Config';
import { DbLive } from '@/Db/Db';
import { RedisConnectionLive } from '@/Queue/Connection';
import { PingEventsServiceLive } from '@/Queue/PingEvents';
import { JwtLive } from '@/Auth/Jwt';
import { AuthServiceLive } from '@/Auth/Auth.service';
import { UsersServiceLive } from '@/Users/Users.service';
import { PingsServiceLive } from '@/Pings/Pings.service';
import { QueuePingService, QueuePingServiceLive } from '@/Queue/QueuePing';
import { QueueManagerServiceLive } from '@/Queue/QueueManager';
import { SchedulerServiceLive } from '@/Jobs/Scheduler';
import { ServersServiceLive } from '@/Servers/Servers.service';
import { HttpServerLive } from '@/Http/Server';

const InfraLive = Layer.mergeAll(DbLive, RedisConnectionLive, JwtLive, PingEventsServiceLive).pipe(
  Layer.provideMerge(AppConfigLive),
);

const Level2Live = Layer.mergeAll(
  QueuePingServiceLive,
  UsersServiceLive,
  PingsServiceLive,
).pipe(Layer.provideMerge(InfraLive));

// Postgres is the source of truth for Tasks; BullMQ/Redis state is disposable
// and gets rebuilt from it here in case the queue lost its schedulers
// (see docs/adr/0003-task-coordinator-owns-state-executor-only-runs-it.md)
const ReconcileTasksLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const queuePing = yield* QueuePingService;
    yield* Effect.forkDaemon(queuePing.reconcile());
  }),
);

const Level3Live = Layer.mergeAll(
  AuthServiceLive,
  QueueManagerServiceLive,
  SchedulerServiceLive,
  ReconcileTasksLive,
).pipe(Layer.provideMerge(Level2Live));

const AppServicesLive = ServersServiceLive.pipe(Layer.provideMerge(Level3Live));

const MainLive = HttpServerLive.pipe(Layer.provide(AppServicesLive));

NodeRuntime.runMain(Layer.launch(MainLive));
