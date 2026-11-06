import type { PrismaClient } from "@/generated/prisma/client";
import { getServerFormFieldDefs } from "@/lib/server-form-fields";
import type { FormFieldKey } from "@/types/driver";

/** Login code of the public demo account (the one on the flyer). */
export const DEMO_TENANT_CODE = "0000";

/**
 * What the demo account is called (it shows in report emails). Invented; it must keep "Demo" in it,
 * which is what lets the daily refresh touch this account at all (see the refresh-demo route).
 */
export const DEMO_TENANT_NAME = "Harborline Transit (Demo)";

/** The demo was copied from this real customer's data; companies named after it get an invented name. */
const REAL_CUSTOMER = /primeflight/i;
const DEMO_COMPANY_NAMES = ["Harborline Transit", "Summit Ridge Shuttle", "Lakeview Transit Group", "Northgate Coach Lines"];

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

  await runInBatches(writes);
  return { drivers: drivers.length, ...counts };
}

/** Ten at a time: the database is a network hop away. */
async function runInBatches(writes: (() => Promise<unknown>)[]) {
  for (let i = 0; i < writes.length; i += 10) await Promise.all(writes.slice(i, i + 10).map((write) => write()));
}

const FIRST_NAMES = [
  "James", "Maria", "Robert", "Linda", "Michael", "Patricia", "David", "Jennifer", "Carlos", "Elizabeth",
  "Daniel", "Susan", "Anthony", "Jessica", "Kevin", "Sarah", "Brian", "Karen", "Jose", "Nancy",
  "Marcus", "Lisa", "Steven", "Angela", "Luis", "Michelle", "Andrew", "Sandra", "Eric", "Donna",
  "Victor", "Carol", "Raymond", "Ruth", "Gregory", "Sharon", "Samuel", "Laura", "Frank", "Rosa",
  "Dennis", "Diane", "Jorge", "Gloria", "Peter", "Teresa", "Henry", "Ana", "Walter", "Denise",
];
const LAST_NAMES = [
  "Walker", "Rivera", "Bennett", "Hayes", "Morales", "Brooks", "Fisher", "Ortega", "Coleman", "Jenkins",
  "Perry", "Russell", "Sullivan", "Reyes", "Griffin", "Foster", "Dixon", "Medina", "Holland", "Warren",
  "Fleming", "Castillo", "Barker", "Hudson", "Lambert", "Mendez", "Parsons", "Quinn", "Rhodes", "Salazar",
  "Tucker", "Vaughn", "Wheeler", "Yates", "Archer", "Bishop", "Carver", "Delgado", "Ellison", "Franco",
  "Garner", "Hopkins", "Ingram", "Keller", "Lowery", "Marsh", "Norris", "Osborne", "Pruitt", "Ramsey",
];
const AREA_CODES = ["212", "347", "516", "631", "718", "914"];

/** The i-th invented name; no two of the first 2,500 are the same. */
function inventedName(i: number): { firstName: string; lastName: string } {
  const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
  const lastName = LAST_NAMES[(i + Math.floor(i / FIRST_NAMES.length)) % LAST_NAMES.length];
  return { firstName, lastName };
}

/** `n` digits derived from `seed`, so a driver gets the same invented number every day. */
function digits(seed: string, n: number): string {
  return String(hash(seed) % 10 ** n).padStart(n, "0");
}

/**
 * Replaces every personal detail in the demo account with invented values: driver names, numbers,
 * phone, email, license, date of birth and medical notes, and the companies' contact people. Its
 * document records are removed so no real file can be opened from the demo (the files themselves stay
 * on the server). Deterministic, so running it daily changes nothing after the first time; fields
 * that were empty stay empty, so the demo keeps its shape. Run before refreshDemoCompliance.
 */
