import type { DriverDTO } from "@/types/driver";

/** Distinct, sorted company names present in the driver set. */
export function getCompanyOptions(drivers: DriverDTO[]): string[] {
  const set = new Set<string>();
  for (const d of drivers) if (d.company) set.add(d.company);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Distinct, sorted roster codes present in the driver set, optionally scoped to one company. */
export function getRosterOptions(drivers: DriverDTO[], company: string): string[] {
  const set = new Set<string>();
  for (const d of drivers) {
    if (company !== "ALL" && d.company !== company) continue;
    if (d.roster) set.add(d.roster);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Narrows a driver list to the selected company/roster scope. "ALL" means unrestricted. */
export function filterByCompanyRoster(drivers: DriverDTO[], company: string, roster: string): DriverDTO[] {
  return drivers.filter((d) => {
    if (company !== "ALL" && d.company !== company) return false;
    if (roster !== "ALL" && d.roster !== roster) return false;
    return true;
  });
}
