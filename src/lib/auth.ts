import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/generated/prisma/client";
import { controlPrisma, getTenantPrisma } from "@/lib/prisma";

export const SESSION_COOKIE = "rr_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const BCRYPT_ROUNDS = 12;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Creates a signed session token: "<tenantId>:<userId>:<expiryEpochSeconds>.<hmacSignature>" */
export function createSessionToken(tenantId: string, userId: string): string {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${tenantId}:${userId}:${expiry}`;
  return `${payload}.${sign(payload)}`;
}

/** Verifies a session token and returns the tenantId/userId it was issued for, or null if invalid/expired. */
export function verifySessionToken(token: string | undefined | null): { tenantId: string; userId: string } | null {
  if (!token) return null;
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) return null;
  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [tenantId, userId, expiryStr] = payload.split(":");
  const expiry = Number(expiryStr);
  if (!tenantId || !userId || !Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return null;

  return { tenantId, userId };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const SESSION_COOKIE_MAX_AGE = SESSION_MAX_AGE_SECONDS;

/** Looks up an active tenant by its 4-digit login code in the control-plane database. */
export async function getTenantByCode(code: string) {
  const tenant = await controlPrisma.tenant.findUnique({ where: { code } });
  if (!tenant || tenant.status !== "ACTIVE") return null;
  return tenant;
}

export interface SessionUser {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
  tenantId: string;
  tenantCode: string;
  /** Prisma client scoped to this user's own tenant database — use this, never a global client. */
  db: PrismaClient;
}

/** Resolves the signed-in user (and their tenant-scoped db client) from the session cookie, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const parsed = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!parsed) return null;

  const tenant = await controlPrisma.tenant.findUnique({ where: { id: parsed.tenantId } });
  if (!tenant || tenant.status !== "ACTIVE") return null;

  const db = getTenantPrisma(tenant);
  const user = await db.user.findUnique({
    where: { id: parsed.userId },
    select: { id: true, username: true, role: true },
  });
  if (!user) return null;

  return { ...user, tenantId: tenant.id, tenantCode: tenant.code, db };
}

/** For API routes: resolves the current user, or returns a 401/403 NextResponse if not an admin. */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  return user;
}
