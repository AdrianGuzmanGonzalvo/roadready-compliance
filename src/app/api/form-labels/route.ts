import { NextResponse } from "next/server";
import { requireAdmin, getSessionUser } from "@/lib/auth";
import { FORM_FIELD_DEFS } from "@/types/driver";

const VALID_KEYS = new Set<string>(FORM_FIELD_DEFS.map((f) => f.key));
const EDITABLE_FIELDS = ["label", "description", "frequency"] as const;
type EditableField = (typeof EDITABLE_FIELDS)[number];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rows, customForms] = await Promise.all([
    user.db.formLabel.findMany(),
    user.db.customForm.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  const overrides = Object.fromEntries(
    rows.map((r) => [
      r.key,
      {
        ...(r.label ? { label: r.label } : {}),
        ...(r.description ? { description: r.description } : {}),
        ...(r.frequency ? { frequency: r.frequency } : {}),
      },
    ])
  );
  return NextResponse.json({
    overrides,
    customForms: customForms.map((f) => ({
      key: f.key,
      label: f.label,
      description: f.description,
      frequency: f.frequency,
      isCustom: true,
    })),
  });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  const field = typeof body?.field === "string" ? (body.field as EditableField) : null;
  const value = typeof body?.value === "string" ? body.value.trim() : null;

  if (!VALID_KEYS.has(key)) {
    return NextResponse.json({ error: "Unknown form field key" }, { status: 400 });
  }
  if (!field || !EDITABLE_FIELDS.includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  const existing = await admin.db.formLabel.findUnique({ where: { key } });
  const next = {
    label: existing?.label ?? null,
    description: existing?.description ?? null,
    frequency: existing?.frequency ?? null,
    [field]: value && value.length > 0 ? value : null,
  };

  if (!next.label && !next.description && !next.frequency) {
    await admin.db.formLabel.deleteMany({ where: { key } });
    return NextResponse.json({ ok: true });
  }

  const row = await admin.db.formLabel.upsert({
    where: { key },
    create: { key, ...next },
    update: next,
  });
  return NextResponse.json({ formLabel: row });
}
