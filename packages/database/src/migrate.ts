import { migrate } from "drizzle-orm/postgres-js/migrator";
import { fileURLToPath } from "node:url";
import { closeDb, getDb } from "./client";

try {
  await migrate(getDb(), { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  console.info("Database migrations applied successfully.");
} finally {
  await closeDb();
}
