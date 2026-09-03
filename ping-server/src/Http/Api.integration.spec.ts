import { describe, expect, it } from 'vitest';
import { Effect, Layer } from 'effect';
import { HttpApiBuilder, HttpApiScalar, HttpServer } from '@effect/platform';

import { Api } from '@/Http/Api';
import { AuthorizationLive } from '@/Auth/CurrentUser';
import { Jwt, type JwtPayload } from '@/Auth/Jwt';
import { UnauthorizedError } from '@/Errors';

import { AuthHandlersLive } from '@/Auth/Auth.handlers';
import { AuthService } from '@/Auth/Auth.service';
import { TokenResponse } from '@/Auth/Auth.schema';

import { UsersHandlersLive } from '@/Users/Users.handlers';
import { UsersService } from '@/Users/Users.service';

import { ServersHandlersLive } from '@/Servers/Servers.handlers';
import { ServersService } from '@/Servers/Servers.service';
import type { Server } from '@/Db/schemas';

import { PingsHandlersLive } from '@/Pings/Pings.handlers';
import { PingsService } from '@/Pings/Pings.service';

import { TaskHandlersLive } from '@/Queue/Task.handlers';
import { QueuePingService } from '@/Queue/QueuePing';
import { ForbiddenError, NotFoundError } from '@/Errors';

const FakeJwtLive = Layer.succeed(Jwt, {
  sign: (payload: JwtPayload) => Effect.succeed(JSON.stringify(payload)),
  verify: (token: string) =>
    Effect.try({
      try: () => JSON.parse(token) as JwtPayload,
      catch: () => new UnauthorizedError({ message: 'Invalid or expired token' }),
    }),
});

const VALID_TOKEN = JSON.stringify({ sub: 'user-1', email: 'user@example.com' });
const USER_ROW = { email: 'user@example.com', name: 'Ann', lastName: 'Doe', updatedAt: new Date() };
const SERVER_ROW = {
  id_server: 'server-1',
  url: 'http://example.com',
  ip: null,
  description: null,
  title: 'Test server',
  status: 'active' as const,
  worker_type: 'url' as const,
  created_at: new Date(),
  updated_at: new Date(),
  id_user: 'user-1',
};
const SERVER_SUMMARY = {
  idServer: 'server-1',
  ip: null,
  url: 'http://example.com',
  title: 'Test server',
  status: 'active' as const,
  idTask: null,
  ping_max: null,
  ping_min: null,
  ping_avg: null,
};

const FakeAuthServiceLive = Layer.succeed(AuthService, {
  signUp: (input) =>
    input.email === 'taken@example.com'
      ? new ForbiddenError({ message: 'Email already exists' })
      : Effect.succeed(new TokenResponse({ token: 'signup-token' })),
  signIn: (input) =>
    input.password === 'wrong-password'
      ? new ForbiddenError({ message: 'Email or password invalid' })
      : Effect.succeed(new TokenResponse({ token: 'signin-token' })),
});

const FakeUsersServiceLive = Layer.succeed(UsersService, {
  findAll: () => Effect.succeed('This action returns all user'),
  findOne: () => Effect.succeed([USER_ROW]),
  update: (userId) =>
    userId === 'missing'
      ? new NotFoundError({ message: 'user not found' })
      : Effect.succeed([USER_ROW]),
  remove: (userId) =>
    userId === 'missing'
      ? new NotFoundError({ message: 'user not found' })
      : Effect.succeed({ affected: { count: 1 } }),
});

const FakeServersServiceLive = Layer.succeed(ServersService, {
  create: () => Effect.succeed(SERVER_ROW as Server),
  getUserServers: () => Effect.succeed([SERVER_SUMMARY]),
  getServer: () => Effect.succeed([SERVER_SUMMARY]),
  updateUserServer: (idServer) =>
    idServer === 'missing'
      ? new NotFoundError({ message: 'Server not found' })
      : Effect.succeed([SERVER_ROW as Server]),
  deleteServer: () => Effect.void,
});

