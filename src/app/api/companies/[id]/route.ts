import { NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { ignoreNotFound } from "@/lib/prisma";
import { serializeCompany } from "@/lib/serialize";

const TEXT_FIELDS = ["name", "legalName", "address", "contactName", "contactPhone", "contactEmail", "notes"] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireWriteAccess();
  if (user instanceof NextResponse) return user;

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

  const renamed = !!data.name && data.name !== existing.name;
  if (renamed) {
    const nameTaken = await user.db.company.findUnique({ where: { name: data.name! } });
    if (nameTaken) return NextResponse.json({ error: "A company with that name already exists" }, { status: 409 });
  }

  const update = user.db.company.update({
    where: { id },
    data,
    include: { rosters: { orderBy: { name: "asc" } } },
  });

  // Drivers and report schedules refer to a company by its name, not its id: carry a rename over to them.
  const company = renamed
    ? (
        await user.db.$transaction([
          update,
          user.db.driver.updateMany({ where: { company: existing.name }, data: { company: data.name } }),
          user.db.reportSchedule.updateMany({ where: { companyFilter: existing.name }, data: { companyFilter: data.name } }),
        ])
      )[0]
    : await update;

  return NextResponse.json({ company: serializeCompany(company) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireWriteAccess();
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  await user.db.company.delete({ where: { id } }).catch(ignoreNotFound);
  return NextResponse.json({ ok: true });
}
