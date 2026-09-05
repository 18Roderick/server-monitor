import { servers } from './server';
import { createId } from '@paralleldrive/cuid2';
import { doublePrecision, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';
import { tableCreator } from '../table-creator';

export const pings = tableCreator('pings', {
  id_ping: varchar('id_ping', { length: 200 })
    .primaryKey()
    .$defaultFn(() => createId()),
  times: doublePrecision('times').notNull(),
  packet_loss: doublePrecision('packet_loss').notNull(),
  min: doublePrecision('min').notNull(),
  max: doublePrecision('max').notNull(),
  avg: doublePrecision('avg').notNull(),
  log: varchar('log', { length: 191 }).notNull(),
  is_alive: smallint('is_alive').notNull(),
  numeric_host: varchar('numeric_host', { length: 191 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  id_server: varchar('id_server', { length: 200 })
    .references(() => servers.id_server, { onDelete: 'cascade', onUpdate: 'cascade' })
    .notNull(),
});

export type PingInsert = typeof pings.$inferInsert;
export type Ping = typeof pings.$inferSelect;
