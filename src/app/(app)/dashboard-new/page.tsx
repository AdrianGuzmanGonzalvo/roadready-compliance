"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useDrivers } from "@/hooks/use-drivers";
import { useUIStore } from "@/store/ui-store";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import { filterByCompanyRoster, matchesSearch, matchesKpiStatusFilter } from "@/lib/scope";
import { KpiCardsNew } from "@/components/dashboard-new/kpi-cards-new";
import { DriverScorecardsGrid } from "@/components/dashboard-new/driver-scorecards-grid";
import { SCORECARD_VIEWS, type ScorecardView } from "@/components/dashboard-new/scorecard-data";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const VIEW_STORAGE_KEY = "dashboard-new-scorecard-view";

const KPI_FILTER_LABEL: Record<string, string> = {
  expired: "Overdue / Expired Forms",
  expiring_30: "Expiring in 30 Days",
  expiring_60: "Expiring in 60 Days",
};

export default function DashboardNewPage() {
  const { data: drivers, isLoading, isError } = useDrivers();
  const companyFilter = useUIStore((s) => s.companyFilter);
  const rosterFilter = useUIStore((s) => s.rosterFilter);
  const search = useUIStore((s) => s.search);
  const kpiStatusFilter = useUIStore((s) => s.kpiStatusFilter);
  const setKpiStatusFilter = useUIStore((s) => s.setKpiStatusFilter);
  const formFieldDefs = useFormFieldDefs();
  const [view, setView] = useState<ScorecardView>("structured");

  useEffect(() => {
    // Hydrates a client-only preference after mount, deliberately — reading
    // localStorage during render would desync from the server-rendered HTML.
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored && SCORECARD_VIEWS.some((v) => v.value === stored)) setView(stored as ScorecardView);
    } catch {
      // ignore — falls back to the default view
    }
  }, []);

  function handleViewChange(next: ScorecardView) {
    if (next !== view) trackEvent("scorecard_view_changed", { view: next });
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // per-browser convenience only — fine if it doesn't persist
    }
  }

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

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Driver Compliance Scorecards</h2>
              <p className="text-xs text-neutral-400">Click a card to view or update a driver&apos;s compliance dates.</p>
            </div>

            <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1" role="tablist" aria-label="Scorecard view">
              {SCORECARD_VIEWS.map((v) => (
                <button
                  key={v.value}
                  role="tab"
                  aria-selected={view === v.value}
                  onClick={() => handleViewChange(v.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    view === v.value ? "bg-white text-blue-600 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <DriverScorecardsGrid drivers={filtered} view={view} />
        </>
      )}
    </div>
  );
}
