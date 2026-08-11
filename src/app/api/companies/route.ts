import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCompany } from "@/lib/serialize";

export async function GET() {
  const companies = await prisma.company.findMany({
    include: { rosters: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ companies: companies.map(serializeCompany) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Company name is required" }, { status: 400 });

  const rosterNames: string[] = Array.isArray(body?.rosters)
    ? body.rosters.map((r: unknown) => String(r).trim()).filter(Boolean)
    : [];

  const existing = await prisma.company.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: "A company with that name already exists" }, { status: 409 });

  const company = await prisma.company.create({
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
