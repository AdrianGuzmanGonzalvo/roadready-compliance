"use client";

import { useMemo, type ElementType } from "react";
import { Users, AlertOctagon, Clock, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STATUS_SOLID_CLASS } from "@/components/dashboard-new/scorecard-data";
import { ChartCard, StatusLegend, RISK_LABEL, RISK_ORDER } from "@/components/overview/chart-card";
import { AreaChart } from "@/components/overview/area-chart";
import { STATUS_CONFIG, summarizeFormExpiries, type ComplianceStatus } from "@/lib/compliance";
import { expirationTimeline, formBreakdowns, percent } from "@/lib/overview";
import type { DriverDTO, FormFieldDef } from "@/types/driver";

/** A count only goes inside its segment when the segment is wide enough to hold it. */
const MIN_LABEL_SHARE = 0.1;

function RiskKpi({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  risk,
}: {
  icon: ElementType;
  label: string;
  value: number;
  sub?: string;
  accent: string;
  risk?: { label: string; status: ComplianceStatus };
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-neutral-500 sm:text-sm">{label}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <p className="text-2xl font-semibold text-neutral-900">{value.toLocaleString()}</p>
            {risk ? (
              <span
                className={cn(
                  "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  STATUS_CONFIG[risk.status].badgeClass
                )}
              >
                {risk.label}
              </span>
            ) : (
              sub && <p className="text-xs text-neutral-400">{sub}</p>
            )}
          </div>
        </div>
        {/* The icon is dropped on phones so two cards fit side by side. */}
        <div className={cn("hidden size-9 shrink-0 items-center justify-center rounded-lg sm:flex", accent)}>
          <Icon className="size-4.5" />
        </div>
      </CardContent>
    </Card>
  );
}

/** Option 2 — risk KPIs, per-document stacked status bars and the month-by-month expiration curve. */
export function RiskTimelineView({
  drivers,
  active,
  formFieldDefs,
}: {
  drivers: DriverDTO[];
  active: DriverDTO[];
  formFieldDefs: FormFieldDef[];
}) {
  const summary = useMemo(() => summarizeFormExpiries(active, new Date(), formFieldDefs), [active, formFieldDefs]);
  const forms = useMemo(() => formBreakdowns(active, formFieldDefs), [active, formFieldDefs]);
  const timeline = useMemo(() => expirationTimeline(active, formFieldDefs), [active, formFieldDefs]);

  const terminated = drivers.filter((d) => d.status === "TERMINATED").length;
  const anyMissing = forms.some((f) => f.counts.missing > 0);
  const lastBucket = timeline.buckets[timeline.buckets.length - 1];

  const points = timeline.buckets.map((b, i) => ({
    key: b.key,
    label: b.month,
    sublabel: i === 0 || b.month === "Jan" ? b.year : undefined,
    title: `${b.month} ${b.year}`,
    value: b.count,
    detail: b.overdue > 0 ? `${b.overdue.toLocaleString()} already overdue` : undefined,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <RiskKpi
          icon={Users}
          label="Total Drivers"
          value={drivers.length}
          sub={`${active.length} active · ${terminated} terminated`}
          accent="bg-neutral-100 text-neutral-700"
        />
        <RiskKpi
          icon={AlertOctagon}
          label="Overdue / Expired Forms"
          value={summary.expired}
          accent="bg-red-50 text-red-600"
          risk={{ label: "High risk", status: "expired" }}
        />
        <RiskKpi
          icon={Clock}
          label="Expiring in 30 Days"
          value={summary.expiring30}
          accent="bg-amber-50 text-amber-600"
          risk={{ label: "Medium risk", status: "expiring_30" }}
        />
        <RiskKpi
          icon={CalendarClock}
          label="Expiring in 60 Days"
          value={summary.expiring60}
          accent="bg-orange-50 text-orange-600"
          risk={{ label: "Low risk", status: "expiring_60" }}
        />
      </div>

      {/* Matrix and timeline sit side by side on wide screens, so the whole view fits without scrolling. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Risk Matrix by Document"
          description="Active drivers by the status of each Article 19-A form."
          action={<StatusLegend includeMissing={anyMissing} />}
        >
          <div className="space-y-1.5 pt-1">
            {forms.map((f) => (
              <div key={f.key} className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
                <span className="truncate text-xs font-medium text-neutral-700" title={f.description}>
                  {f.label}
                </span>
                <div className="flex h-4 gap-0.5" aria-hidden>
                  {RISK_ORDER.filter((s) => f.counts[s] > 0).map((s) => {
                    const share = f.counts[s] / active.length;
                    return (
                      <div
                        key={s}
                        title={`${f.label} — ${RISK_LABEL[s]}: ${f.counts[s]} (${percent(f.counts[s], active.length)}%)`}
                        className={cn(
                          "flex min-w-1.5 basis-0 items-center justify-center text-[10px] font-semibold first:rounded-l last:rounded-r",
                          STATUS_SOLID_CLASS[s]
                        )}
                        style={{ flexGrow: f.counts[s] }}
                      >
                        {share >= MIN_LABEL_SHARE && f.counts[s]}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* sr-only goes on a wrapper: a table ignores the 1px width and would widen the page. */}
          <div className="sr-only">
            <table>
              <caption>Active drivers by form and status</caption>
              <thead>
                <tr>
                  <th scope="col">Form</th>
                  {RISK_ORDER.map((s) => (
                    <th key={s} scope="col">
                      {RISK_LABEL[s]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forms.map((f) => (
                  <tr key={f.key}>
                    <th scope="row">{f.label}</th>
                    {RISK_ORDER.map((s) => (
                      <td key={s}>{f.counts[s]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard
          title="Critical Expirations Over Time"
          description={
            `Forms coming due each month for active drivers, next ${timeline.buckets.length} months.` +
            (timeline.later > 0
              ? ` ${timeline.later.toLocaleString()} more come due after ${lastBucket.month} ${lastBucket.year}.`
              : "")
          }
          action={
            timeline.overdueEarlier > 0 && (
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_CONFIG.expired.badgeClass)}>
                {timeline.overdueEarlier.toLocaleString()} overdue before {timeline.buckets[0].month}
              </span>
            )
          }
        >
          <AreaChart points={points} unit="forms due" caption="Forms coming due per month" />
        </ChartCard>
      </div>
    </div>
  );
}
