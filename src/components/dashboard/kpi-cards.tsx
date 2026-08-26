"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { Users, AlertOctagon, Clock, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { summarizeFormExpiries } from "@/lib/compliance";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import type { DriverDTO } from "@/types/driver";

interface KpiCardsProps {
  drivers: DriverDTO[];
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  href,
}: {
  icon: ElementType;
  label: string;
  value: number;
  sub?: string;
  accent: string;
  href?: string;
}) {
  const card = (
    <Card className={href ? "transition-colors hover:border-neutral-300" : undefined}>
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-neutral-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>}
        </div>
        <div className={cn("flex size-9 items-center justify-center rounded-lg", accent)}>
          <Icon className="size-4.5" />
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export function KpiCards({ drivers }: KpiCardsProps) {
  const formFieldDefs = useFormFieldDefs();
  const active = drivers.filter((d) => d.status === "ACTIVE");
  const terminated = drivers.filter((d) => d.status === "TERMINATED");
  const summary = summarizeFormExpiries(active, new Date(), formFieldDefs);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        icon={Users}
        label="Total Drivers"
        value={drivers.length}
        sub={`${active.length} active · ${terminated.length} terminated`}
        accent="bg-neutral-100 text-neutral-700"
      />
      <Kpi
        icon={AlertOctagon}
        label="Overdue / Expired Forms"
        value={summary.expired}
        sub="Action required now"
        accent="bg-red-50 text-red-600"
        href="/reports/soon-to-expire"
      />
      <Kpi
        icon={Clock}
        label="Expiring in 30 Days"
        value={summary.expiring30}
        sub="Action required soon"
        accent="bg-amber-50 text-amber-600"
        href="/reports/soon-to-expire"
      />
      <Kpi
        icon={CalendarClock}
        label="Expiring in 60 Days"
        value={summary.expiring60}
        sub="Upcoming"
        accent="bg-orange-50 text-orange-600"
      />
    </div>
  );
}
