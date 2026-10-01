"use client";

import { Search, UploadCloud, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CompanyRosterFilter } from "@/components/layout/company-roster-filter";
import { useUIStore } from "@/store/ui-store";
import { useDrivers } from "@/hooks/use-drivers";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import { useCanEdit } from "@/hooks/use-auth";
import { overallStatus } from "@/lib/compliance";
import { filterByCompanyRoster } from "@/lib/scope";
import { trackEvent } from "@/lib/analytics";

export function TopBar() {
  const search = useUIStore((s) => s.search);
  const setSearch = useUIStore((s) => s.setSearch);
  const setUploadOpen = useUIStore((s) => s.setUploadOpen);
  const canEdit = useCanEdit();
  const companyFilter = useUIStore((s) => s.companyFilter);
  const rosterFilter = useUIStore((s) => s.rosterFilter);
  const { data: drivers } = useDrivers();
  const formFieldDefs = useFormFieldDefs();

  const scoped = drivers ? filterByCompanyRoster(drivers, companyFilter, rosterFilter) : [];
  const expiredCount = scoped.filter(
    (d) => d.status === "ACTIVE" && overallStatus(d, new Date(), formFieldDefs) === "expired"
  ).length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-neutral-200 bg-white/90 px-3 backdrop-blur sm:gap-4 sm:px-4 md:px-6 print:hidden">
      <div className="relative min-w-0 flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, license #, or phone..."
          className="pl-8"
        />
      </div>

      <CompanyRosterFilter />

      {/* On phones the search box takes the free space instead of this spacer. */}
      <div className="hidden flex-1 sm:block" />

      {expiredCount > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
          <AlertTriangle className="size-3.5" />
          {expiredCount} active driver{expiredCount === 1 ? "" : "s"} with expired forms
        </div>
      )}

      {canEdit && (
        <Button
          size="sm"
          title="Upload New Excel"
          aria-label="Upload New Excel"
          className="shrink-0"
          onClick={() => {
            trackEvent("modal_opened", { modal: "upload_excel", location: "topbar" });
            setUploadOpen(true);
          }}
        >
          <UploadCloud className="size-4" />
          {/* Icon-only on phones — the full label pushed the bar wider than the screen. */}
          <span className="hidden sm:inline">Upload New Excel</span>
        </Button>
      )}
    </header>
  );
}
