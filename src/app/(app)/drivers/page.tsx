"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useDrivers } from "@/hooks/use-drivers";
import { useUIStore } from "@/store/ui-store";
import { DriverFilters } from "@/components/drivers/driver-filters";
import { DriverTable } from "@/components/drivers/driver-table";
import { Card, CardContent } from "@/components/ui/card";
import { statusForDate } from "@/lib/compliance";
import { exportDriversToXlsx, exportDriversToCsv } from "@/lib/export";
import { filterByCompanyRoster } from "@/lib/scope";
import type { DriverDTO, FormFieldKey } from "@/types/driver";

function SyncStatusFromUrl() {
  const searchParams = useSearchParams();
  const setStatusTab = useUIStore((s) => s.setStatusTab);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "ACTIVE" || status === "INACTIVE" || status === "TERMINATED" || status === "ALL") {
      setStatusTab(status);
    }
  }, [searchParams, setStatusTab]);

  return null;
}

function matchesSearch(driver: DriverDTO, query: string): boolean {
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

export default function DriversPage() {
  const { data: drivers, isLoading, isError } = useDrivers();
  const statusTab = useUIStore((s) => s.statusTab);
  const search = useUIStore((s) => s.search);
  const formFilter = useUIStore((s) => s.formFilter);
  const windowFilter = useUIStore((s) => s.windowFilter);
  const companyFilter = useUIStore((s) => s.companyFilter);
  const rosterFilter = useUIStore((s) => s.rosterFilter);

  const scoped = useMemo(
    () => (drivers ? filterByCompanyRoster(drivers, companyFilter, rosterFilter) : []),
    [drivers, companyFilter, rosterFilter]
  );

  const filtered = useMemo(() => {
    return scoped.filter((driver) => {
      if (statusTab !== "ALL" && driver.status !== statusTab) return false;
      if (!matchesSearch(driver, search)) return false;

      if (formFilter !== "ALL") {
        const value = driver.complianceForm?.[formFilter as FormFieldKey] ?? null;
        if (windowFilter === "ALL") {
          if (!value) return false;
        } else {
          const status = statusForDate(value);
          const target = windowFilter === "expired" ? "expired" : windowFilter === "30" ? "expiring_30" : "expiring_60";
          if (status !== target) return false;
        }
      }

      return true;
    });
  }, [scoped, statusTab, search, formFilter, windowFilter]);

  return (
    <div className="flex flex-col gap-4 max-w-[1400px]">
      <Suspense fallback={null}>
        <SyncStatusFromUrl />
      </Suspense>

      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Drivers</h1>
        <p className="text-sm text-neutral-500">Filter, search, and track 19-A compliance forms per driver.</p>
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
          <DriverFilters
            filteredCount={filtered.length}
            totalCount={scoped.length}
            onExportXlsx={() => exportDriversToXlsx(filtered)}
            onExportCsv={() => exportDriversToCsv(filtered)}
          />
          <Card>
            <CardContent className="p-0">
              <DriverTable drivers={filtered} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
