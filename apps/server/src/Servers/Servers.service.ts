import { Context, Effect, Layer } from 'effect';
import { and, count, eq, max, min, sql } from 'drizzle-orm';

import { Db } from '@/Db/Db';
import { pings, servers, tasks, users, type Server } from '@/Db/schemas';
import { QueueManagerService } from '@/Queue/QueueManager';
import { QueuePingService } from '@/Queue/QueuePing';
import { CreateServerInput, UpdateServerInput } from '@/Servers/Servers.schema';
import { DbError, NotFoundError, ServerMonitorModeMismatchError } from '@/Errors';

export class ServersService extends Context.Tag('ServersService')<
  ServersService,
  {
    readonly create: (
      input: CreateServerInput,
      idUser: string,
    ) => Effect.Effect<Server, DbError>;
    readonly getUserServers: (idUser: string) => Effect.Effect<unknown, DbError>;
    readonly getServer: (idUser: string, idServer: string) => Effect.Effect<unknown, DbError>;
    readonly updateUserServer: (
      idServer: string,
      idUser: string,
      input: UpdateServerInput,
    ) => Effect.Effect<unknown, DbError | NotFoundError | ServerMonitorModeMismatchError>;
    readonly deleteServer: (idServer: string, idUser: string) => Effect.Effect<void, DbError>;
  }
>() {}

export const ServersServiceLive = Layer.effect(
  ServersService,
  Effect.gen(function* () {
    const db = yield* Db;
    const queueManager = yield* QueueManagerService;
    const queuePing = yield* QueuePingService;

    const serversWithPingSummary = (extraWhere: ReturnType<typeof and>) => {
      const lastPing = db
        .select({
          count: count().as('count'),
          idServer: servers.id_server,
          createdAt: max(pings.created_at).as('created_at_custom'),
          avg: sql<number>`round(avg(${pings.avg})::numeric, 4)::float8`.as('avg'),
          min: min(pings.min).as('min'),
          max: max(pings.max).as('max'),
        })
        .from(servers)
        .innerJoin(pings, eq(pings.id_server, servers.id_server))
        .where(extraWhere)
        .groupBy(servers.id_server)
        .as('lastping');

      return db
        .select({
          idServer: servers.id_server,
          ip: servers.ip,
          url: servers.url,
          title: servers.title,
          status: servers.status,
          idTask: tasks.id_task,
          taskStatus: tasks.status,
          ping_max: lastPing.max,
          ping_min: lastPing.min,
          ping_avg: lastPing.avg,
        })
        .from(servers)
        .leftJoin(tasks, eq(servers.id_server, tasks.id_server))
        .leftJoin(lastPing, eq(lastPing.idServer, servers.id_server));
    };

    return {
      create: (input, idUser) =>
        Effect.gen(function* () {
          const equalWhere =
            input.mode === 'ip'
              ? and(eq(servers.ip, input.ip), eq(servers.id_user, idUser))
              : and(eq(servers.url, input.url), eq(servers.id_user, idUser));

          const existing = yield* Effect.tryPromise({
            try: () =>
              db
                .select({ idUser: users.id_user, idServer: servers.id_server })
                .from(users)
                .innerJoin(servers, eq(users.id_user, servers.id_user))
                .where(equalWhere)
                .limit(1),
            catch: (cause) => new DbError({ cause }),
          });

          if (existing.length) {
            return yield* new DbError({ cause: 'Server already exists' });
          }

          const created = yield* Effect.tryPromise({
            try: () =>
              db
                .insert(servers)
                .values({
                  url: input.mode === 'url' ? input.url : undefined,
                  ip: input.mode === 'ip' ? input.ip : undefined,
                  title: input.title,
                  description: input.description,
                  worker_type: input.mode === 'ip' ? 'server' : 'url',
                  id_user: idUser,
                })
                .returning(),
            catch: (cause) => new DbError({ cause }),
          });

          const server = created[0];
          if (!server) {
            return yield* new DbError({ cause: 'Server not created' });
          }

          yield* queueManager.addServerPing({ idServer: server.id_server, idUser });
          return server;
        }),

      getUserServers: (idUser) =>
        Effect.tryPromise({
          try: () => serversWithPingSummary(eq(servers.id_user, idUser)).where(eq(servers.id_user, idUser)),
          catch: (cause) => new DbError({ cause }),
        }),

      getServer: (idUser, idServer) =>
        Effect.tryPromise({
          try: () =>
            serversWithPingSummary(and(eq(servers.id_user, idUser), eq(servers.id_server, idServer))).where(
              and(eq(servers.id_user, idUser), eq(servers.id_server, idServer)),
            ),
          catch: (cause) => new DbError({ cause }),
        }),

      updateUserServer: (idServer, idUser, input) =>
        Effect.gen(function* () {
          const equalWhere = and(eq(servers.id_server, idServer), eq(servers.id_user, idUser));

          const existing = yield* Effect.tryPromise({
            try: () => db.select().from(servers).where(equalWhere).limit(1),
            catch: (cause) => new DbError({ cause }),
          });

          const currentServer = existing[0];
          if (!currentServer) {
            return yield* new NotFoundError({ message: 'Server not found' });
          }

          // A Server's Monitor Mode is fixed at creation (CONTEXT.md) — an
          // update can't switch `worker_type`, so a payload whose `mode`
          // disagrees with the stored one is rejected rather than applied.
          const incomingWorkerType = input.mode === 'ip' ? 'server' : 'url';
          if (incomingWorkerType !== currentServer.worker_type) {
            return yield* new ServerMonitorModeMismatchError({
              message: `Server's monitor mode is '${currentServer.worker_type === 'server' ? 'ip' : 'url'}' and cannot be changed`,
            });
          }

          yield* Effect.tryPromise({
            try: () =>
              db
                .update(servers)
                .set({
                  url: input.mode === 'url' ? input.url : undefined,
                  ip: input.mode === 'ip' ? input.ip : undefined,
                  title: input.title,
                  description: input.description,
                })
                .where(equalWhere),
            catch: (cause) => new DbError({ cause }),
          });

          return yield* Effect.tryPromise({
            try: () => db.select().from(servers).where(equalWhere),
            catch: (cause) => new DbError({ cause }),
          });
        }),

      deleteServer: (idServer, idUser) =>
        Effect.gen(function* () {
          // cascade: a Task can never outlive the Server it monitors — soft-delete
          // it and tear down its recurring Job Scheduler before the Server is gone
          yield* queuePing.deleteTaskForServer(idServer);

          yield* Effect.tryPromise({
            try: () =>
              db.delete(servers).where(and(eq(servers.id_server, idServer), eq(servers.id_user, idUser))),
            catch: (cause) => new DbError({ cause }),
          });
        }),
    };
  }),
);
