"use client";

import { DriverScorecard } from "@/components/dashboard-new/driver-scorecard";
import { DriverScorecardHierarchy } from "@/components/dashboard-new/driver-scorecard-hierarchy";
import { DriverScorecardDataFocus } from "@/components/dashboard-new/driver-scorecard-data-focus";
import { DriverScorecardCompact } from "@/components/dashboard-new/driver-scorecard-compact";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import type { ScorecardView } from "@/components/dashboard-new/scorecard-data";
import type { DriverDTO } from "@/types/driver";

const VIEW_COMPONENT = {
  structured: DriverScorecard,
  hierarchy: DriverScorecardHierarchy,
  "data-focus": DriverScorecardDataFocus,
  compact: DriverScorecardCompact,
} as const;

export function DriverScorecardsGrid({ drivers, view }: { drivers: DriverDTO[]; view: ScorecardView }) {
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

  const ScorecardComponent = VIEW_COMPONENT[view];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {active.map((driver) => (
        <ScorecardComponent key={driver.id} driver={driver} formFieldDefs={formFieldDefs} />
      ))}
    </div>
  );
}
