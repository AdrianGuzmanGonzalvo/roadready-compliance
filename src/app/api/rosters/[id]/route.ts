import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeRoster } from "@/lib/serialize";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const existing = await prisma.roster.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Roster not found" }, { status: 404 });

  const data: Record<string, string | null> = {};
  if ("name" in body) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Roster name is required" }, { status: 400 });
    data.name = name;
  }
  if ("notes" in body) data.notes = body.notes || null;

  if (data.name && data.name !== existing.name) {
    const nameTaken = await prisma.roster.findUnique({
      where: { companyId_name: { companyId: existing.companyId, name: data.name } },
    });
    if (nameTaken) return NextResponse.json({ error: "That roster already exists for this company" }, { status: 409 });
  }

  const roster = await prisma.roster.update({ where: { id }, data });
  return NextResponse.json({ roster: serializeRoster(roster) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.roster.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
