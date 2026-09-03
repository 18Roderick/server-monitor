import { Schema } from 'effect';

export class TaskEntity extends Schema.Class<TaskEntity>('TaskEntity')({
  id_task: Schema.String,
  id_server: Schema.NullOr(Schema.String),
  type: Schema.String,
  status: Schema.Literal('running', 'stopped', 'deleted'),
  cron: Schema.String,
  log: Schema.String,
  retries_failed: Schema.Number,
  created_at: Schema.Date,
  updated_at: Schema.Date,
}) {}
