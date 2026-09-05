// Registers an already-existing database (e.g. the production database this
// system used before multi-tenancy existed) as a tenant in the
// control-plane registry, without creating a new database or touching its
// data. Use this once, to turn your current single-tenant deployment into
// "tenant 0000" — every user already in that database can keep signing in
// with the same username/password, just adding "0000" as the company code.
// Usage: DATABASE_URL=... [TURSO_AUTH_TOKEN=...] npx tsx scripts/register-existing-tenant.ts "Company Name" [code]
import "dotenv/config";
import { migrateTenantDatabase } from "./lib/migrate-tenant-db";
import { getControlPrismaForScript, controlDbConnectionInfo } from "./lib/control-db";

const [, , name, codeArg] = process.argv;
if (!name) {
  console.error('Usage: DATABASE_URL=... [TURSO_AUTH_TOKEN=...] npx tsx scripts/register-existing-tenant.ts "Company Name" [code]');
  process.exit(1);
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const dbAuthToken = process.env.TURSO_AUTH_TOKEN ?? null;
  if (!dbUrl) throw new Error("Set DATABASE_URL to the existing database you want to register.");

  const code = codeArg ?? "0000";
  if (!/^\d{4}$/.test(code)) throw new Error("Code must be exactly 4 digits.");

  const controlConn = controlDbConnectionInfo();
  await migrateTenantDatabase(controlConn.url, controlConn.authToken);

  const control = getControlPrismaForScript();
  const existing = await control.tenant.findUnique({ where: { code } });
  if (existing) throw new Error(`Code ${code} is already registered to "${existing.name}".`);

  // Defensive, not required: brings _prisma_migrations bookkeeping in this
  // database up to date if it predates some migrations. No-ops for anything
  // already applied.
  await migrateTenantDatabase(dbUrl, dbAuthToken);

  const tenant = await control.tenant.create({ data: { code, name, dbUrl, dbAuthToken, status: "ACTIVE" } });
  await control.$disconnect();

  console.log(`Registered existing database as tenant ${tenant.code} ("${tenant.name}").`);
  console.log(`Existing users in that database can now sign in with company code ${tenant.code}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
