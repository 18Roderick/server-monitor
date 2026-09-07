import { HttpApiBuilder, HttpServerRequest, HttpServerResponse } from '@effect/platform';
import { Effect, Stream } from 'effect';

import { Jwt } from '@/Auth/Jwt';
import { PingEventsService } from '@/Queue/PingEvents';

const HEARTBEAT_INTERVAL = '20 seconds';

const encoder = new TextEncoder();

// Raw route, outside the typed HttpApi groups (ADR 0002): a live event feed
// isn't a request/response JSON shape, so it doesn't fit the OpenAPI-schema
// model the rest of the API uses.
export const SseRouteLive = HttpApiBuilder.Router.use((router) =>
  Effect.gen(function* () {
    // resolved once here (not per-request) so the handler below only needs
    // `HttpServerRequest` — router.get requires its handler to need nothing
    // beyond the router's own DefaultServices
    const jwt = yield* Jwt;
    const pingEvents = yield* PingEventsService;

    yield* router.get(
      '/servers/stream',
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const url = new URL(request.url, 'http://localhost');
        const token = url.searchParams.get('token');

        // EventSource (the browser SSE client) can't set an Authorization
        // header, so the token travels as a query param here instead
        if (!token) {
          return HttpServerResponse.text('Unauthorized', { status: 401 });
        }

        const user = yield* jwt.verify(token).pipe(Effect.option);
        if (user._tag === 'None') {
          return HttpServerResponse.text('Unauthorized', { status: 401 });
        }

        const idUser = user.value.sub;

        const events = pingEvents.subscribe().pipe(
          Stream.filter((event) => event.idUser === idUser),
          Stream.map((event) => `data: ${JSON.stringify(event)}\n\n`),
        );
        const heartbeat = Stream.tick(HEARTBEAT_INTERVAL).pipe(Stream.as(': heartbeat\n\n'));

        const body = Stream.merge(events, heartbeat).pipe(Stream.map((chunk) => encoder.encode(chunk)));

        return HttpServerResponse.stream(body, {
          contentType: 'text/event-stream',
          headers: { 'cache-control': 'no-cache', connection: 'keep-alive' },
        });
      }),
    );
  }),
);