const FakePingsServiceLive = Layer.succeed(PingsService, {
  findAll: () =>
    Effect.succeed([
      {
        id_ping: 'ping-1',
        times: 4,
        packet_loss: 0,
        min: 1,
        max: 2,
        avg: 1.5,
        log: 'Server is alive',
        is_alive: 1,
        numeric_host: '1.2.3.4',
        created_at: new Date(),
        id_server: 'server-1',
      },
    ]),
  update: (id) => Effect.succeed(`This action updates a #${id} ping`),
  remove: (id) => Effect.succeed(`This action removes a #${id} ping`),
});

const TASK_ROW = {
  id_task: 'task-1',
  id_job: 'job-1',
  id_server: 'server-1',
  type: 'server' as const,
  status: 'running' as const,
  cron: '* * * * *',
  log: 'NO ISSUES',
  retries_failed: 0,
  created_at: new Date(),
  updated_at: new Date(),
};

const FakeQueuePingServiceLive = Layer.succeed(QueuePingService, {
  createPingTask: () => Effect.succeed('job-1'),
  listTasks: () => Effect.succeed([TASK_ROW]),
  getTask: (idTask) =>
    idTask === 'missing'
      ? new NotFoundError({ message: 'Task not found' })
      : Effect.succeed(TASK_ROW),
  stopTask: (idTask) =>
    idTask === 'missing'
      ? new NotFoundError({ message: 'Task not found' })
      : Effect.succeed({ ...TASK_ROW, status: 'stopped' as const }),
  resumeTask: (idTask) =>
    idTask === 'missing'
      ? new NotFoundError({ message: 'Task not found' })
      : Effect.succeed({ ...TASK_ROW, status: 'running' as const, retries_failed: 0 }),
  deleteTaskForServer: () => Effect.void,
  reconcile: () => Effect.void,
});

const HandlersLive = Layer.mergeAll(
  AuthHandlersLive,
  UsersHandlersLive,
  ServersHandlersLive,
  PingsHandlersLive,
  TaskHandlersLive,
).pipe(Layer.provide(AuthorizationLive));

const ServicesTestLive = Layer.mergeAll(
  FakeAuthServiceLive,
  FakeUsersServiceLive,
  FakeServersServiceLive,
  FakePingsServiceLive,
  FakeQueuePingServiceLive,
  FakeJwtLive,
);

const ApiTestLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(HandlersLive),
  Layer.provide(ServicesTestLive),
);

const DocsLive = HttpApiScalar.layer({ path: '/docs' }).pipe(Layer.provide(ApiTestLive));

const { handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiTestLive, DocsLive, HttpServer.layerContext),
);

const authHeaders = { authorization: `Bearer ${VALID_TOKEN}` };

const request = (method: string, path: string, options: { body?: unknown; auth?: boolean } = {}) =>
  handler(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(options.auth === false ? {} : authHeaders),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    }),
  );

describe('Auth', () => {
  it('POST /auth/signup succeeds', async () => {
    const res = await request('POST', '/auth/signup', {
      auth: false,
      body: { email: 'new@example.com', password: 'Str0ng!Pass', name: 'New User' },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ token: 'signup-token' });
  });

  it('POST /auth/signup with an existing email returns 403', async () => {
    const res = await request('POST', '/auth/signup', {
      auth: false,
      body: { email: 'taken@example.com', password: 'Str0ng!Pass', name: 'New User' },
    });
    expect(res.status).toBe(403);
  });

  it('POST /auth/signin succeeds', async () => {
    const res = await request('POST', '/auth/signin', {
      auth: false,
      body: { email: 'user@example.com', password: 'correct-password' },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ token: 'signin-token' });
  });

  it('POST /auth/signin with the wrong password returns 403', async () => {
    const res = await request('POST', '/auth/signin', {
      auth: false,
      body: { email: 'user@example.com', password: 'wrong-password' },
    });
    expect(res.status).toBe(403);
  });
});

