import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { serializeRoster } from "@/lib/serialize";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: companyId } = await params;
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Roster name is required" }, { status: 400 });

  const company = await user.db.company.findUnique({ where: { id: companyId } });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const existing = await user.db.roster.findUnique({ where: { companyId_name: { companyId, name } } });
  if (existing) return NextResponse.json({ error: "That roster already exists for this company" }, { status: 409 });

  const roster = await user.db.roster.create({
    data: { name, companyId, notes: body.notes || null },
  });

  return NextResponse.json({ roster: serializeRoster(roster) }, { status: 201 });
}
