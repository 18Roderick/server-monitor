import { pgTableCreator } from 'drizzle-orm/pg-core';
export const tableCreator = pgTableCreator((name) => `pingdom_${name}`);
