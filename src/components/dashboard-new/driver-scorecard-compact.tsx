"use client";

import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { buildScorecardData, STATUS_SOLID_CLASS, RING_BLUE, initials } from "@/components/dashboard-new/scorecard-data";
import { trackEvent } from "@/lib/analytics";
import type { FormFieldDef, DriverDTO } from "@/types/driver";

const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** View 4 — "Compact Task-Oriented": avatar/ring header, critical-alerts list, circular form matrix. */
export function DriverScorecardCompact({ driver, formFieldDefs }: { driver: DriverDTO; formFieldDefs: FormFieldDef[] }) {
  const openDriver = useUIStore((s) => s.openDriver);
  const { score, urgent, cells } = buildScorecardData(driver, formFieldDefs, new Date(), 3);
  const offset = CIRCUMFERENCE - (score.pct / 100) * CIRCUMFERENCE;

  return (
    <Card
      className="rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md hover:border-neutral-300"
      onClick={() => {
        trackEvent("driver_opened", { source: "scorecard", scorecard_view: "compact" });
        openDriver(driver.id);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-600">
            {initials(driver)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-neutral-900 text-sm truncate">
              {driver.lastName}, {driver.firstName}
            </h3>
            <p className="text-xs text-neutral-400 truncate">{driver.company ?? "—"}</p>
          </div>
        </div>

        <div className="relative size-11 shrink-0">
          <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
            <circle cx="22" cy="22" r={RADIUS} fill="none" stroke="#E5EDFF" strokeWidth="5" />
            <circle
              cx="22"
              cy="22"
              r={RADIUS}
              fill="none"
              stroke={RING_BLUE}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-neutral-900">{score.pct}%</div>
        </div>
      </div>

      {urgent.length > 0 && (
        <div className="mt-3 rounded-lg bg-red-50 p-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-red-700 px-1">Critical Alerts</p>
          <div className="mt-1 flex flex-col">
            {urgent.map((u) => (
              <div key={u.label} className="flex items-center gap-1.5 px-1 py-1 text-xs">
                <AlertTriangle className="size-3.5 shrink-0 text-red-500" />
                <span className="text-red-700 font-semibold truncate">
                  Renew {u.label} {u.days < 0 ? "now" : `in ${u.days}d`}
                </span>
                <span className="ml-auto shrink-0 text-[11px] font-bold text-blue-600">Renew Now</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Matrix</p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
            score.auditReady ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
          )}
        >
          {score.auditReady ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
          {score.auditReady ? "Audit ready" : "Not audit ready"}
        </span>
      </div>

      <div className="mt-1.5 grid grid-cols-5 gap-1.5">
        {cells.map((c) => (
          <div
            key={c.key}
            title={`${c.label}${c.date ? ` — ${format(new Date(c.date), "MMM d, yyyy")}` : " — no date on file"}`}
            className={cn("aspect-square rounded-full flex flex-col items-center justify-center gap-0", STATUS_SOLID_CLASS[c.status])}
          >
            <span className="text-[7px] font-bold leading-none">{c.label.length > 6 ? c.label.slice(0, 5) : c.label}</span>
            <span className="text-[7px] font-medium leading-none opacity-90 mt-0.5">{c.days === null ? "—" : `${c.days}d`}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600">
        <FileText className="size-3.5" />
        View All Documents
      </div>
    </Card>
  );
}
