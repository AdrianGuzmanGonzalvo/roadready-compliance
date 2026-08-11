"use client";

import { Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUIStore } from "@/store/ui-store";
import { useDrivers } from "@/hooks/use-drivers";
import { getCompanyOptions, getRosterOptions } from "@/lib/scope";

export function CompanyRosterFilter() {
  const { data: drivers } = useDrivers();
  const companyFilter = useUIStore((s) => s.companyFilter);
  const setCompanyFilter = useUIStore((s) => s.setCompanyFilter);
  const rosterFilter = useUIStore((s) => s.rosterFilter);
  const setRosterFilter = useUIStore((s) => s.setRosterFilter);

  const companies = drivers ? getCompanyOptions(drivers) : [];
  const rosters = drivers ? getRosterOptions(drivers, companyFilter) : [];

  if (companies.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Building2 className="size-4 text-neutral-400 hidden sm:block" />
      <Select value={companyFilter} onValueChange={setCompanyFilter}>
        <SelectTrigger className="w-[150px]" title="Filter by company">
          <SelectValue placeholder="All Companies" />
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

      <Select value={rosterFilter} onValueChange={setRosterFilter} disabled={rosters.length === 0}>
        <SelectTrigger className="w-[130px]" title="Filter by roster">
          <SelectValue placeholder="All Rosters" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Rosters</SelectItem>
          {rosters.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
