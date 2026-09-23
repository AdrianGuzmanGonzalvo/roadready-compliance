"use client";

import { useMemo } from "react";
import { Loader2, X } from "lucide-react";
import { useDrivers } from "@/hooks/use-drivers";
import { useUIStore } from "@/store/ui-store";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import { filterByCompanyRoster, matchesSearch, matchesKpiStatusFilter } from "@/lib/scope";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ExpirationMatrix } from "@/components/dashboard/expiration-matrix";

const KPI_FILTER_LABEL: Record<string, string> = {
  expired: "Overdue / Expired Forms",
  expiring_30: "Expiring in 30 Days",
  expiring_60: "Expiring in 60 Days",
};

export default function DashboardPage() {
  const { data: drivers, isLoading, isError } = useDrivers();
  const companyFilter = useUIStore((s) => s.companyFilter);
  const rosterFilter = useUIStore((s) => s.rosterFilter);
  const search = useUIStore((s) => s.search);
  const kpiStatusFilter = useUIStore((s) => s.kpiStatusFilter);
  const setKpiStatusFilter = useUIStore((s) => s.setKpiStatusFilter);
  const formFieldDefs = useFormFieldDefs();

  const scoped = useMemo(
    () => (drivers ? filterByCompanyRoster(drivers, companyFilter, rosterFilter).filter((d) => matchesSearch(d, search)) : []),
    [drivers, companyFilter, rosterFilter, search]
  );

  const filtered = useMemo(
    () => scoped.filter((d) => matchesKpiStatusFilter(d, kpiStatusFilter, formFieldDefs)),
    [scoped, kpiStatusFilter, formFieldDefs]
  );

  const scopeLabel =
    companyFilter === "ALL" ? "All companies" : rosterFilter === "ALL" ? companyFilter : `${companyFilter} / ${rosterFilter}`;

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
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
          <KpiCards drivers={scoped} />

          {kpiStatusFilter !== "ALL" && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 pl-3 pr-1.5 py-1 text-xs font-medium text-blue-700">
                Filtered: {KPI_FILTER_LABEL[kpiStatusFilter]}
                <button
                  type="button"
                  onClick={() => setKpiStatusFilter("ALL")}
                  className="flex size-4 items-center justify-center rounded-full hover:bg-blue-100"
                  aria-label="Clear filter"
                >
                  <X className="size-3" />
                </button>
              </span>
            </div>
          )}

          <ExpirationMatrix drivers={filtered} />
        </>
      )}
    </div>
  );
}
