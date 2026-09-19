"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { summarizeDriverStatuses } from "@/lib/compliance";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import type { DriverDTO } from "@/types/driver";

const RADIUS = 33;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ComplianceHealthBanner({ drivers }: { drivers: DriverDTO[] }) {
  const formFieldDefs = useFormFieldDefs();
  const active = drivers.filter((d) => d.status === "ACTIVE");
  const summary = summarizeDriverStatuses(active, new Date(), formFieldDefs);

  const tracked = summary.total - summary.missing;
  const pct = tracked > 0 ? Math.round((summary.compliant / tracked) * 100) : 0;
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  const segments = [
    { label: "Compliant", count: summary.compliant, color: "bg-emerald-500" },
    { label: "60 days", count: summary.expiring60, color: "bg-orange-500" },
    { label: "30 days", count: summary.expiring30, color: "bg-amber-500" },
    { label: "Expired", count: summary.expired, color: "bg-red-500" },
  ];

  return (
    <Card className="rounded-2xl p-5 flex items-center gap-7">
      <div className="relative size-[78px] shrink-0">
        <svg width="78" height="78" viewBox="0 0 78 78" className="-rotate-90">
          <circle cx="39" cy="39" r={RADIUS} fill="none" stroke="#F0F0F5" strokeWidth="9" />
          <circle
            cx="39"
            cy="39"
            r={RADIUS}
            fill="none"
            stroke="#4F46E5"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-neutral-900">{pct}%</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-4">
          <div className="text-sm font-semibold text-neutral-900">Fleet Compliance Health</div>
          <Link href="/calendar" className="text-xs font-semibold text-indigo-600 hover:underline shrink-0">
            View expiration matrix →
          </Link>
        </div>

        <div className="mt-3 h-2.5 rounded-full overflow-hidden flex bg-neutral-100">
          {segments.map((s) =>
            s.count > 0 ? (
              <div
                key={s.label}
                className={s.color}
                style={{ width: `${tracked > 0 ? (s.count / tracked) * 100 : 0}%` }}
              />
            ) : null
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-600">
          {segments.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-sm ${s.color}`} />
              {s.label} <b className="text-neutral-900">{s.count}</b>
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