export async function anonymizeDemoAccount(db: PrismaClient) {
  const companiesRenamed = await renameRealCustomerCompanies(db);
  const [drivers, companies] = await Promise.all([
    db.driver.findMany({
      select: { id: true, pfl: true, clientId: true, phone: true, email: true, driversLicense: true, ssn: true, dob: true },
    }),
    db.company.findMany({
      select: { id: true, name: true, legalName: true, address: true, contactName: true, contactPhone: true, contactEmail: true },
    }),
  ]);
  drivers.sort((a, b) => hash(a.id) - hash(b.id) || a.id.localeCompare(b.id));

  const fakePhone = (seed: string) => `(${AREA_CODES[hash(seed) % AREA_CODES.length]}) 555-01${digits(seed, 2)}`;

  const writes: (() => Promise<unknown>)[] = drivers.map((d, i) => () => {
    const { firstName, lastName } = inventedName(i);
    return db.driver.update({
      where: { id: d.id },
      data: {
        firstName,
        lastName,
        pfl: d.pfl && digits(`${d.id}pfl`, 5),
        clientId: d.clientId && digits(`${d.id}client`, 6),
        phone: d.phone && fakePhone(`${d.id}phone`),
        email: d.email && `${firstName}.${lastName}@example.com`.toLowerCase(),
        driversLicense: d.driversLicense && `DEMO${digits(`${d.id}license`, 5)}`,
        ssn: d.ssn && `***-**-${digits(`${d.id}ssn`, 4)}`,
        dob: d.dob && new Date(Date.UTC(1962, 0, 1, 12) + (hash(`${d.id}dob`) % 13_800) * DAY),
        note: null,
        medicalCondition: null,
        bpFollowUp: null,
        diabeticFollowUp: null,
      },
    });
  });

  companies.forEach((c, j) => {
    const contact = inventedName(j * 7 + 3);
    writes.push(() =>
      db.company.update({
        where: { id: c.id },
        data: {
          legalName: c.legalName && `${c.name} LLC`,
          address: c.address && `${120 + j * 40} Harbor Road, Queens, NY 11430`,
          contactName: c.contactName && `${contact.firstName} ${contact.lastName}`,
          contactPhone: c.contactPhone && fakePhone(`${c.id}phone`),
          contactEmail: c.contactEmail && `contact${j + 1}@example.com`,
          notes: null,
        },
      })
    );
  });

  await runInBatches(writes);
  const [, { count: documentsRemoved }] = await Promise.all([
    db.roster.updateMany({ data: { notes: null } }),
    db.driverDocument.deleteMany({}),
  ]);
  return { drivers: drivers.length, companies: companies.length, companiesRenamed, documentsRemoved };
}

/**
 * Gives every company named after the real customer an invented name, everywhere a company name is
 * stored: the company itself, its drivers and report schedules (they refer to it by name, not id).
 * Covers names that only appear on drivers too. Finds nothing to do after the first run.
 */
async function renameRealCustomerCompanies(db: PrismaClient): Promise<number> {
  const [companies, driverCompanies] = await Promise.all([
    db.company.findMany({ select: { name: true } }),
    db.driver.findMany({ where: { company: { not: null } }, select: { company: true }, distinct: ["company"] }),
  ]);
  const names = new Set([...companies.map((c) => c.name), ...driverCompanies.map((d) => d.company ?? "")]);
  // Actual companies first, so the main one gets the first invented name (the account's own).
  const companyNames = new Set(companies.map((c) => c.name));
  const real = [...names]
    .filter((name) => REAL_CUSTOMER.test(name))
    .sort((a, b) => Number(!companyNames.has(a)) - Number(!companyNames.has(b)) || a.localeCompare(b));
  const free = DEMO_COMPANY_NAMES.filter((name) => !names.has(name));

  for (const [i, from] of real.entries()) {
    const to = free[i] ?? `Demo Transit ${i + 1}`;
    await db.$transaction([
      db.company.updateMany({ where: { name: from }, data: { name: to } }),
      db.driver.updateMany({ where: { company: from }, data: { company: to } }),
      db.reportSchedule.updateMany({ where: { companyFilter: from }, data: { companyFilter: to } }),
    ]);
  }
  return real.length;
}
