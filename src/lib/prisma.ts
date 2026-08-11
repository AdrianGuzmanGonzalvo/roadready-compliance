import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prefers a persistent Turso database (DATABASE_URL="libsql://..." +
 * TURSO_AUTH_TOKEN) when configured — this is what the live deployment
 * uses. Falls back to a local SQLite file for dev. If neither is available
 * in production (misconfiguration), bootstraps a throwaway demo dataset
 * into /tmp on cold start rather than hard-crashing (see prisma/seed.ts) —
 * Vercel's serverless filesystem is read-only outside /tmp.
 */
function resolveAdapter(): PrismaLibSql {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url?.startsWith("libsql://") && authToken) {
    return new PrismaLibSql({ url, authToken });
  }
  if (url && !process.env.VERCEL) return new PrismaLibSql({ url });
  if (!process.env.VERCEL) return new PrismaLibSql({ url: "file:./prisma/dev.db" });

  const runtimeDb = "/tmp/dev.db";
  if (!existsSync(runtimeDb)) {
    const seedDb = path.join(process.cwd(), "prisma", "seed.db");
    if (existsSync(seedDb)) copyFileSync(seedDb, runtimeDb);
  }
  return new PrismaLibSql({ url: `file:${runtimeDb}` });
}

const adapter = resolveAdapter();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
