import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { serializeCompany } from "@/lib/serialize";

const TEXT_FIELDS = ["name", "address", "contactName", "contactPhone", "contactEmail", "notes"] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const data: Record<string, string | null> = {};
  for (const field of TEXT_FIELDS) {
    if (field in body) {
      const value = typeof body[field] === "string" ? body[field].trim() : "";
      if (field === "name" && !value) {
        return NextResponse.json({ error: "Company name is required" }, { status: 400 });
      }
      data[field] = value || null;
    }
  }

  const existing = await user.db.company.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  if (data.name && data.name !== existing.name) {
    const nameTaken = await user.db.company.findUnique({ where: { name: data.name } });
    if (nameTaken) return NextResponse.json({ error: "A company with that name already exists" }, { status: 409 });
  }

  const company = await user.db.company.update({
    where: { id },
    data,
    include: { rosters: { orderBy: { name: "asc" } } },
  });

  return NextResponse.json({ company: serializeCompany(company) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await user.db.company.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
