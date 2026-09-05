// Applies every not-yet-applied migration under prisma/migrations, in order,
// against an arbitrary database (a fresh tenant db, an existing one being
// caught up, or the control-plane db). Used instead of `prisma migrate
// deploy` because that command doesn't recognize libsql:// URLs (see
// scripts/apply-migration.ts, which does the same thing for one migration
// at a time) — @libsql/client understands both local file: and remote
// libsql:// URLs, so one code path covers every database this system talks to.
import { createClient } from "@libsql/client";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma", "migrations");

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

export async function migrateTenantDatabase(url: string, authToken?: string | null): Promise<string[]> {
  const client = authToken ? createClient({ url, authToken }) : createClient({ url });
  const applied: string[] = [];

  await client.execute(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
  )`);

  const migrationNames = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const name of migrationNames) {
    const already = await client.execute({
      sql: `SELECT 1 FROM "_prisma_migrations" WHERE migration_name = ?`,
      args: [name],
    });
    if (already.rows.length > 0) continue;

    const sqlPath = path.join(MIGRATIONS_DIR, name, "migration.sql");
    if (!existsSync(sqlPath)) continue;

    const sqlContent = readFileSync(sqlPath, "utf8");
    const checksum = createHash("sha256").update(sqlContent).digest("hex");
    const statements = splitStatements(sqlContent);

    const startedAt = new Date().toISOString();
    for (const statement of statements) {
      await client.execute(statement);
    }
    const finishedAt = new Date().toISOString();

    await client.execute({
      sql: `INSERT INTO "_prisma_migrations"
        (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (?, ?, ?, ?, NULL, NULL, ?, ?)`,
      args: [randomUUID(), checksum, finishedAt, name, startedAt, statements.length],
    });
    applied.push(name);
  }

  client.close();
  return applied;
}
