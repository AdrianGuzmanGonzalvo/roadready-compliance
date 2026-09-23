"use client";

import { DriverScorecard } from "@/components/dashboard-new/driver-scorecard";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import type { DriverDTO } from "@/types/driver";

export function DriverScorecardsGrid({ drivers }: { drivers: DriverDTO[] }) {
  const formFieldDefs = useFormFieldDefs();
  const active = drivers
    .filter((d) => d.status === "ACTIVE")
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

  if (active.length === 0) {
    return (
      <div className="text-center text-neutral-400 text-sm py-12 rounded-xl border border-neutral-200 bg-white">
        No active drivers yet. Upload an Excel file to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {active.map((driver) => (
        <DriverScorecard key={driver.id} driver={driver} formFieldDefs={formFieldDefs} />
      ))}
    </div>
  );
}
