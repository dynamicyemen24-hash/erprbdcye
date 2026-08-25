import { drizzle } from 'drizzle-orm/node-postgres';
import { getPool } from '../server/core/database';
import * as schema from './schema.ts';

const pool = getPool();
export const db = drizzle(pool, { schema });
