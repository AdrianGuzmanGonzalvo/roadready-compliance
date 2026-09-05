"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useDrivers } from "@/hooks/use-drivers";
import { useUIStore } from "@/store/ui-store";
import { filterByCompanyRoster } from "@/lib/scope";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ExpirationMatrix } from "@/components/dashboard/expiration-matrix";
import { AdBanner } from "@/components/ads/ad-banner";

const DASHBOARD_AD_SLOT = "9072065418";

export default function DashboardPage() {
  const { data: drivers, isLoading, isError } = useDrivers();
  const companyFilter = useUIStore((s) => s.companyFilter);
  const rosterFilter = useUIStore((s) => s.rosterFilter);

  const scoped = useMemo(
    () => (drivers ? filterByCompanyRoster(drivers, companyFilter, rosterFilter) : []),
    [drivers, companyFilter, rosterFilter]
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

      <AdBanner slot={DASHBOARD_AD_SLOT} className="print:hidden" />

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
          <ExpirationMatrix drivers={scoped} />
        </>
      )}
    </div>
  );
}
