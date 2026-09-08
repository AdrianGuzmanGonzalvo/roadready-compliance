import type { PrismaClient } from "@/generated/prisma/client";
import { FORM_FIELD_DEFS, type FormFieldDef } from "@/types/driver";

/**
 * Server-side (non-React) equivalent of useFormFieldDefs() — built-in forms
 * merged with admin label overrides, plus any admin-added custom forms.
 * Used by background jobs (e.g. the scheduled-report cron) that can't use
 * client hooks.
 */
export async function getServerFormFieldDefs(db: PrismaClient): Promise<FormFieldDef[]> {
  const [labels, customForms] = await Promise.all([db.formLabel.findMany(), db.customForm.findMany({ orderBy: { createdAt: "asc" } })]);
  const overrides = new Map(labels.map((l) => [l.key, l]));

  const builtIn: FormFieldDef[] = FORM_FIELD_DEFS.map((f) => {
    const o = overrides.get(f.key);
    return {
      key: f.key,
      label: o?.label ?? f.label,
      description: o?.description ?? f.description,
      frequency: o?.frequency ?? f.frequency,
      isCustom: false,
    };
  });

  const custom: FormFieldDef[] = customForms.map((f) => ({
    key: f.key,
    label: f.label,
    description: f.description,
    frequency: f.frequency,
    isCustom: true,
  }));

  return [...builtIn, ...custom];
}
