// Applies any pending migrations (see prisma/migrations) to the
// control-plane database and every registered tenant database. Run this
// after `prisma migrate dev` creates a new migration, once you're ready to
// roll it out everywhere — each tenant's data stays in its own database, so
// a schema change has to be applied to all of them individually.
// Usage: npx tsx scripts/migrate-all-tenants.ts
import "dotenv/config";
import { migrateTenantDatabase } from "./lib/migrate-tenant-db";
import { getControlPrismaForScript, controlDbConnectionInfo } from "./lib/control-db";

async function main() {
  const controlConn = controlDbConnectionInfo();
  const appliedToControl = await migrateTenantDatabase(controlConn.url, controlConn.authToken);
  console.log(`Control database: applied ${appliedToControl.length} migration(s).`);

  const control = getControlPrismaForScript();
  const tenants = await control.tenant.findMany({ orderBy: { code: "asc" } });
  await control.$disconnect();

  for (const tenant of tenants) {
    try {
      const applied = await migrateTenantDatabase(tenant.dbUrl, tenant.dbAuthToken);
      console.log(`Tenant ${tenant.code} (${tenant.name}): applied ${applied.length} migration(s).`);
    } catch (err) {
      console.error(`Tenant ${tenant.code} (${tenant.name}): FAILED —`, err);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