describe('Users', () => {
  it('GET /user succeeds', async () => {
    const res = await request('GET', '/user');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ result: 'This action returns all user' });
  });

  it('GET /user/:id succeeds', async () => {
    const res = await request('GET', '/user/user-1');
    expect(res.status).toBe(200);
  });

  it('PATCH /user/:id succeeds', async () => {
    const res = await request('PATCH', '/user/user-1', { body: { name: 'Annie' } });
    expect(res.status).toBe(200);
  });

  it('PATCH /user/:id for a missing user returns 404', async () => {
    const res = await request('PATCH', '/user/missing', { body: { name: 'Annie' } });
    expect(res.status).toBe(404);
  });

  it('DELETE /user/:id succeeds', async () => {
    const res = await request('DELETE', '/user/user-1');
    expect(res.status).toBe(200);
  });
});

describe('Servers', () => {
  it('GET /servers succeeds', async () => {
    const res = await request('GET', '/servers');
    expect(res.status).toBe(200);
  });

  it('GET /servers/:id succeeds', async () => {
    const res = await request('GET', '/servers/server-1');
    expect(res.status).toBe(200);
  });

  it('POST /servers succeeds', async () => {
    const res = await request('POST', '/servers', {
      body: { title: 'Test server', url: 'http://example.com' },
    });
    expect(res.status).toBe(200);
  });

  it('PUT /servers/:id succeeds', async () => {
    const res = await request('PUT', '/servers/server-1', { body: { title: 'Renamed' } });
    expect(res.status).toBe(200);
  });

  it('PUT /servers/:id for a missing server returns 404', async () => {
    const res = await request('PUT', '/servers/missing', { body: { title: 'Renamed' } });
    expect(res.status).toBe(404);
  });

  it('DELETE /servers/:id succeeds', async () => {
    const res = await request('DELETE', '/servers/server-1');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
  });
});

describe('Pings', () => {
  it('GET /pings/:id succeeds', async () => {
    const res = await request('GET', '/pings/server-1');
    expect(res.status).toBe(200);
  });

  it('PATCH /pings/:id succeeds', async () => {
    const res = await request('PATCH', '/pings/ping-1');
    expect(res.status).toBe(200);
  });

  it('DELETE /pings/:id succeeds', async () => {
    const res = await request('DELETE', '/pings/ping-1');
    expect(res.status).toBe(200);
  });
});

describe('Task', () => {
  it('GET /task succeeds', async () => {
    const res = await request('GET', '/task');
    expect(res.status).toBe(200);
  });

  it('GET /task/:id succeeds', async () => {
    const res = await request('GET', '/task/task-1');
    expect(res.status).toBe(200);
  });

  it('GET /task/:id for a missing task returns 404', async () => {
    const res = await request('GET', '/task/missing');
    expect(res.status).toBe(404);
  });

  it('POST /task/:id/stop succeeds', async () => {
    const res = await request('POST', '/task/task-1/stop');
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('stopped');
  });

  it('POST /task/:id/resume succeeds', async () => {
    const res = await request('POST', '/task/task-1/resume');
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('running');
  });
});

describe('Docs', () => {
  it('GET /docs serves the Scalar UI', async () => {
    const res = await request('GET', '/docs', { auth: false });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const body = await res.text();
    expect(body).toContain('api-reference');
    expect(body).toContain('/auth/signup');
  });
});

describe('Authorization', () => {
  const protectedRoutes: ReadonlyArray<[string, string]> = [
    ['GET', '/user'],
    ['GET', '/user/user-1'],
    ['PATCH', '/user/user-1'],
    ['DELETE', '/user/user-1'],
    ['GET', '/servers'],
    ['GET', '/servers/server-1'],
    ['POST', '/servers'],
    ['PUT', '/servers/server-1'],
    ['DELETE', '/servers/server-1'],
    ['GET', '/pings/server-1'],
    ['PATCH', '/pings/ping-1'],
    ['DELETE', '/pings/ping-1'],
    ['GET', '/task'],
    ['GET', '/task/task-1'],
    ['POST', '/task/task-1/stop'],
    ['POST', '/task/task-1/resume'],
  ];

  it.each(protectedRoutes)('%s %s without a bearer token returns 401', async (method, path) => {
    const res = await request(method, path, { auth: false });
    expect(res.status).toBe(401);
  });
});
