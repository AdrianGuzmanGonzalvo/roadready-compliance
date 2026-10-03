"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STATUS_SOLID_CLASS } from "@/components/dashboard-new/scorecard-data";
import { ChartCard, RISK_LABEL, StatusLegend } from "@/components/overview/chart-card";
import { SegmentedRing, STATUS_STROKE_CLASS } from "@/components/overview/segmented-ring";
import { summarizeFormExpiries, type ComplianceStatus } from "@/lib/compliance";
import { fleetReadiness, formBreakdowns, percent } from "@/lib/overview";
import { useUIStore } from "@/store/ui-store";
import type { DriverDTO, FormFieldDef } from "@/types/driver";

const READY_GROUP: { status: ComplianceStatus; label: string }[] = [
  { status: "expiring_30", label: "Have a form due within 30 days" },
  { status: "expiring_60", label: "Have a form due in 31–60 days" },
  { status: "compliant", label: "All forms valid for 60+ days" },
];

/** Counts spelled out under each form's ring; "no date" only shows when there are any. */
const FORM_STATS: { status: ComplianceStatus; label: string }[] = [
  { status: "expired", label: "expired" },
  { status: "expiring_30", label: "due ≤30d" },
  { status: "missing", label: "no date" },
];

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

/** Option 1 — fleet readiness donut, per-form progress rings and the expired-drivers alert. */
export function GlobalHealthView({ active, formFieldDefs }: { active: DriverDTO[]; formFieldDefs: FormFieldDef[] }) {
  const setKpiStatusFilter = useUIStore((s) => s.setKpiStatusFilter);
  const readiness = useMemo(() => fleetReadiness(active, formFieldDefs), [active, formFieldDefs]);
  const forms = useMemo(() => formBreakdowns(active, formFieldDefs), [active, formFieldDefs]);
  const expiredForms = useMemo(() => summarizeFormExpiries(active, new Date(), formFieldDefs).expired, [active, formFieldDefs]);

  const split = [
    { key: "ready", label: "Audit ready", count: readiness.ready, swatch: "bg-emerald-500", stroke: "stroke-emerald-500" },
    { key: "expired", label: "Non-compliant / expired", count: readiness.expired, swatch: "bg-red-500", stroke: "stroke-red-500" },
    { key: "none", label: "No records on file", count: readiness.noRecords, swatch: "bg-neutral-300", stroke: "stroke-neutral-300" },
  ].filter((s) => s.key !== "none" || s.count > 0);

  const hasExpired = readiness.expired > 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ChartCard
        title="Fleet Audit Readiness Score"
        description="Active drivers with records on file and no expired form."
        className="lg:col-span-2"
      >
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
          <SegmentedRing
            size={148}
            thickness={18}
            label={`${readiness.pct}% of active drivers are audit ready`}
            segments={split.map((s) => ({ key: s.key, value: s.count, strokeClass: s.stroke }))}
          >
            <span className="text-4xl font-semibold text-neutral-900">{readiness.pct}%</span>
            <span className="text-[11px] font-medium text-neutral-500">Audit ready</span>
          </SegmentedRing>

          <div className="w-full min-w-0 flex-1">
            <ul className="space-y-1.5">
              {split.map((s) => (
                <li key={s.key} className="flex items-center gap-2.5 text-sm">
                  <span className={cn("size-2.5 shrink-0 rounded-sm", s.swatch)} />
                  <span className="min-w-0 flex-1 truncate text-neutral-700">{s.label}</span>
                  <span className="shrink-0 text-neutral-400">{plural(s.count, "driver")}</span>
                  <span className="w-10 shrink-0 text-right font-semibold tabular-nums text-neutral-900">
                    {percent(s.count, readiness.drivers)}%
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 border-t border-neutral-100 pt-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Inside the audit-ready group</p>
              <ul className="mt-1.5 space-y-1">
                {READY_GROUP.map((g) => (
                  <li key={g.status} className="flex items-center gap-2.5 text-xs">
                    <span className={cn("size-2 shrink-0 rounded-full", STATUS_SOLID_CLASS[g.status])} />
                    <span className="min-w-0 flex-1 truncate text-neutral-500">{g.label}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-neutral-700">
                      {readiness.byStatus[g.status].toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </ChartCard>

      <Card
        className={cn(
          "flex flex-col justify-between gap-3 p-4",
          hasExpired ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"
        )}
      >
        {hasExpired ? (
          <>
            <div>
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Action required now</span>
              </div>
              <p className="mt-2 text-3xl font-semibold text-red-700">{readiness.expired.toLocaleString()}</p>
              <p className="mt-1 text-sm font-semibold text-red-900">
                Active Driver{readiness.expired === 1 ? "" : "s"} with Expired Forms
              </p>
              <p className="mt-1 text-xs text-red-700">
                {plural(expiredForms, "expired form")} across {plural(readiness.drivers, "active driver")}.
              </p>
            </div>
            <Button asChild variant="destructive" size="sm" className="self-start">
              <Link href="/dashboard-new" onClick={() => setKpiStatusFilter("expired")}>
                Review drivers
                <ArrowRight />
              </Link>
            </Button>
          </>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">All clear</span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">0</p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">Active Drivers with Expired Forms</p>
          </div>
        )}
      </Card>

      <ChartCard
        title="Form Status Breakdown"
        description="Share of each Article 19-A form on file that is not expired today."
        action={<StatusLegend />}
        className="lg:col-span-3"
      >
        {/* Two rows of five on wide screens: one row made the rings too small to read comfortably. */}
        <div className="grid grid-cols-2 gap-3 pt-1 lg:grid-cols-5">
          {forms.map((f) => (
            <div
              key={f.key}
              className="flex min-w-0 flex-col items-center rounded-lg border border-neutral-200 px-2 py-4 text-center"
            >
              <SegmentedRing
                size={144}
                thickness={15}
                className="w-full max-w-36"
                label={
                  f.validPct === null
                    ? `${f.label}: no dates on file`
                    : `${f.label}: ${f.validPct}% not expired, ${f.counts.expired} expired, ${f.counts.expiring_30} due within 30 days`
                }
                segments={(["compliant", "expiring_60", "expiring_30", "expired"] as const).map((s) => ({
                  key: s,
                  value: f.counts[s],
                  strokeClass: STATUS_STROKE_CLASS[s],
                  title: `${f.label} — ${RISK_LABEL[s]}: ${f.counts[s]}`,
                }))}
              >
                <span className="text-2xl font-bold text-neutral-900 xl:text-3xl">
                  {f.validPct === null ? "—" : `${f.validPct}%`}
                </span>
              </SegmentedRing>
              <p className="mt-3 max-w-full truncate text-base font-semibold text-neutral-900" title={f.description}>
                {f.label}
              </p>
              {f.onFile > 0 ? (
                <ul className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-sm text-neutral-500">
                  {FORM_STATS.filter((s) => s.status !== "missing" || f.counts.missing > 0).map((s) => (
                    <li key={s.status} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <span className={cn("size-2 shrink-0 rounded-full", STATUS_SOLID_CLASS[s.status])} />
                      <span>
                        <span className="font-semibold tabular-nums text-neutral-900">
                          {f.counts[s.status].toLocaleString()}
                        </span>{" "}
                        {s.label}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-neutral-400">No dates on file</p>
              )}
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
