import { createId } from '@paralleldrive/cuid2';
import { text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { tableCreator } from '../table-creator';

export const logs = tableCreator('logs', {
  id: varchar('id', { length: 200 })
    .primaryKey()
    .$defaultFn(() => createId()),
  id_user: varchar('id_user', { length: 191 }),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  action: varchar('action', { length: 5000 }).notNull(),
  error_level: text('error_level', { enum: ['info', 'warning', 'error', 'critical'] })
    .default('info')
    .notNull(),
  description: varchar('description', { length: 5000 }).notNull(),
  affected_entity: varchar('affected_entity', { length: 191 }),
});

export type Log = typeof logs.$inferSelect;
export type InsertLog = typeof logs.$inferInsert;
