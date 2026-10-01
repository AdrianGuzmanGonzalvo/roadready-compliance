"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartCard } from "@/components/overview/chart-card";
import { RadarChart } from "@/components/overview/radar-chart";
import { getDueSoonEntries, STATUS_CONFIG, type DueSoonEntry } from "@/lib/compliance";
import { pillarCompliance, readinessByGroup } from "@/lib/overview";
import { useUIStore } from "@/store/ui-store";
import { trackEvent } from "@/lib/analytics";
import type { DriverDTO, FormFieldDef } from "@/types/driver";

const ACTION_LIMIT = 7;
const ACTION_WINDOW_DAYS = 30;

function dueText(days: number): string {
  if (days < 0) return `expired ${-days} day${days === -1 ? "" : "s"} ago`;
  if (days === 0) return "expires today";
  return `due in ${days} day${days === 1 ? "" : "s"}`;
}

/** Option 3 — company/roster leaderboard, operational-pillar radar and the most urgent open cases. */
export function MultiCompanyView({
  active,
  formFieldDefs,
  groupBy,
}: {
  active: DriverDTO[];
  formFieldDefs: FormFieldDef[];
  /** Companies when the page is unscoped; the selected company's rosters otherwise. */
  groupBy: "company" | "roster";
}) {
  const openDriver = useUIStore((s) => s.openDriver);

  const leaderboard = useMemo(
    () =>
      groupBy === "company"
        ? readinessByGroup(active, (d) => d.company, "No company", formFieldDefs)
        : readinessByGroup(active, (d) => d.roster, "No roster", formFieldDefs),
    [active, formFieldDefs, groupBy]
  );
  const pillars = useMemo(() => pillarCompliance(active, formFieldDefs), [active, formFieldDefs]);
  const urgent = useMemo(
    () => getDueSoonEntries(active, ACTION_WINDOW_DAYS, new Date(), formFieldDefs),
    [active, formFieldDefs]
  );
  const expiredCount = urgent.filter((e) => e.status === "expired").length;

  function open(entry: DueSoonEntry) {
    trackEvent("driver_opened", { source: "overview_action_center" });
    openDriver(entry.driverId);
  }

  return (
    // Three cards across on wide screens, so the whole view fits without scrolling.
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <ChartCard
        title={groupBy === "company" ? "Company Compliance Leaderboard" : "Roster Compliance Leaderboard"}
        description="Share of each group's active drivers that are audit ready (no expired form)."
      >
        <ol className="space-y-3 pt-1">
          {leaderboard.map((g, i) => (
            <li key={g.name} className="flex items-start gap-3">
              <span className="w-4 shrink-0 pt-px text-right text-xs font-semibold tabular-nums text-neutral-400">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium text-neutral-900" title={g.name}>
                    {g.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-900">{g.pct}%</span>
                </div>
                <div
                  className="mt-1.5 h-2.5 overflow-hidden rounded-r bg-blue-50"
                  title={`${g.name}: ${g.ready} of ${g.drivers} active drivers audit ready`}
                >
                  <div className="h-full rounded-r bg-blue-600" style={{ width: `${g.pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-neutral-400">
                  {g.ready.toLocaleString()} of {g.drivers.toLocaleString()} drivers ready · {g.expired.toLocaleString()} with
                  expired forms
                </p>
              </div>
            </li>
          ))}
        </ol>
      </ChartCard>

      <ChartCard
        title="Operational Pillar Compliance"
        description="Share of active drivers with no expired form in each pillar."
      >
        <RadarChart
          label="Operational pillar compliance"
          axes={pillars.map((p) => ({ key: p.key, label: p.label, value: p.pct }))}
        />
        <ul className="mt-1 divide-y divide-neutral-100 border-t border-neutral-100">
          {pillars.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-3 py-1 text-[11px]">
              <span className="min-w-0 truncate" title={`${p.label}: ${p.forms.join(", ")}`}>
                <span className="font-medium text-neutral-700">{p.label}</span>
                <span className="text-neutral-400"> · {p.forms.join(", ")}</span>
              </span>
              <span className="shrink-0 tabular-nums text-neutral-500">
                {p.pct === null ? "No dates" : `${p.clear.toLocaleString()} / ${p.tracked.toLocaleString()}`}
              </span>
            </li>
          ))}
        </ul>
      </ChartCard>

      <ChartCard
        title="Real-Time Action Center"
        description={
          urgent.length === 0
            ? "From current driver records."
            : `${expiredCount.toLocaleString()} expired · ${(urgent.length - expiredCount).toLocaleString()} due within ${ACTION_WINDOW_DAYS} days. Most urgent first.`
        }
        action={
          <Link
            href="/reports/soon-to-expire"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        }
        className="lg:col-span-2 xl:col-span-1"
        contentClassName="p-0"
      >
        {urgent.length === 0 ? (
          <div className="flex items-center gap-2 px-4 pb-5 pt-2 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" />
            Nothing expired or due in the next {ACTION_WINDOW_DAYS} days.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
            {urgent.slice(0, ACTION_LIMIT).map((entry) => (
              <li key={`${entry.driverId}-${entry.formKey}`}>
                <button
                  type="button"
                  onClick={() => open(entry)}
                  className="flex w-full items-center gap-3 px-4 py-1.5 text-left transition-colors hover:bg-neutral-50"
                >
                  <span className={cn("size-2 shrink-0 rounded-full", STATUS_CONFIG[entry.status].dotClass)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-900">
                      {entry.lastName}, {entry.firstName}
                    </span>
                    {/* The form sits on its own line so the badge never truncates it in a narrow card. */}
                    <span className="block truncate text-xs text-neutral-400">
                      <span className="font-medium text-neutral-600">{entry.formLabel}</span>
                      {" · "}
                      {entry.company ?? "No company"}
                      {entry.roster ? ` / ${entry.roster}` : ""}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
                      STATUS_CONFIG[entry.status].badgeClass
                    )}
                  >
                    {dueText(entry.daysRemaining)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}
