import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type BookingDatabase = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | undefined;
let database: BookingDatabase | undefined;

export function getDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required for database operations.");
  return value;
}

export function getDb(): BookingDatabase {
  if (!database) {
    client = postgres(getDatabaseUrl(), { max: 10, prepare: false });
    database = drizzle(client, { schema });
  }
  return database;
}

export async function closeDb(): Promise<void> {
  if (client) await client.end();
  client = undefined;
  database = undefined;
}
