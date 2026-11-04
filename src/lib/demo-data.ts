import type { PrismaClient } from "@/generated/prisma/client";
import { getServerFormFieldDefs } from "@/lib/server-form-fields";
import type { FormFieldKey } from "@/types/driver";

/** Login code of the public demo account (the one on the flyer). */
export const DEMO_TENANT_CODE = "0000";

const DAY = 86_400_000;

type DemoRole = "expired" | "expiring_30" | "expiring_60" | "compliant";

/** Stable 32-bit FNV-1a hash, so a driver keeps the same role and dates from one day to the next. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** Share of active demo drivers with no expired form: the Overview's "audit ready" figure. */
const READY_SHARE = 0.9;

/** Role of the j-th audit-ready driver: a few are due within 30 or 60 days, the rest are clear. */
function readyRole(j: number): DemoRole {
  if ([2, 12, 22].includes(j % 50)) return "expiring_30";
  if ([6, 31].includes(j % 50)) return "expiring_60";
  return "compliant";
}

/** Days from today for a form date, kept clear of the 0/30/60-day edges so the browser's time zone can't move it. */
function daysOut(role: DemoRole, h: number): number {
  if (role === "expired") return -(2 + (h % 44));
  if (role === "expiring_30") return 3 + (h % 26);
  if (role === "expiring_60") return 33 + (h % 26);
  return 75 + (h % 620);
}

/**
 * Rewrites the form dates of the demo account's active drivers relative to today: 90% audit
 * ready, the rest with one expired form, plus a few due within 30 or 60 days. Run daily
 * (docker/daily.sh) so the demo doesn't drift as the dates pass.
 */
export async function refreshDemoCompliance(db: PrismaClient, now: Date = new Date()) {
  const noon = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12);
  const at = (days: number) => new Date(noon + days * DAY);

  const [drivers, formFieldDefs] = await Promise.all([
    db.driver.findMany({ where: { status: "ACTIVE" }, select: { id: true, company: true } }),
    getServerFormFieldDefs(db),
  ]);
  // Grouped by company, so each company also lands near 90%.
  drivers.sort((a, b) => (a.company ?? "").localeCompare(b.company ?? "") || hash(a.id) - hash(b.id));

  const builtIn = formFieldDefs.filter((f) => !f.isCustom);
  const custom = formFieldDefs.filter((f) => f.isCustom);
  const counts: Record<DemoRole, number> = { expired: 0, expiring_30: 0, expiring_60: 0, compliant: 0 };
  const writes: (() => Promise<unknown>)[] = [];

  // The expired ones are spread evenly through the list, as close to 1 - READY_SHARE as the count allows.
  const total = drivers.length;
  const expiredCount = total - Math.round(total * READY_SHARE);
  let ready = 0;

  drivers.forEach((driver, k) => {
    const expired = Math.floor(((k + 1) * expiredCount) / total) > Math.floor((k * expiredCount) / total);
    const role = expired ? "expired" : readyRole(ready++);
    counts[role]++;
    const problemForm = formFieldDefs[hash(driver.id) % formFieldDefs.length].key;
    const dateFor = (key: string) => at(daysOut(key === problemForm ? role : "compliant", hash(driver.id + key)));

    const form: Partial<Record<FormFieldKey, Date>> = Object.fromEntries(builtIn.map((f) => [f.key, dateFor(f.key)]));
    writes.push(() =>
      db.complianceForm.upsert({ where: { driverId: driver.id }, create: { driverId: driver.id, ...form }, update: form })
    );
    for (const f of custom) {
      const date = dateFor(f.key);
      writes.push(() =>
        db.customFormValue.upsert({
          where: { driverId_formKey: { driverId: driver.id, formKey: f.key } },
          create: { driverId: driver.id, formKey: f.key, date },
          update: { date },
        })
      );
    }
  });

  // Ten at a time: the database is a network hop away.
  for (let i = 0; i < writes.length; i += 10) await Promise.all(writes.slice(i, i + 10).map((write) => write()));

  return { drivers: drivers.length, ...counts };
}
