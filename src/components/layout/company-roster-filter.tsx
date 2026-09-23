"use client";

import { Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUIStore } from "@/store/ui-store";
import { useDrivers } from "@/hooks/use-drivers";
import { useCompanies } from "@/hooks/use-companies";
import { getCompanyOptions } from "@/lib/scope";

export function CompanyRosterFilter() {
  const { data: drivers } = useDrivers();
  const { data: managedCompanies } = useCompanies();
  const companyFilter = useUIStore((s) => s.companyFilter);
  const setCompanyFilter = useUIStore((s) => s.setCompanyFilter);

  // Union the managed Companies list with whatever's actually on driver records,
  // so nothing (including legacy/unmanaged values) disappears from the filter.
  const driverCompanies = drivers ? getCompanyOptions(drivers) : [];
  const companies = Array.from(new Set([...(managedCompanies?.map((c) => c.name) ?? []), ...driverCompanies])).sort(
    (a, b) => a.localeCompare(b)
  );

  if (companies.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Building2 className="size-4 text-neutral-400 hidden sm:block" />
      <Select value={companyFilter} onValueChange={setCompanyFilter}>
        <SelectTrigger
          className="w-[150px] sm:w-[260px]"
          title={companyFilter === "ALL" ? "Filter by company" : companyFilter}
        >
          <SelectValue placeholder="All Companies" className="min-w-0 truncate" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Companies</SelectItem>
          {companies.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
