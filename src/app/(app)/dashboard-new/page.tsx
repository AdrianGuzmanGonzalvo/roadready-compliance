"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useDrivers } from "@/hooks/use-drivers";
import { useUIStore } from "@/store/ui-store";
import { filterByCompanyRoster, matchesSearch } from "@/lib/scope";
import { KpiCardsNew } from "@/components/dashboard-new/kpi-cards-new";
import { DriverScorecardsGrid } from "@/components/dashboard-new/driver-scorecards-grid";

export default function DashboardNewPage() {
  const { data: drivers, isLoading, isError } = useDrivers();
  const companyFilter = useUIStore((s) => s.companyFilter);
  const rosterFilter = useUIStore((s) => s.rosterFilter);
  const search = useUIStore((s) => s.search);

  const scoped = useMemo(
    () => (drivers ? filterByCompanyRoster(drivers, companyFilter, rosterFilter).filter((d) => matchesSearch(d, search)) : []),
    [drivers, companyFilter, rosterFilter, search]
  );

  const scopeLabel =
    companyFilter === "ALL" ? "All companies" : rosterFilter === "ALL" ? companyFilter : `${companyFilter} / ${rosterFilter}`;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px]">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Executive Dashboard</h1>
        <p className="text-sm text-neutral-500">
          Article 19-A driver qualification record compliance overview.
          {companyFilter !== "ALL" && <span className="text-neutral-400"> · Scoped to {scopeLabel}</span>}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-neutral-400 text-sm py-12 justify-center">
          <Loader2 className="size-4 animate-spin" />
          Loading drivers...
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load driver data.
        </div>
      )}

      {drivers && (
        <>
          <KpiCardsNew drivers={scoped} />

          <div>
            <h2 className="text-base font-semibold text-neutral-900">Driver Compliance Scorecards</h2>
            <p className="text-xs text-neutral-400">Click a card to view or update a driver&apos;s compliance dates.</p>
          </div>

          <DriverScorecardsGrid drivers={scoped} />
        </>
      )}
    </div>
  );
}
