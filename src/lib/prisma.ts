import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Vercel's serverless filesystem is read-only except for /tmp, so a local
 * SQLite file can't live at its usual repo-relative path in production.
 * On cold start, seed /tmp from the synthetic demo database bundled in the
 * deployment (see prisma/seed.ts) so the live demo has content and is
 * actually writable for the lifetime of that function instance.
 */
function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL && !process.env.VERCEL) return process.env.DATABASE_URL;
  if (!process.env.VERCEL) return "file:./prisma/dev.db";

  const runtimeDb = "/tmp/dev.db";
  if (!existsSync(runtimeDb)) {
    const seedDb = path.join(process.cwd(), "prisma", "seed.db");
    if (existsSync(seedDb)) copyFileSync(seedDb, runtimeDb);
  }
  return `file:${runtimeDb}`;
}

const adapter = new PrismaLibSql({ url: resolveDatabaseUrl() });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
