import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  controlPrisma: PrismaClient | undefined;
  tenantPrismaCache: Map<string, PrismaClient> | undefined;
};

function buildAdapter(url: string, authToken?: string | null): PrismaLibSql {
  if (url.startsWith("libsql://") && authToken) return new PrismaLibSql({ url, authToken });
  return new PrismaLibSql({ url });
}

/**
 * Resolves the control-plane database: the one database that holds the
 * `Tenant` registry (company code -> that company's own database). Prefers
 * CONTROL_DATABASE_URL/CONTROL_TURSO_AUTH_TOKEN; falls back to a local
 * SQLite file for dev, and to a /tmp copy of a seeded control db in
 * production if misconfigured (mirrors the tenant fallback below, since
 * Vercel's serverless filesystem is read-only outside /tmp).
 */
function resolveControlAdapter(): PrismaLibSql {
  const url = process.env.CONTROL_DATABASE_URL;
  const authToken = process.env.CONTROL_TURSO_AUTH_TOKEN;

  if (url?.startsWith("libsql://") && authToken) return new PrismaLibSql({ url, authToken });
  if (url && !process.env.VERCEL) return buildAdapter(url);
  if (!process.env.VERCEL) return buildAdapter("file:./prisma/control.db");

  const runtimeDb = "/tmp/control.db";
  if (!existsSync(runtimeDb)) {
    const seedDb = path.join(process.cwd(), "prisma", "control-seed.db");
    if (existsSync(seedDb)) copyFileSync(seedDb, runtimeDb);
  }
  return buildAdapter(`file:${runtimeDb}`);
}

/** The single, fixed connection to the control-plane database (the `Tenant` registry). */
export const controlPrisma =
  globalForPrisma.controlPrisma ??
  new PrismaClient({
    adapter: resolveControlAdapter(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.controlPrisma = controlPrisma;

const MAX_CACHED_TENANT_CLIENTS = 20;
const tenantPrismaCache = globalForPrisma.tenantPrismaCache ?? new Map<string, PrismaClient>();
if (process.env.NODE_ENV !== "production") globalForPrisma.tenantPrismaCache = tenantPrismaCache;

/**
 * Resolves (and caches) a Prisma client for one tenant's own database. Each
 * company using the system has its own isolated database, so this is the
 * client every API route should use for tenant data — never a shared global
 * `prisma` export. Cache is a simple bounded map (evicts the oldest entry
 * past MAX_CACHED_TENANT_CLIENTS) to avoid unbounded connection growth in a
 * long-lived server process.
 */
export function getTenantPrisma(tenant: { id: string; dbUrl: string; dbAuthToken: string | null }): PrismaClient {
  const cached = tenantPrismaCache.get(tenant.id);
  if (cached) return cached;

  const client = new PrismaClient({
    adapter: buildAdapter(tenant.dbUrl, tenant.dbAuthToken),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (tenantPrismaCache.size >= MAX_CACHED_TENANT_CLIENTS) {
    const oldestKey = tenantPrismaCache.keys().next().value;
    if (oldestKey !== undefined) {
      tenantPrismaCache.get(oldestKey)?.$disconnect().catch(() => {});
      tenantPrismaCache.delete(oldestKey);
    }
  }
  tenantPrismaCache.set(tenant.id, client);
  return client;
}
