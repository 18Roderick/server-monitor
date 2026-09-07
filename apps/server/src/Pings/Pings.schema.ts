import { Schema } from 'effect';

export class UpdatePingInput extends Schema.Class<UpdatePingInput>('UpdatePingInput')({}) {}

// Optional time-range filter for GET /pings/:id — both bounds are optional
// ISO-8601 date-time strings, decoded to Date the same way PingEntity's
// `created_at` is represented internally.
export class FindAllPingsParams extends Schema.Class<FindAllPingsParams>('FindAllPingsParams')({
  from: Schema.optional(Schema.DateFromString),
  to: Schema.optional(Schema.DateFromString),
}) {}

export class PingEntity extends Schema.Class<PingEntity>('PingEntity')({
  id_ping: Schema.String,
  times: Schema.Number,
  packet_loss: Schema.Number,
  min: Schema.Number,
  max: Schema.Number,
  avg: Schema.Number,
  log: Schema.String,
  is_alive: Schema.Number,
  numeric_host: Schema.String,
  created_at: Schema.Date,
  id_server: Schema.String,
}) {}

// `update` has no mutable fields to change (a Ping is an immutable
// measurement, see CONTEXT.md) — still returns this stub message, but now
// only after verifying the Ping belongs to the caller.
export class PingStubResponse extends Schema.Class<PingStubResponse>('PingStubResponse')({
  result: Schema.String,
}) {}
