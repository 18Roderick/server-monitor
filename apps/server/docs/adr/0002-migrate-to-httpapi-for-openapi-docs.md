# Migrate the HTTP layer from HttpRouter to HttpApi, add Scalar-served OpenAPI docs

**Status**: accepted

The server had no API documentation. `@effect/platform` offers two routing layers: the low-level `HttpRouter` used since ADR 0001 (a direct, imperative port of the former Nest controllers), and the declarative `HttpApi`/`HttpApiBuilder`, which derives an OpenAPI spec from the same schemas that validate requests and encode responses. `HttpRouter` was never a deliberate choice over `HttpApi` — ADR 0001 only decided to use "`@effect/platform`'s own router" in general; `HttpApi` was simply not needed for that migration. Adding documentation now meant picking one of the two, since bolting a hand-written OpenAPI spec on top of `HttpRouter` would drift from the code the moment a route changed.

With no production traffic yet, this was done as a single big-bang cut across all five route modules (Auth, Users, Servers, Pings, Task), matching the precedent set by ADR 0001.

## Considered Options

- **Hand-written OpenAPI spec + Scalar over the existing `HttpRouter`** — rejected: cheaper up front, but the spec has no mechanical link to the route code and will silently go stale.
- **Migrate to `HttpApi`, incrementally (`HttpRouter` and `HttpApi` mounted side by side)** — rejected: running two routing paradigms at once means two error-handling models and two ways of reading auth, for a codebase small enough (5 route modules) that the coexistence cost outweighs the big-bang risk, especially with no live traffic to protect.
- **Migrate to `HttpApi`, big-bang** — accepted.

## Consequences

- Every endpoint now declares an explicit success schema. None existed before (`HttpServerResponse.json(result)` with `result: unknown`); response shapes for users, servers, pings, and job-scheduler data were reconstructed from the underlying Drizzle projections and are now part of `*.schema.ts` per module.
- `CurrentUser` changed from a `Context.Tag` exposing an `authenticate` effect called manually inside each handler, to an `HttpApiSecurity.bearer` + `HttpApiMiddleware.Tag` (`Authorization`) applied per-group via `.middleware(Authorization)`. Auth requirements are now visible in the generated spec instead of living only in handler bodies.
- `Errors.ts` error classes carry their HTTP status via `HttpApiSchema.annotations({ status })`, replacing the single `HttpRouter.catchTags` switch that used to live in `Http/Server.ts`. `DbError` is the one exception: it stays internal-only (carries a raw `Schema.Defect` cause) and is mapped to a new, wire-safe `InternalServerError` at the HTTP boundary via `hideInternalErrors`, so DB internals never leak into a response or the OpenAPI schema. `QueueError` was removed as dead code — it was declared but never actually produced by any service.
- Docs are served by `HttpApiScalar.layer({ path: '/docs' })`, effect/platform's first-party Scalar integration — no separate npm package. The spec is generated purely from the `HttpApi` definition, so it cannot drift from the endpoint contracts.
- Added `src/Http/Api.integration.spec.ts`: request-level tests (happy path per endpoint, 403 for the two Auth failure cases, and a parameterized 401 check across all 15 auth-gated routes) built with `HttpApiBuilder.toWebHandler` against fake service layers — no real DB/Redis needed. This is the regression net a rewrite of this shape didn't have before.
