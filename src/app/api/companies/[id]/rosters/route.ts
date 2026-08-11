import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeRoster } from "@/lib/serialize";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Roster name is required" }, { status: 400 });

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const existing = await prisma.roster.findUnique({ where: { companyId_name: { companyId, name } } });
  if (existing) return NextResponse.json({ error: "That roster already exists for this company" }, { status: 409 });

  const roster = await prisma.roster.create({
    data: { name, companyId, notes: body.notes || null },
  });

  return NextResponse.json({ roster: serializeRoster(roster) }, { status: 201 });
}
