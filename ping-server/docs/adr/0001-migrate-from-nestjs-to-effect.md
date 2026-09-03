# Migrate from NestJS to a full Effect-ts stack

**Status**: accepted

NestJS's DI/decorator/module ceremony was adding more boilerplate than value for a solo-maintained, ~2300-line project — 11 modules for shallow usage (one guard, no custom interceptors/pipes/filters, no GraphQL/CQRS), with a `*.module.ts` required per route for wiring alone. Error handling was already thin (7 `try/catch` total, no exception filters) and the queue/cron flows had real bugs from it (jobs marked "completed" despite internal failures, a fire-and-forget `db.transaction()` swallowing errors, an empty `retries_failed > 3` branch). Effect-ts was evaluated instead of a lighter framework like Hono because Effect's own `@effect/platform` provides routing/server, `Layer`/`Context.Tag` provides DI, and its typed-error model directly targets the error-handling gap — adopting Hono *and* Effect would mean bridging two paradigms for no benefit. With no production traffic today, the rewrite is a big-bang migration rather than incremental.

## Considered Options

- **Keep NestJS, fix bugs in place** — rejected: doesn't address the boilerplate-per-route pain that motivated the change, and doesn't get the learning goal (this is also a project to learn Effect-ts deliberately).
- **NestJS → Hono only** — rejected: solves boilerplate but not the error-handling gap; would need a separate solution (e.g. `neverthrow`) for typed errors anyway.
- **Hono for routing + Effect for domain logic** — rejected in favor of going "all the way in": mixing two paradigms (Hono's router, Effect's everything-else) adds an adapter layer at the edges for no real gain over using `@effect/platform`'s own router.
- **Replace BullMQ+Redis with Effect's in-memory `Fiber`/`Queue`/`Schedule`** — rejected: this is a monitoring server meant to run continuously; losing all pending/recurring jobs on every restart is a functional regression, not a simplification. BullMQ+Redis stays, wrapped via `Effect.tryPromise` at the boundaries. The actual bug behind "recurring jobs don't resume after restart" is a BullMQ usage issue (ad hoc `repeat` registration instead of `upsertJobScheduler`), fixed as part of the rewrite regardless of framework.

## Consequences

- Validation moves fully to Effect `Schema` (replacing `zod`), and tests move to Vitest + `@effect/vitest` (replacing Jest) — both changed together with the framework rather than left as loose ends.
- WebSocket/dashboards (already unimplemented — the current gateway is a demo echo), `@effect/sql-pg` adoption, and OpenTelemetry tracing are explicitly deferred to a later phase; they are new scope, not migration.
- Drizzle + Postgres is unaffected by this decision.
