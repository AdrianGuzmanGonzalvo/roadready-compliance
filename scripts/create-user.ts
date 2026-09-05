// Creates (or updates the password for) a login account in ONE tenant's
// database. Set DATABASE_URL (and TURSO_AUTH_TOKEN if it's a Turso db) to
// that tenant's own database — see the `dbUrl`/`dbAuthToken` columns on its
// Tenant row in the control database. Defaults to prisma/dev.db via .env.
// For creating a brand-new company (tenant) from scratch, use
// scripts/create-tenant.ts instead, which also assigns its login code.
// Usage: npx tsx scripts/create-user.ts <username> <password>
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hashPassword } from "../src/lib/auth";

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error("Usage: npx tsx scripts/create-user.ts <username> <password>");
  process.exit(1);
}

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const adapter = url.startsWith("libsql://") && authToken ? new PrismaLibSql({ url, authToken }) : new PrismaLibSql({ url });
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { username },
    create: { username, passwordHash },
    update: { passwordHash },
  });

  console.log(`User "${user.username}" is ready (id: ${user.id})`);
  await prisma.$disconnect();
}

main();
