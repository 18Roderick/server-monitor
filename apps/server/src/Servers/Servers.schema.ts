import { Schema } from 'effect';

const urlPattern = /^https?:\/\/[^\s]+$/;
const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;

const UrlField = Schema.String.pipe(Schema.pattern(urlPattern));
const IpField = Schema.String.pipe(Schema.pattern(ipv4Pattern));

export class CreateServerInput extends Schema.Class<CreateServerInput>('CreateServerInput')({
  url: Schema.optional(UrlField),
  ip: Schema.optional(IpField),
  description: Schema.optional(Schema.String),
  title: Schema.String.pipe(Schema.minLength(1)),
}) {}

export const CreateServerInputSchema = CreateServerInput.pipe(
  Schema.filter((input) => (input.url || input.ip ? true : 'Either url or ip is required')),
);

export class UpdateServerInput extends Schema.Class<UpdateServerInput>('UpdateServerInput')({
  url: Schema.optional(UrlField),
  ip: Schema.optional(IpField),
  description: Schema.optional(Schema.String),
  title: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
}) {}

export class ServerEntity extends Schema.Class<ServerEntity>('ServerEntity')({
  id_server: Schema.String,
  url: Schema.NullOr(Schema.String),
  ip: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  title: Schema.String,
  status: Schema.Literal('active', 'inactive'),
  worker_type: Schema.Literal('server', 'url'),
  created_at: Schema.Date,
  updated_at: Schema.Date,
  id_user: Schema.String,
}) {}

export class ServerSummary extends Schema.Class<ServerSummary>('ServerSummary')({
  idServer: Schema.String,
  ip: Schema.NullOr(Schema.String),
  url: Schema.NullOr(Schema.String),
  title: Schema.String,
  status: Schema.Literal('active', 'inactive'),
  idTask: Schema.NullOr(Schema.String),
  ping_max: Schema.NullOr(Schema.Number),
  ping_min: Schema.NullOr(Schema.Number),
  ping_avg: Schema.NullOr(Schema.Number),
}) {}

export class DeletedResponse extends Schema.Class<DeletedResponse>('DeletedResponse')({
  deleted: Schema.Literal(true),
}) {}
