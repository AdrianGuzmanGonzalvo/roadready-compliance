// Shared control-plane connection helper for provisioning/maintenance
// scripts (not used by the running app — see src/lib/prisma.ts for that).
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

export function controlDbConnectionInfo(): { url: string; authToken: string | null } {
  return {
    url: process.env.CONTROL_DATABASE_URL ?? "file:./prisma/control.db",
    authToken: process.env.CONTROL_TURSO_AUTH_TOKEN ?? null,
  };
}

export function getControlPrismaForScript(): PrismaClient {
  const { url, authToken } = controlDbConnectionInfo();
  const adapter = url.startsWith("libsql://") && authToken ? new PrismaLibSql({ url, authToken }) : new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}
