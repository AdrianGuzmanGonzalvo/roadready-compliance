import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import type { UserDTO } from "@/types/user";

function serializeUser(user: { id: string; username: string; createdAt: Date }): UserDTO {
  return { id: user.id, username: user.username, createdAt: user.createdAt.toISOString() };
}

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, createdAt: true },
    orderBy: { username: "asc" },
  });
  return NextResponse.json({ users: users.map(serializeUser) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ error: "That username is already taken" }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, passwordHash },
    select: { id: true, username: true, createdAt: true },
  });

  return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
}
