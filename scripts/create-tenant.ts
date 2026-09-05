// Provisions a brand-new company (tenant): assigns it the next available
// 4-digit login code, creates its own database, migrates it, seeds its
// first ADMIN user, and registers it in the control-plane database.
//
// Database provisioning:
//   - If TURSO_API_TOKEN and TURSO_ORG are set, creates a real database in
//     that Turso organization. NOTE: the Turso Platform API request/response
//     shapes below are current as of this writing but not covered by this
//     repo's tests — check https://docs.turso.tech/api-reference if Turso
//     changes their API and this starts failing.
//   - Otherwise (local dev), creates a local SQLite file under
//     prisma/tenants/<code>.db.
//
// Usage: npx tsx scripts/create-tenant.ts "Acme Trucking" [admin-username] [admin-password]
// (admin-username defaults to "admin"; admin-password defaults to a random one, printed once)
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hashPassword } from "../src/lib/auth";
import { migrateTenantDatabase } from "./lib/migrate-tenant-db";
import { getControlPrismaForScript, controlDbConnectionInfo } from "./lib/control-db";

const [, , name, adminUsernameArg, adminPasswordArg] = process.argv;
if (!name) {
  console.error('Usage: npx tsx scripts/create-tenant.ts "Company Name" [admin-username] [admin-password]');
  process.exit(1);
}

async function provisionDatabase(code: string): Promise<{ dbUrl: string; dbAuthToken: string | null }> {
  const tursoApiToken = process.env.TURSO_API_TOKEN;
  const tursoOrg = process.env.TURSO_ORG;

  if (tursoApiToken && tursoOrg) {
    const dbName = `roadready-tenant-${code}`;

    const createRes = await fetch(`https://api.turso.tech/v1/organizations/${tursoOrg}/databases`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tursoApiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: dbName, group: process.env.TURSO_GROUP ?? "default" }),
    });
    if (!createRes.ok) {
      throw new Error(`Turso database creation failed: ${createRes.status} ${await createRes.text()}`);
    }
    const created = (await createRes.json()) as { database: { Hostname: string } };
    const dbUrl = `libsql://${created.database.Hostname}`;

    const tokenRes = await fetch(`https://api.turso.tech/v1/organizations/${tursoOrg}/databases/${dbName}/auth/tokens`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tursoApiToken}` },
    });
    if (!tokenRes.ok) {
      throw new Error(`Turso auth token creation failed: ${tokenRes.status} ${await tokenRes.text()}`);
    }
    const tokenBody = (await tokenRes.json()) as { jwt: string };

    return { dbUrl, dbAuthToken: tokenBody.jwt };
  }

  const dbPath = path.join(process.cwd(), "prisma", "tenants", `${code}.db`);
  mkdirSync(path.dirname(dbPath), { recursive: true });
  return { dbUrl: `file:${dbPath.replace(/\\/g, "/")}`, dbAuthToken: null };
}

async function main() {
  const controlConn = controlDbConnectionInfo();
  await migrateTenantDatabase(controlConn.url, controlConn.authToken);

  const control = getControlPrismaForScript();
  const existing = await control.tenant.findMany({ select: { code: true } });
  const maxCode = existing.reduce((max, t) => Math.max(max, Number(t.code) || 0), -1);
  const nextCode = maxCode + 1;
  if (nextCode > 9999) throw new Error("All 4-digit tenant codes are in use.");
  const code = String(nextCode).padStart(4, "0");

  const { dbUrl, dbAuthToken } = await provisionDatabase(code);

  const appliedMigrations = await migrateTenantDatabase(dbUrl, dbAuthToken);
  console.log(`Applied ${appliedMigrations.length} migration(s) to the new tenant database.`);

  const adminUsername = adminUsernameArg || "admin";
  const adminPassword = adminPasswordArg || randomBytes(9).toString("base64url");
  const tenantAdapter =
    dbUrl.startsWith("libsql://") && dbAuthToken ? new PrismaLibSql({ url: dbUrl, authToken: dbAuthToken }) : new PrismaLibSql({ url: dbUrl });
  const tenantDb = new PrismaClient({ adapter: tenantAdapter });
  const passwordHash = await hashPassword(adminPassword);
  await tenantDb.user.create({ data: { username: adminUsername, passwordHash, role: "ADMIN" } });
  await tenantDb.$disconnect();

  await control.tenant.create({ data: { code, name, dbUrl, dbAuthToken, status: "ACTIVE" } });
  await control.$disconnect();

  console.log(`\nTenant created:`);
  console.log(`  Company:        ${name}`);
  console.log(`  Login code:     ${code}`);
  console.log(`  Admin username: ${adminUsername}`);
  console.log(`  Admin password: ${adminPassword}`);
  console.log(`  Database:       ${dbUrl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
