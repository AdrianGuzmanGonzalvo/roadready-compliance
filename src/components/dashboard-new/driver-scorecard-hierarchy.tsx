"use client";

import { format } from "date-fns";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/compliance";
import { useUIStore } from "@/store/ui-store";
import {
  buildScorecardData,
  STATUS_TEXT_COLOR,
  STATUS_SOFT_CLASS,
  RING_BLUE,
  initials,
} from "@/components/dashboard-new/scorecard-data";
import type { FormFieldDef, DriverDTO } from "@/types/driver";

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** View 2 — "Hierarchical Clarity": avatar header, status ribbon, next action, soft-pill audit grid. */
export function DriverScorecardHierarchy({ driver, formFieldDefs }: { driver: DriverDTO; formFieldDefs: FormFieldDef[] }) {
  const openDriver = useUIStore((s) => s.openDriver);
  const { score, actionText, nextDays, urgent, cells } = buildScorecardData(driver, formFieldDefs);
  const offset = CIRCUMFERENCE - (score.pct / 100) * CIRCUMFERENCE;

  return (
    <Card
      className="rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md hover:border-neutral-300"
      onClick={() => openDriver(driver.id)}
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100">
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

      <div className="mt-3 flex items-center gap-3">
        <div className="relative size-12 shrink-0">
          <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
            <circle cx="24" cy="24" r={RADIUS} fill="none" stroke="#E5EDFF" strokeWidth="5" />
            <circle
              cx="24"
              cy="24"
              r={RADIUS}
              fill="none"
              stroke={RING_BLUE}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-neutral-900">
            {score.pct}%
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Compliance Score</p>
          <p className={cn("text-sm font-bold", STATUS_TEXT_COLOR[score.status])}>{STATUS_CONFIG[score.status].label}</p>
        </div>
      </div>

      <div className={cn("mt-3 rounded-md py-1.5 text-center text-[11px] font-bold uppercase tracking-wide", STATUS_SOFT_CLASS[score.status])}>
        {STATUS_CONFIG[score.status].label}
      </div>

      {urgent[0] && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold",
            urgent[0].days < 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
          )}
        >
          <AlertTriangle className="size-3.5 shrink-0" />
          <span className="truncate">
            {urgent[0].days < 0 ? `${urgent[0].label} is overdue` : `${urgent[0].label} needs renewal`}
          </span>
          <span className="ml-auto shrink-0">{urgent[0].days}d</span>
        </div>
      )}

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Next Action</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className={cn("text-xs font-bold truncate", nextDays !== null && nextDays < 0 ? "text-red-600" : "text-neutral-700")}>
            • {actionText}
          </p>
          <CalendarClock className="size-4 text-neutral-300 shrink-0" />
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Audit Readiness</p>
        <div className="mt-1.5 grid grid-cols-5 gap-1">
          {cells.map((c) => (
            <div
              key={c.key}
              title={`${c.label}${c.date ? ` — ${format(new Date(c.date), "MMM d, yyyy")}` : " — no date on file"}`}
              className={cn("rounded-lg px-0.5 py-1.5 flex flex-col items-center justify-center gap-0.5 text-center", STATUS_SOFT_CLASS[c.status])}
            >
              <span className="text-[8px] font-bold leading-[1.05] line-clamp-2 break-words">{c.label}</span>
              <span className="text-[8.5px] font-medium leading-none opacity-80">{c.days === null ? "—" : `${c.days}d`}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
