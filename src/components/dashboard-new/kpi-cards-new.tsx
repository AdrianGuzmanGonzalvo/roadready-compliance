"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { Users, AlertOctagon, Clock, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { summarizeFormExpiries, bucketExpiringCounts } from "@/lib/compliance";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import { Sparkline } from "@/components/dashboard-new/sparkline";
import type { DriverDTO } from "@/types/driver";

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  sparkCounts,
  sparkColor,
  sparkLabel,
  href,
}: {
  icon: ElementType;
  label: string;
  value: number;
  sub?: string;
  accent: string;
  sparkCounts: number[];
  sparkColor: string;
  sparkLabel: string;
  href?: string;
}) {
  const card = (
    <Card className={cn("rounded-xl", href && "transition-colors hover:border-neutral-300")}>
      <div className="p-5 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-neutral-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>}
        </div>
        <div className={cn("flex size-9 items-center justify-center rounded-lg shrink-0", accent)}>
          <Icon className="size-4.5" />
        </div>
      </div>
      <div className="flex items-end justify-between px-5 pb-4 -mt-1">
        <span className="text-[10px] font-medium text-neutral-400">{sparkLabel}</span>
        <Sparkline counts={sparkCounts} colorClass={sparkColor} />
      </div>
    </Card>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export function KpiCardsNew({ drivers }: { drivers: DriverDTO[] }) {
  const formFieldDefs = useFormFieldDefs();
  const active = drivers.filter((d) => d.status === "ACTIVE");
  const terminated = drivers.filter((d) => d.status === "TERMINATED");
  const now = new Date();
  const summary = summarizeFormExpiries(active, now, formFieldDefs);

  // Real, derivable trends — not invented history: how overdue expired forms
  // are (past 8 weeks) and how upcoming ones cluster (next N weeks).
  const expiredTrend = bucketExpiringCounts(active, now, formFieldDefs, -56, 0, 8);
  const expiring30Trend = bucketExpiringCounts(active, now, formFieldDefs, 0, 30, 5);
  const expiring60Trend = bucketExpiringCounts(active, now, formFieldDefs, 0, 60, 6);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        icon={Users}
        label="Total Drivers"
        value={drivers.length}
        sub={`${active.length} active · ${terminated.length} terminated`}
        accent="bg-blue-600 text-white"
        sparkCounts={[active.length, terminated.length]}
        sparkColor="stroke-blue-400"
        sparkLabel="Active vs. terminated"
      />
      <Kpi
        icon={AlertOctagon}
        label="Overdue / Expired Forms"
        value={summary.expired}
        sub="Action required now"
        accent="bg-red-500 text-white"
        sparkCounts={expiredTrend}
        sparkColor="stroke-red-400"
        sparkLabel="Last 8 weeks"
        href="/reports/soon-to-expire"
      />
      <Kpi
        icon={Clock}
        label="Expiring in 30 Days"
        value={summary.expiring30}
        sub="Action required soon"
        accent="bg-amber-400 text-amber-950"
        sparkCounts={expiring30Trend}
        sparkColor="stroke-amber-400"
        sparkLabel="Next 5 weeks"
        href="/reports/soon-to-expire"
      />
      <Kpi
        icon={CalendarClock}
        label="Expiring in 60 Days"
        value={summary.expiring60}
        sub="Upcoming"
        accent="bg-orange-500 text-white"
        sparkCounts={expiring60Trend}
        sparkColor="stroke-orange-400"
        sparkLabel="Next 8 weeks"
      />
    </div>
  );
}
