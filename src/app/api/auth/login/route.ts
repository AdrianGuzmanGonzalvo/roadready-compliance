import { NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import {
  createSessionToken,
  getTenantByCode,
  hashPassword,
  verifyPasswordHash,
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/auth";
import { clientIp, recordHit, resetHits, retryAfterSeconds, tooManyRequests } from "@/lib/rate-limit";

const CODE_PATTERN = /^\d{4}$/;

// Failed sign-ins allowed per 15 minutes: per account (stops password guessing) and per IP
// (stops one visitor trying many accounts). A correct password clears the account's count.
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_ACCOUNT = 10;
const MAX_FAILURES_PER_IP = 30;

// Compared against when the company or user doesn't exist, so a wrong username takes as long as a wrong password.
let dummyHash: Promise<string> | null = null;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!CODE_PATTERN.test(code) || !username || !password) {
    return NextResponse.json({ error: "Company code, username, and password are required" }, { status: 400 });
  }

  const ipKey = `login-ip:${clientIp(req)}`;
  const accountKey = `login-account:${code}:${username.toLowerCase()}`;
  const wait = Math.max(
    retryAfterSeconds(ipKey, MAX_FAILURES_PER_IP, FAILURE_WINDOW_MS),
    retryAfterSeconds(accountKey, MAX_FAILURES_PER_ACCOUNT, FAILURE_WINDOW_MS)
  );
  if (wait > 0) {
    return tooManyRequests(`Too many failed sign-in attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`, wait);
  }

  const tenant = await getTenantByCode(code);
  const user = tenant ? await getTenantPrisma(tenant).user.findUnique({ where: { username } }) : null;
  dummyHash ??= hashPassword("not-a-real-password");
  const valid = await verifyPasswordHash(password, user?.passwordHash ?? (await dummyHash));

  if (!tenant || !user || !valid) {
    recordHit(ipKey, FAILURE_WINDOW_MS);
    recordHit(accountKey, FAILURE_WINDOW_MS);
    return NextResponse.json({ error: "Incorrect company code, username, or password" }, { status: 401 });
  }

  resetHits(accountKey);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(tenant.id, user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
  return res;
}
