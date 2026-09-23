"use client";

import { format } from "date-fns";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { computeDriverScore, getFormDate, statusForDate, daysRemaining, nextExpiringForm, STATUS_CONFIG } from "@/lib/compliance";
import { useUIStore } from "@/store/ui-store";
import type { FormFieldDef } from "@/types/driver";
import type { DriverDTO } from "@/types/driver";

const RING_COLOR: Record<string, string> = {
  expired: "#ef4444",
  expiring_30: "#f59e0b",
  expiring_60: "#f97316",
  compliant: "#10b981",
  missing: "#9ca3af",
};

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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

  const ringColor = RING_COLOR[score.status];
  const offset = CIRCUMFERENCE - (score.pct / 100) * CIRCUMFERENCE;

  return (
    <Card
      className="rounded-xl p-4 cursor-pointer transition-colors hover:border-neutral-300"
      onClick={() => openDriver(driver.id)}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-neutral-900 text-sm truncate">
          {driver.lastName}, {driver.firstName}
        </h3>
        {score.auditReady ? (
          <span title="Audit ready" className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <CheckCircle2 className="size-3.5" />
          </span>
        ) : (
          <span title="Not audit ready" className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-neutral-400">
            <AlertTriangle className="size-3.5" />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="relative size-16 shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="#F0F0F0" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r={RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-neutral-900">{score.pct}%</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-neutral-500 truncate">{driver.company ?? "—"}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: ringColor }}>
            {STATUS_CONFIG[score.status].label}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1">
        {formFieldDefs.map((f) => {
          const value = getFormDate(driver, f);
          const status = statusForDate(value, now);
          const days = daysRemaining(value, now);
          const config = STATUS_CONFIG[status];
          return (
            <div
              key={f.key}
              title={`${f.label}${value ? ` — ${format(new Date(value), "MMM d, yyyy")}` : " — no date on file"}`}
              className={cn("rounded px-1 py-1 flex flex-col items-center justify-center", config.badgeClass.split(" ")[0])}
            >
              <span className="text-[8.5px] font-semibold text-neutral-700 truncate max-w-full leading-none">
                {f.label.length > 7 ? f.label.slice(0, 6) + "…" : f.label}
              </span>
              <span className="text-[8.5px] font-medium text-neutral-500 leading-none mt-0.5">
                {days === null ? "—" : `${days}d`}
              </span>
            </div>
          );
        })}
      </div>

      <p
        className={cn(
          "mt-3 text-xs font-semibold truncate",
          nextDays !== null && nextDays < 0 ? "text-red-600" : "text-neutral-600"
        )}
      >
        {actionText}
      </p>
    </Card>
  );
}
