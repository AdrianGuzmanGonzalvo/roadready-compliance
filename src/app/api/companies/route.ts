import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { serializeCompany } from "@/lib/serialize";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companies = await user.db.company.findMany({
    include: { rosters: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ companies: companies.map(serializeCompany) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Company name is required" }, { status: 400 });

  const rosterNames: string[] = Array.isArray(body?.rosters)
    ? body.rosters.map((r: unknown) => String(r).trim()).filter(Boolean)
    : [];

  const existing = await user.db.company.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: "A company with that name already exists" }, { status: 409 });

  const company = await user.db.company.create({
    data: {
      name,
      address: body.address || null,
      contactName: body.contactName || null,
      contactPhone: body.contactPhone || null,
      contactEmail: body.contactEmail || null,
      notes: body.notes || null,
      rosters: { create: rosterNames.map((n) => ({ name: n })) },
    },
    include: { rosters: { orderBy: { name: "asc" } } },
  });

  return NextResponse.json({ company: serializeCompany(company) }, { status: 201 });
}
