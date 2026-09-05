import { NextResponse } from "next/server";
import { hashPassword, requireAdmin } from "@/lib/auth";
import type { UserDTO, UserRole } from "@/types/user";

function serializeUser(user: { id: string; username: string; role: string; createdAt: Date }): UserDTO {
  return { id: user.id, username: user.username, role: user.role as UserRole, createdAt: user.createdAt.toISOString() };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const existing = await admin.db.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const data: { username?: string; passwordHash?: string; role?: UserRole } = {};

  if ("username" in body) {
    const username = typeof body.username === "string" ? body.username.trim() : "";
    if (!username) return NextResponse.json({ error: "Username is required" }, { status: 400 });
    if (username !== existing.username) {
      const taken = await admin.db.user.findUnique({ where: { username } });
      if (taken) return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
      data.username = username;
    }
  }

  if ("password" in body && body.password) {
    if (typeof body.password !== "string" || body.password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
    }
    data.passwordHash = await hashPassword(body.password);
  }

  if ("role" in body) {
    const role: UserRole = body.role === "ADMIN" ? "ADMIN" : "USER";
    if (existing.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await admin.db.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Can't remove the last admin" }, { status: 400 });
      }
    }
    data.role = role;
  }

  const user = await admin.db.user.update({
    where: { id },
    data,
    select: { id: true, username: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user: serializeUser(user) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;

  const total = await admin.db.user.count();
  if (total <= 1) {
    return NextResponse.json({ error: "Can't delete the last remaining user" }, { status: 400 });
  }

  const existing = await admin.db.user.findUnique({ where: { id } });
  if (existing?.role === "ADMIN") {
    const adminCount = await admin.db.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Can't delete the last admin" }, { status: 400 });
    }
  }

  await admin.db.user.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
