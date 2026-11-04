import { NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { serializeRoster } from "@/lib/serialize";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireWriteAccess();
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const existing = await user.db.roster.findUnique({ where: { id }, include: { company: { select: { name: true } } } });
  if (!existing) return NextResponse.json({ error: "Roster not found" }, { status: 404 });

  const data: Record<string, string | null> = {};
  if ("name" in body) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Roster name is required" }, { status: 400 });
    data.name = name;
  }
  if ("notes" in body) data.notes = body.notes || null;

  const renamed = !!data.name && data.name !== existing.name;
  if (renamed) {
    const nameTaken = await user.db.roster.findUnique({
      where: { companyId_name: { companyId: existing.companyId, name: data.name! } },
    });
    if (nameTaken) return NextResponse.json({ error: "That roster already exists for this company" }, { status: 409 });
  }

  const update = user.db.roster.update({ where: { id }, data });

  // Drivers and report schedules refer to a roster by company name + roster name: carry a rename over to them.
  const company = existing.company.name;
  const roster = renamed
    ? (
        await user.db.$transaction([
          update,
          user.db.driver.updateMany({ where: { company, roster: existing.name }, data: { roster: data.name } }),
          user.db.reportSchedule.updateMany({
            where: { companyFilter: company, rosterFilter: existing.name },
            data: { rosterFilter: data.name },
          }),
        ])
      )[0]
    : await update;
  return NextResponse.json({ roster: serializeRoster(roster) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireWriteAccess();
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  await user.db.roster.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
