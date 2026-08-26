import * as XLSX from "xlsx";
import { DEFAULT_FORM_FIELD_DEFS } from "@/types/driver";
import type { DriverDTO, FormFieldDef } from "@/types/driver";
import { daysRemaining, getFormDate, type DueSoonEntry } from "@/lib/compliance";

function fmt(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function writeXlsx(rows: Record<string, string | number>[], sheetName: string, filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

function writeCsv(rows: Record<string, string | number>[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toRow(driver: DriverDTO, formFieldDefs: readonly FormFieldDef[]): Record<string, string | number> {
  const row: Record<string, string | number> = {
    "Last Name": driver.lastName,
    "First Name": driver.firstName,
    Status: driver.status,
    Company: driver.company ?? "",
    Roster: driver.roster ?? "",
    "Client ID": driver.clientId ?? "",
    Phone: driver.phone ?? "",
    Position: driver.position ?? "",
    "Driver's License": driver.driversLicense ?? "",
    "License Class": driver.licenseClass ?? "",
    Endorsements: driver.endorsements ?? "",
    Restrictions: driver.restrictions ?? "",
    DOB: fmt(driver.dob),
    Note: driver.note ?? "",
  };

  for (const f of formFieldDefs) {
    const value = getFormDate(driver, f);
    row[f.label] = fmt(value);
    const days = daysRemaining(value);
    row[`${f.label} (Days)`] = days ?? "";
  }

  return row;
}

export function exportDriversToXlsx(
  drivers: DriverDTO[],
  filename = "roadready-drivers-export.xlsx",
  formFieldDefs: readonly FormFieldDef[] = DEFAULT_FORM_FIELD_DEFS
) {
  writeXlsx(drivers.map((d) => toRow(d, formFieldDefs)), "Drivers", filename);
}

export function exportDriversToCsv(
  drivers: DriverDTO[],
  filename = "roadready-drivers-export.csv",
  formFieldDefs: readonly FormFieldDef[] = DEFAULT_FORM_FIELD_DEFS
) {
  writeCsv(drivers.map((d) => toRow(d, formFieldDefs)), filename);
}

function toDueSoonRow(entry: DueSoonEntry): Record<string, string | number> {
  return {
    "Last Name": entry.lastName,
    "First Name": entry.firstName,
    Company: entry.company ?? "",
    Roster: entry.roster ?? "",
    "Driver Status": entry.driverStatus,
    Form: entry.formLabel,
    "Due Date": fmt(entry.date),
    "Days Remaining": entry.daysRemaining,
    Status: entry.status === "expired" ? "Expired" : "Expiring Soon",
  };
}

export function exportDueSoonToXlsx(entries: DueSoonEntry[], filename = "roadready-soon-to-expire-report.xlsx") {
  writeXlsx(entries.map(toDueSoonRow), "Soon to Expire", filename);
}

export function exportDueSoonToCsv(entries: DueSoonEntry[], filename = "roadready-soon-to-expire-report.csv") {
  writeCsv(entries.map(toDueSoonRow), filename);
}
