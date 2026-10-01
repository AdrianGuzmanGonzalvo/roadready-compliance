"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useDrivers } from "@/hooks/use-drivers";
import { useUIStore } from "@/store/ui-store";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import { filterByCompanyRoster } from "@/lib/scope";
import { OVERVIEW_VIEWS, type OverviewView } from "@/lib/overview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalHealthView } from "@/components/overview/global-health-view";
import { RiskTimelineView } from "@/components/overview/risk-timeline-view";
import { MultiCompanyView } from "@/components/overview/multi-company-view";
import { trackEvent } from "@/lib/analytics";

function OverviewContent() {
  const { data: drivers, isLoading, isError } = useDrivers();
  const companyFilter = useUIStore((s) => s.companyFilter);
  const rosterFilter = useUIStore((s) => s.rosterFilter);
  const formFieldDefs = useFormFieldDefs();

  // The selected proposal lives in the URL (?view=) so a specific one can be linked to.
  const viewParam = useSearchParams().get("view");
  const view: OverviewView = OVERVIEW_VIEWS.find((v) => v.value === viewParam)?.value ?? "health";

  function handleViewChange(next: string) {
    if (next === view) return;
    trackEvent("overview_view_changed", { view: next as OverviewView });
    window.history.replaceState(null, "", `?view=${next}`);
  }

  const scoped = useMemo(
    () => (drivers ? filterByCompanyRoster(drivers, companyFilter, rosterFilter) : []),
    [drivers, companyFilter, rosterFilter]
  );
  const active = useMemo(() => scoped.filter((d) => d.status === "ACTIVE"), [scoped]);

  const scopeLabel = rosterFilter === "ALL" ? companyFilter : `${companyFilter} / ${rosterFilter}`;

  const heading = (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Overview</h1>
      <p className="text-sm text-neutral-500">
        Three ways to read fleet-wide Article 19-A compliance.
        {companyFilter !== "ALL" && <span className="text-neutral-400"> · Scoped to {scopeLabel}</span>}
      </p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 max-w-[1400px]">
      {!drivers && heading}

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
        <Tabs value={view} onValueChange={handleViewChange}>
          {/* Title and view selector share one row so the charts start higher on the screen. */}
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            {heading}
            <TabsList className="grid h-auto w-full grid-cols-3 sm:inline-flex sm:h-9 sm:w-auto">
              {OVERVIEW_VIEWS.map((v) => (
                <TabsTrigger
                  key={v.value}
                  value={v.value}
                  className="h-full whitespace-normal px-2 py-1.5 text-xs leading-tight data-[state=active]:text-blue-600 sm:whitespace-nowrap sm:px-3 sm:py-1 sm:text-sm"
                >
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {active.length === 0 ? (
            <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-400 shadow-sm">
              No active drivers{companyFilter !== "ALL" ? " in this scope" : " yet. Upload an Excel file to get started"}.
            </div>
          ) : (
            <>
              <TabsContent value="health">
                <GlobalHealthView active={active} formFieldDefs={formFieldDefs} />
              </TabsContent>
              <TabsContent value="risk">
                <RiskTimelineView drivers={scoped} active={active} formFieldDefs={formFieldDefs} />
              </TabsContent>
              <TabsContent value="companies">
                <MultiCompanyView
                  active={active}
                  formFieldDefs={formFieldDefs}
                  groupBy={companyFilter === "ALL" ? "company" : "roster"}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      )}
    </div>
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={null}>
      <OverviewContent />
    </Suspense>
  );
}
