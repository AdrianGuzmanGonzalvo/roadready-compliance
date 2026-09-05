import { NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { createSessionToken, getTenantByCode, verifyPasswordHash, SESSION_COOKIE, SESSION_COOKIE_MAX_AGE } from "@/lib/auth";

const CODE_PATTERN = /^\d{4}$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!CODE_PATTERN.test(code) || !username || !password) {
    return NextResponse.json({ error: "Company code, username, and password are required" }, { status: 400 });
  }

  const invalidResponse = () => NextResponse.json({ error: "Incorrect company code, username, or password" }, { status: 401 });

  const tenant = await getTenantByCode(code);
  if (!tenant) return invalidResponse();

  const db = getTenantPrisma(tenant);
  const user = await db.user.findUnique({ where: { username } });
  const valid = user ? await verifyPasswordHash(password, user.passwordHash) : false;

  if (!user || !valid) return invalidResponse();

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
