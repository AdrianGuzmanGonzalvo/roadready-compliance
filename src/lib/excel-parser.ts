import * as XLSX from "xlsx";
import type { DriverStatusValue } from "@/types/driver";

/**
 * Parses the RoadReady driver-list workbook. Expects three sheets:
 *  - PRIME: master identity roster (name, license, SSN, DOB, plus a handful of compliance dates)
 *  - Active: per-driver compliance form tracker for currently active drivers
 *  - Terminated: same tracker shape, for terminated drivers
 *
 * Drivers are merged across sheets by normalized "last name | first name" key, since
 * Active/Terminated rows carry no unique ID of their own in the source spreadsheet.
 */

export interface ParsedDriverFields {
  pfl: string | null;
  lastName: string;
  firstName: string;
  phone: string | null;
  position: string | null;
  driversLicense: string | null;
  ssn: string | null;
  dob: Date | null;
  licenseClass: string | null;
  endorsements: string | null;
  restrictions: string | null;
  status: DriverStatusValue;
  updateResult: string | null;
  medicalCondition: string | null;
  bpFollowUp: string | null;
  diabeticFollowUp: string | null;
}

export interface ParsedComplianceFields {
  mcsa5876: Date | null;
  ds703: Date | null;
  ds704: Date | null;
  licenseExp: Date | null;
  ds870: Date | null;
  ds872: Date | null;
  ds873: Date | null;
  ds875: Date | null;
  ds875y: Date | null;
  annualDefensiveDrivingTest: Date | null;
}

export interface ParsedDriverRecord {
  key: string;
  driver: ParsedDriverFields;
  form: ParsedComplianceFields;
}

export interface ParseResult {
  records: ParsedDriverRecord[];
  warnings: string[];
  sheetsFound: string[];
}

const SHEET_NAMES = { prime: "PRIME", active: "Active", terminated: "Terminated" } as const;

export function normalizeKey(lastName: string, firstName: string): string {
  return `${lastName.trim().toLowerCase()}|${firstName.trim().toLowerCase()}`;
}

function cellStr(row: unknown[], idx: number): string | null {
  const v = row[idx];
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

// Excel serial date epoch: Dec 30 1899
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

function toDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const ms = EXCEL_EPOCH + value * 86400000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || /^(n\/?a|-|tbd|none|pending|complete.*)$/i.test(trimmed)) return null;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return null;
  }
  return null;
}

function maskSSN(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return raw;
  const last4 = digits.slice(-4);
  return `***-**-${last4}`;
}

function sheetToRows(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }) as unknown[][];
}

function parsePrimeRow(row: unknown[]): ParsedDriverRecord | null {
  const lastName = cellStr(row, 2);
  const firstName = cellStr(row, 3);
  if (!lastName || !firstName) return null;

  const driver: ParsedDriverFields = {
    pfl: cellStr(row, 1),
    lastName,
    firstName,
    phone: cellStr(row, 4),
    position: cellStr(row, 5),
    driversLicense: cellStr(row, 6),
    ssn: maskSSN(cellStr(row, 7)),
    dob: toDate(row[8]),
    licenseClass: cellStr(row, 10),
    endorsements: cellStr(row, 11),
    restrictions: cellStr(row, 12),
    status: "ACTIVE",
    updateResult: null,
    medicalCondition: cellStr(row, 14),
    bpFollowUp: cellStr(row, 15),
    diabeticFollowUp: cellStr(row, 16),
  };

  const form: ParsedComplianceFields = {
    mcsa5876: toDate(row[13]),
    ds703: null,
    ds704: null,
    licenseExp: toDate(row[9]),
    ds870: toDate(row[17]),
    ds872: toDate(row[21]),
    ds873: toDate(row[18]),
    ds875: toDate(row[19]),
    ds875y: null,
    annualDefensiveDrivingTest: toDate(row[20]),
  };

  return { key: normalizeKey(lastName, firstName), driver, form };
}

