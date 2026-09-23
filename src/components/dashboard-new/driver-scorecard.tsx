"use client";

import { format } from "date-fns";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/compliance";
import { useUIStore } from "@/store/ui-store";
import { buildScorecardData, STATUS_TEXT_COLOR, STATUS_BADGE_CLASS, STATUS_SOLID_CLASS, RING_BLUE } from "@/components/dashboard-new/scorecard-data";
import type { FormFieldDef, DriverDTO } from "@/types/driver";

const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** View 1 — "Structured": header (ring + identity) → alerts → form grid → footer. */
export function DriverScorecard({ driver, formFieldDefs }: { driver: DriverDTO; formFieldDefs: FormFieldDef[] }) {
  const openDriver = useUIStore((s) => s.openDriver);
  const { score, actionText, nextDays, urgent, cells } = buildScorecardData(driver, formFieldDefs);

  const offset = CIRCUMFERENCE - (score.pct / 100) * CIRCUMFERENCE;
  const StatusIcon = score.status === "compliant" || score.status === "expiring_60" ? CheckCircle2 : AlertTriangle;

  return (
    <Card
      className="rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md hover:border-neutral-300"
      onClick={() => openDriver(driver.id)}
    >
      {/* Header: ring + identity, full-width so nothing has to wrap awkwardly */}
      <div className="flex items-center gap-3">
        <div className="relative size-14 shrink-0">
          <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
            <circle cx="28" cy="28" r={RADIUS} fill="none" stroke="#E5EDFF" strokeWidth="6" />
            <circle
              cx="28"
              cy="28"
              r={RADIUS}
              fill="none"
              stroke={RING_BLUE}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-neutral-900">{score.pct}%</span>
          </div>
          <div
            title={STATUS_CONFIG[score.status].label}
            className={cn(
              "absolute -bottom-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full ring-2 ring-white",
              STATUS_BADGE_CLASS[score.status]
            )}
          >
            <StatusIcon className="size-3 text-white" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-neutral-900 text-sm truncate">
            {driver.lastName}, {driver.firstName}
          </h3>
          <p className="text-xs text-neutral-400 truncate">{driver.company ?? "—"}</p>
          <p className={cn("mt-0.5 text-[10.5px] font-bold uppercase tracking-wide", STATUS_TEXT_COLOR[score.status])}>
            {STATUS_CONFIG[score.status].label}
          </p>
        </div>
      </div>

      {/* Urgent alerts, full width */}
      {urgent.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {urgent.slice(0, 2).map((u) => (
            <div
              key={u.label}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold",
                u.days < 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
              )}
            >
              <AlertTriangle className="size-3.5 shrink-0" />
              <span className="truncate">{u.label}</span>
              <span className="ml-auto shrink-0">{u.days}d</span>
            </div>
          ))}
        </div>
      )}

      {/* Per-form status grid, full width */}
      <div className="mt-3 grid grid-cols-5 gap-1">
        {cells.map((c) => (
          <div
            key={c.key}
            title={`${c.label}${c.date ? ` — ${format(new Date(c.date), "MMM d, yyyy")}` : " — no date on file"}`}
            className={cn("rounded px-0.5 py-1.5 flex flex-col items-center justify-center gap-0.5 text-center", STATUS_SOLID_CLASS[c.status])}
          >
            <span className="text-[8px] font-bold leading-[1.05] line-clamp-2 break-words">{c.label}</span>
            <span className="text-[8.5px] font-medium leading-none opacity-90">{c.days === null ? "—" : `${c.days}d`}</span>
          </div>
        ))}
      </div>

      {/* Footer: next action + audit readiness, side by side so neither wraps */}
      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Next Action</p>
          <p
            className={cn(
              "text-xs font-bold truncate",
              nextDays !== null && nextDays < 0 ? "text-red-600" : "text-neutral-700"
            )}
          >
            {actionText}
          </p>
        </div>
        <div
          title={score.auditReady ? "Audit ready" : "Not audit ready"}
          className={cn(
            "shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide",
            score.auditReady ? "text-emerald-600" : "text-neutral-400"
          )}
        >
          Audit Ready
          {score.auditReady ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
        </div>
      </div>
    </Card>
  );
}
