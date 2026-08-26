import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { FORM_FIELD_DEFS } from "@/types/driver";

const BUILT_IN_KEYS = new Set<string>(FORM_FIELD_DEFS.map((f) => f.key));

function slugify(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "form";
}

async function generateUniqueKey(label: string): Promise<string> {
  const base = slugify(label);
  const existing = new Set((await prisma.customForm.findMany({ select: { key: true } })).map((f) => f.key));

  if (!BUILT_IN_KEYS.has(base) && !existing.has(base)) return base;

  let n = 2;
  while (BUILT_IN_KEYS.has(`${base}-${n}`) || existing.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => null);
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const frequency = typeof body?.frequency === "string" ? body.frequency.trim() : "";

  if (!label) return NextResponse.json({ error: "Form name is required" }, { status: 400 });

  const key = await generateUniqueKey(label);

  const customForm = await prisma.customForm.create({
    data: { key, label, description, frequency },
  });

  return NextResponse.json({ customForm }, { status: 201 });
}