function parseTrackerRow(
  row: unknown[],
  status: "ACTIVE" | "TERMINATED"
): { key: string; lastName: string; firstName: string; status: DriverStatusValue; updateResult: string | null; form: Partial<ParsedComplianceFields> } | null {
  const lastName = cellStr(row, 0);
  const firstName = cellStr(row, 1);
  if (!lastName || !firstName) return null;

  const drop = cellStr(row, 20);
  const resolvedStatus: DriverStatusValue = status === "TERMINATED" ? "TERMINATED" : drop ? "OUT_OF_WORK" : "ACTIVE";

  return {
    key: normalizeKey(lastName, firstName),
    lastName,
    firstName,
    status: resolvedStatus,
    updateResult: cellStr(row, 2),
    form: {
      mcsa5876: toDate(row[3]),
      ds703: toDate(row[5]),
      ds704: toDate(row[7]),
      licenseExp: toDate(row[9]),
      ds870: toDate(row[11]),
      ds872: toDate(row[12]),
      ds873: toDate(row[14]),
      ds875: toDate(row[16]),
      ds875y: toDate(row[18]),
    },
  };
}

function mergeFormFields(base: ParsedComplianceFields, patch: Partial<ParsedComplianceFields>): ParsedComplianceFields {
  const merged = { ...base };
  for (const key of Object.keys(patch) as (keyof ParsedComplianceFields)[]) {
    const value = patch[key];
    if (value !== null && value !== undefined) merged[key] = value;
  }
  return merged;
}

export function parseDriverWorkbook(data: ArrayBuffer | Buffer): ParseResult {
  const workbook = XLSX.read(data, { type: data instanceof Buffer ? "buffer" : "array", cellDates: true });
  const warnings: string[] = [];
  const byKey = new Map<string, ParsedDriverRecord>();

  const primeSheet = workbook.Sheets[SHEET_NAMES.prime];
  if (!primeSheet) {
    warnings.push(`Sheet "${SHEET_NAMES.prime}" not found — driver identity fields (license, SSN, DOB) will be missing.`);
  } else {
    const rows = sheetToRows(primeSheet).slice(1);
    for (const row of rows) {
      const parsed = parsePrimeRow(row);
      if (parsed) byKey.set(parsed.key, parsed);
    }
  }

  function applyTracker(sheetName: string, status: "ACTIVE" | "TERMINATED") {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      warnings.push(`Sheet "${sheetName}" not found — skipping.`);
      return;
    }
    const rows = sheetToRows(sheet).slice(1);
    for (const row of rows) {
      const parsed = parseTrackerRow(row, status);
      if (!parsed) continue;

      const existing = byKey.get(parsed.key);
      if (existing) {
        existing.driver.status = parsed.status;
        existing.driver.updateResult = parsed.updateResult ?? existing.driver.updateResult;
        existing.form = mergeFormFields(existing.form, parsed.form);
      } else {
        byKey.set(parsed.key, {
          key: parsed.key,
          driver: {
            pfl: null,
            lastName: parsed.lastName,
            firstName: parsed.firstName,
            phone: null,
            position: null,
            driversLicense: null,
            ssn: null,
            dob: null,
            licenseClass: null,
            endorsements: null,
            restrictions: null,
            status: parsed.status,
            updateResult: parsed.updateResult,
            medicalCondition: null,
            bpFollowUp: null,
            diabeticFollowUp: null,
          },
          form: {
            mcsa5876: null,
            ds703: null,
            ds704: null,
            licenseExp: null,
            ds870: null,
            ds872: null,
            ds873: null,
            ds875: null,
            ds875y: null,
            annualDefensiveDrivingTest: null,
            ...parsed.form,
          },
        });
      }
    }
  }

  applyTracker(SHEET_NAMES.active, "ACTIVE");
  applyTracker(SHEET_NAMES.terminated, "TERMINATED");

  return {
    records: Array.from(byKey.values()),
    warnings,
    sheetsFound: workbook.SheetNames,
  };
}
