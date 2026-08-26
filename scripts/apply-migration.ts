// Reusable one-off runner: applies a named migration file directly against a
// Turso database via the libsql client (Prisma Migrate doesn't recognize
// libsql:// URLs), and records it in _prisma_migrations for consistency.
// Usage: DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/_apply_migration.ts <migration-folder-name>
import { createClient } from "@libsql/client";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const [, , migrationName] = process.argv;
if (!migrationName) {
  console.error("Usage: npx tsx scripts/_apply_migration.ts <migration-folder-name>");
  process.exit(1);
}
const MIGRATION_PATH = `prisma/migrations/${migrationName}/migration.sql`;

function splitStatements(sql: string): string[] {
  const withoutComments = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  return withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error("Missing DATABASE_URL or TURSO_AUTH_TOKEN");
  const client = createClient({ url, authToken });

  const already = await client.execute({
    sql: "SELECT 1 FROM _prisma_migrations WHERE migration_name = ?",
    args: [migrationName],
  });
  if (already.rows.length > 0) {
    console.log(`Migration ${migrationName} already recorded. Skipping.`);
    client.close();
    return;
  }

  const sqlContent = readFileSync(MIGRATION_PATH, "utf8");
  const checksum = createHash("sha256").update(sqlContent).digest("hex");
  const statements = splitStatements(sqlContent);
  if (statements.length === 0) throw new Error("No SQL statements parsed — aborting.");

  const startedAt = new Date().toISOString();
  for (const statement of statements) {
    console.log("Executing:", statement.split("\n")[0]);
    await client.execute(statement);
  }
  const finishedAt = new Date().toISOString();

  await client.execute({
    sql: `INSERT INTO _prisma_migrations
      (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (?, ?, ?, ?, NULL, NULL, ?, ?)`,
    args: [randomUUID(), checksum, finishedAt, migrationName, startedAt, statements.length],
  });

  console.log(`Applied and recorded ${migrationName} (${statements.length} statements).`);
  client.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
