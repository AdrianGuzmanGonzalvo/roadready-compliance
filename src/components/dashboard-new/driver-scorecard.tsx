"use client";

import { format } from "date-fns";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { computeDriverScore, getFormDate, statusForDate, daysRemaining, nextExpiringForm, STATUS_CONFIG } from "@/lib/compliance";
import { useUIStore } from "@/store/ui-store";
import type { FormFieldDef, DriverDTO } from "@/types/driver";

const RING_BLUE = "#2563EB";
const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const STATUS_TEXT_COLOR: Record<string, string> = {
  expired: "text-red-600",
  expiring_30: "text-amber-600",
  expiring_60: "text-orange-600",
  compliant: "text-emerald-600",
  missing: "text-neutral-500",
};

/** Saturated fill for the per-form grid cells — reuses STATUS_CONFIG's dot color as the background. */
const CELL_CLASS: Record<string, string> = {
  expired: "bg-red-500 text-white",
  expiring_30: "bg-amber-400 text-amber-950",
  expiring_60: "bg-orange-500 text-white",
  compliant: "bg-emerald-500 text-white",
  missing: "bg-neutral-200 text-neutral-600",
};

export function DriverScorecard({ driver, formFieldDefs }: { driver: DriverDTO; formFieldDefs: FormFieldDef[] }) {
  const openDriver = useUIStore((s) => s.openDriver);
  const now = new Date();
  const score = computeDriverScore(driver, now, formFieldDefs);
  const next = nextExpiringForm(driver, formFieldDefs);
  const nextDays = next ? daysRemaining(next.date, now) : null;
  const expiredCount = formFieldDefs.filter((f) => statusForDate(getFormDate(driver, f), now) === "expired").length;

  let actionText: string;
  if (!next || nextDays === null) {
    actionText = "No records on file";
  } else if (nextDays < 0) {
    actionText = expiredCount > 1 ? `URGENT: ${expiredCount} forms overdue` : `Renew ${next.label} now`;
  } else {
    actionText = `Renew ${next.label} in ${nextDays}d`;
  }

  const offset = CIRCUMFERENCE - (score.pct / 100) * CIRCUMFERENCE;
  const StatusIcon = score.status === "compliant" || score.status === "expiring_60" ? CheckCircle2 : AlertTriangle;

  // The driver's own most urgent forms (expired or due within 30 days), for the alert strip.
  const urgent = formFieldDefs
    .map((f) => {
      const value = getFormDate(driver, f);
      const days = daysRemaining(value, now);
      return { label: f.label, days };
    })
    .filter((f): f is { label: string; days: number } => f.days !== null && f.days <= 30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 2);

  return (
    <Card
      className="rounded-xl p-4 cursor-pointer transition-colors hover:border-neutral-300"
      onClick={() => openDriver(driver.id)}
    >
      <h3 className="font-semibold text-neutral-900 text-sm truncate">
        {driver.lastName}, {driver.firstName}
      </h3>
      <p className="text-xs text-neutral-400 truncate">{driver.company ?? "—"}</p>

      <div className="mt-3 grid grid-cols-[auto_1fr] gap-4">
        {/* Left: blue ring + status + next action + audit readiness */}
        <div className="flex flex-col items-center w-24 text-center">
          <div className="relative size-24">
            <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
              <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="#E5EDFF" strokeWidth="8" />
              <circle
                cx="48"
                cy="48"
                r={RADIUS}
                fill="none"
                stroke={RING_BLUE}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <StatusIcon className={cn("size-4", STATUS_TEXT_COLOR[score.status])} />
              <span className="text-lg font-bold text-neutral-900 leading-none">{score.pct}%</span>
            </div>
          </div>
          <p className={cn("mt-1.5 text-[11px] font-bold uppercase tracking-wide", STATUS_TEXT_COLOR[score.status])}>
            {STATUS_CONFIG[score.status].label}
          </p>

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Next Action</p>
          <p className={cn("text-xs font-bold", nextDays !== null && nextDays < 0 ? "text-red-600" : "text-neutral-700")}>
            {actionText}
          </p>

          <div
            title={score.auditReady ? "Audit ready" : "Not audit ready"}
            className={cn(
              "mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide",
              score.auditReady ? "text-emerald-600" : "text-neutral-400"
            )}
          >
            Audit Readiness
            {score.auditReady ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
          </div>
        </div>

        {/* Right: urgent alerts + full form grid */}
        <div className="min-w-0 flex flex-col gap-2">
          {urgent.map((u) => (
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

          <div className="grid grid-cols-5 gap-1 mt-auto">
            {formFieldDefs.map((f) => {
              const value = getFormDate(driver, f);
              const status = statusForDate(value, now);
              const days = daysRemaining(value, now);
              return (
                <div
                  key={f.key}
                  title={`${f.label}${value ? ` — ${format(new Date(value), "MMM d, yyyy")}` : " — no date on file"}`}
                  className={cn("rounded px-1 py-1.5 flex flex-col items-center justify-center", CELL_CLASS[status])}
                >
                  <span className="text-[8.5px] font-bold truncate max-w-full leading-none">
                    {f.label.length > 7 ? f.label.slice(0, 6) + "…" : f.label}
                  </span>
                  <span className="text-[8.5px] font-medium leading-none mt-0.5 opacity-90">
                    {days === null ? "—" : `${days}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
