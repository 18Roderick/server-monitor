import { users } from './users';
import { createId } from '@paralleldrive/cuid2';
import { text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { tableCreator } from '../table-creator';

export const servers = tableCreator('servers', {
  id_server: varchar('id_server', { length: 200 })
    .primaryKey()
    .$defaultFn(() => createId()),
  url: varchar('url', { length: 191 }),
  ip: varchar('ip', { length: 191 }),
  description: varchar('description', { length: 191 }),
  title: varchar('title', { length: 191 }).notNull(),
  status: text('status', { enum: ['active', 'inactive'] })
    .default('active')
    .notNull(),
  worker_type: text('worker_type', { enum: ['server', 'url'] }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  id_user: varchar('id_user', { length: 200 })
    .references(() => users.id_user, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    })
    .notNull(),
});

export type Server = typeof servers.$inferSelect;
export type ServerInsert = typeof servers.$inferInsert;
