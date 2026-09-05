import { createId } from '@paralleldrive/cuid2';
import { text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { tableCreator } from '../table-creator';

export const users = tableCreator('users', {
  id_user: varchar('id_user', { length: 200 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar('name', { length: 191 }).notNull(),
  last_name: varchar('last_name', { length: 191 }).notNull(),
  email: varchar('email', { length: 191 }).notNull().unique(),
  password: varchar('password', { length: 191 }).notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  status: text('status', { enum: ['active', 'inactive'] })
    .default('active')
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
