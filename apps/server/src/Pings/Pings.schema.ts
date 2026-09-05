import { Schema } from 'effect';

export class UpdatePingInput extends Schema.Class<UpdatePingInput>('UpdatePingInput')({}) {}

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

// `update`/`remove` are not implemented yet in the underlying service —
// preserved as stub string messages, same as the original NestJS behavior.
export class PingStubResponse extends Schema.Class<PingStubResponse>('PingStubResponse')({
  result: Schema.String,
}) {}
