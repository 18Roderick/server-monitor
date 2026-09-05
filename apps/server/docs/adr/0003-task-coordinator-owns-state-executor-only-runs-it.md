# Task's Postgres row is the source of truth; BullMQ only executes it

**Status**: accepted

The `tasks` table and BullMQ's Job Scheduler had drifted into two competing, unsynced notions of "task": the API read/removed raw BullMQ schedulers directly, `tasks.status` was written once at creation and never updated again, and deleting a Server never touched its scheduler — leaving it pinging a server that no longer existed. We decided the Postgres `tasks` row is the single source of truth for a Task's identity and lifecycle (`running` / `stopped` / `deleted`), and BullMQ is treated as a disposable execution detail the coordinator directs via `upsertJobScheduler`/`removeJobScheduler`. This is surprising without context because BullMQ has no API to pause a single scheduler — only the whole queue can be paused, or a scheduler can be created/removed — so "stopping" one Task necessarily means deleting its recurring definition and re-creating it on resume, rather than a true pause. Because Redis/BullMQ state can be lost independently of Postgres, the coordinator reconciles on boot: every Task with `status: 'running'` gets its Job Scheduler re-upserted, so the system self-heals without manual intervention.

## Considered Options

- **Make BullMQ the source of truth, Postgres a read-through cache** — rejected: BullMQ's job-scheduler API has no query surface rich enough to drive product decisions (e.g. "list all stopped tasks with reasons"), and its state lives in Redis, which this project already treats as more volatile than Postgres.
- **Give `tasks.status` a real "paused" primitive backed by BullMQ's queue-level pause** — rejected: queue-level pause is global, not per-task; pausing one misbehaving server's task would pause every other server's monitoring too.

## Consequences

- `/task/:id` now identifies a Task by its own `id_task`, not by `id_server` — the previous `/task/:id` endpoints operated directly on BullMQ scheduler ids (which happened to equal the server id), conflating the two concepts.
- A Server delete cascades to soft-delete its Task (`status: 'deleted'`) and remove its Job Scheduler, in that order, before the Server row itself is deleted (`tasks.id_server` now has `onDelete: 'set null'` so the FK doesn't block the Server delete once the Task is detached).
- A DB-level unique constraint on `tasks.id_server` enforces "one live Task per Server" — the coordinator upserts rather than inserting unconditionally, closing a duplicate-row risk from BullMQ job retries.
