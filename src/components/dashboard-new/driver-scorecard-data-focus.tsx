"use client";

import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { buildScorecardData, STATUS_BADGE_CLASS, RING_BLUE } from "@/components/dashboard-new/scorecard-data";
import type { FormFieldDef, DriverDTO } from "@/types/driver";

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_ORDER = ["compliant", "expiring_60", "expiring_30", "expired"] as const;

/** View 3 — "Data Visualization Focus": hero ring, this driver's own status-mix bar, 2-col audit list. */
export function DriverScorecardDataFocus({ driver, formFieldDefs }: { driver: DriverDTO; formFieldDefs: FormFieldDef[] }) {
  const openDriver = useUIStore((s) => s.openDriver);
  const { score, actionText, nextDays, urgent, cells } = buildScorecardData(driver, formFieldDefs);
  const offset = CIRCUMFERENCE - (score.pct / 100) * CIRCUMFERENCE;

  const tracked = cells.filter((c) => c.status !== "missing");
  const segments = SEGMENT_ORDER.map((status) => ({
    status,
    count: tracked.filter((c) => c.status === status).length,
  })).filter((s) => s.count > 0);

  return (
    <Card
      className="rounded-xl overflow-hidden cursor-pointer transition-shadow hover:shadow-md hover:border-neutral-300"
      onClick={() => openDriver(driver.id)}
    >
      {urgent[0] && (
        <div
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b",
            urgent[0].days < 0 ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
          )}
        >
          <AlertTriangle className="size-3.5 shrink-0" />
          <span className="truncate">{urgent[0].label}</span>
          <span className="ml-auto shrink-0">{urgent[0].days}d</span>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 text-sm truncate">
          {driver.lastName}, {driver.firstName}
        </h3>
        <p className="text-xs text-neutral-400 truncate">{driver.company ?? "—"}</p>

        <div className="relative mx-auto mt-3 size-20">
          <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
            <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="#EEF2FF" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r={RADIUS}
              fill="none"
              stroke={RING_BLUE}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-neutral-900">{score.pct}%</span>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            <span>Status Mix</span>
            <span>{tracked.length} forms</span>
          </div>
          <div className="mt-1 h-2 rounded-full overflow-hidden flex bg-neutral-100">
            {segments.map((s) => (
              <div key={s.status} className={STATUS_BADGE_CLASS[s.status]} style={{ width: `${(s.count / tracked.length) * 100}%` }} />
            ))}
          </div>
        </div>

        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Next Action</p>
          <p className={cn("text-xs font-bold truncate", nextDays !== null && nextDays < 0 ? "text-red-600" : "text-neutral-700")}>
            {actionText}
          </p>
        </div>

        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Audit Readiness</p>
          <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
            {cells.map((c) => (
              <div
                key={c.key}
                title={`${c.label}${c.date ? ` — ${format(new Date(c.date), "MMM d, yyyy")}` : " — no date on file"}`}
                className="flex items-center gap-1.5 text-[11px]"
              >
                <span className={cn("size-1.5 rounded-full shrink-0", STATUS_BADGE_CLASS[c.status])} />
                <span className="text-neutral-600 truncate">{c.label}</span>
                <span className="ml-auto shrink-0 font-semibold text-neutral-800">{c.days === null ? "—" : `${c.days}d`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
