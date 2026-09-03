# Ping Server

A monitoring context: users register the Servers they want watched, and the system periodically checks whether each one is reachable, recording the result as Pings.

## Language

**Server**:
A monitored target — a URL or IP address the system checks on a schedule. Not a machine the application runs on.
_Avoid_: Host, target, endpoint

**Ping**:
One reachability check performed against a Server, and its recorded result (alive/dead, latency, packet loss).
_Avoid_: Check, probe result

**Task**:
The domain record — owned by Postgres — representing "this Server is being monitored." It is the only thing the API exposes for scheduling concerns, and the only place `status` (`running`, `stopped`, `deleted`) and failure history (`retries_failed`) live. An active Server has exactly one Task.
_Avoid_: Job, Job Scheduler (see below)

**Coordinator**:
The role that owns Task data and makes lifecycle decisions — creating a Task, auto-pausing it after repeated failures, cascading its deletion when its Server is deleted. Implemented by `QueuePingService`.
_Avoid_: Worker, executor

**Executor / Job Scheduler**:
BullMQ's internal mechanism for actually running a Task's recurring ping on schedule. An implementation detail the Coordinator directs — it is disposable and never exposed by the API. If it loses its state (e.g. Redis reset), the Coordinator rebuilds it from Postgres.
_Avoid_: Task (a Job Scheduler is not itself the domain record)

## Task lifecycle

- **running** — the Coordinator has an active Job Scheduler for this Task.
- **stopped** — the Coordinator removed the Job Scheduler (BullMQ has no per-scheduler pause, only create/remove); resuming re-creates it and resets the failure count.
- **deleted** — soft-deleted; set when the Task's Server is deleted, kept for audit history rather than removed from the table.

A Task auto-transitions from `running` to `stopped` after 3 consecutive ping failures, logged as a `warning`.
