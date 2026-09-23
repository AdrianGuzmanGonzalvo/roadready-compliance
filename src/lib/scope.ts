import type { DriverDTO } from "@/types/driver";

/** Distinct, sorted company names present in the driver set. */
export function getCompanyOptions(drivers: DriverDTO[]): string[] {
  const set = new Set<string>();
  for (const d of drivers) if (d.company) set.add(d.company);
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

/** Whether a driver matches the topbar search box: name, license #, client ID, company, roster, or phone. */
export function matchesSearch(driver: DriverDTO, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    driver.lastName.toLowerCase().includes(q) ||
    driver.firstName.toLowerCase().includes(q) ||
    `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(q) ||
    (driver.driversLicense?.toLowerCase().includes(q) ?? false) ||
    (driver.clientId?.toLowerCase().includes(q) ?? false) ||
    (driver.company?.toLowerCase().includes(q) ?? false) ||
    (driver.roster?.toLowerCase().includes(q) ?? false) ||
    (driver.phone?.toLowerCase().includes(q) ?? false)
  );
}
