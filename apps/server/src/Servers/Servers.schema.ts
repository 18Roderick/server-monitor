import { Schema } from 'effect';

const urlPattern = /^https?:\/\/[^\s]+$/;
const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;

const UrlField = Schema.String.pipe(Schema.pattern(urlPattern));
const IpField = Schema.String.pipe(Schema.pattern(ipv4Pattern));

// A Server has exactly one Monitor Mode (see CONTEXT.md) — modeled as a
// discriminated union on `mode` so the address field it requires is
// structurally exclusive, rather than validated after the fact. See
// docs/adr/0005-server-monitor-mode-as-discriminated-union.md.
export class CreateServerUrlInput extends Schema.Class<CreateServerUrlInput>('CreateServerUrlInput')({
  mode: Schema.Literal('url'),
  url: UrlField,
  title: Schema.String.pipe(Schema.minLength(1)),
  description: Schema.optional(Schema.String),
}) {}

export class CreateServerIpInput extends Schema.Class<CreateServerIpInput>('CreateServerIpInput')({
  mode: Schema.Literal('ip'),
  ip: IpField,
  title: Schema.String.pipe(Schema.minLength(1)),
  description: Schema.optional(Schema.String),
}) {}

export const CreateServerInput = Schema.Union(CreateServerUrlInput, CreateServerIpInput);
export type CreateServerInput = Schema.Schema.Type<typeof CreateServerInput>;

// Same shape on update, but everything besides `mode` and the mode-specific
// address field is optional — a Server's Monitor Mode is fixed at creation
// (CONTEXT.md), so `mode` here must match the server's existing `worker_type`;
// ServersService rejects it otherwise (see ServerMonitorModeMismatchError).
export class UpdateServerUrlInput extends Schema.Class<UpdateServerUrlInput>('UpdateServerUrlInput')({
  mode: Schema.Literal('url'),
  url: Schema.optional(UrlField),
  title: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  description: Schema.optional(Schema.String),
}) {}

export class UpdateServerIpInput extends Schema.Class<UpdateServerIpInput>('UpdateServerIpInput')({
  mode: Schema.Literal('ip'),
  ip: Schema.optional(IpField),
  title: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  description: Schema.optional(Schema.String),
}) {}

export const UpdateServerInput = Schema.Union(UpdateServerUrlInput, UpdateServerIpInput);
export type UpdateServerInput = Schema.Schema.Type<typeof UpdateServerInput>;

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
  taskStatus: Schema.NullOr(Schema.Literal('running', 'stopped', 'deleted')),
  ping_max: Schema.NullOr(Schema.Number),
  ping_min: Schema.NullOr(Schema.Number),
  ping_avg: Schema.NullOr(Schema.Number),
}) {}

export class DeletedResponse extends Schema.Class<DeletedResponse>('DeletedResponse')({
  deleted: Schema.Literal(true),
}) {}
