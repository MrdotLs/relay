import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js'


const databaseUrl = process.env.NODE_ENV
if (!databaseUrl) throw Error('DATABASE_URL is not set');


export const db = drizzle({connection: {connectionString: databaseUrl}, schema});
export type Db = typeof db;

