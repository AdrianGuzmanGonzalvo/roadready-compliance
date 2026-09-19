"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { Users, AlertOctagon, Clock, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { summarizeFormExpiries } from "@/lib/compliance";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import type { DriverDTO } from "@/types/driver";

function Kpi({
  icon: Icon,
  iconClass,
  label,
  value,
  valueClass,
  sub,
  tag,
  tagClass,
  href,
}: {
  icon: ElementType;
  iconClass: string;
  label: string;
  value: number;
  valueClass?: string;
  sub: string;
  tag?: string;
  tagClass?: string;
  href?: string;
}) {
  const card = (
    <Card className={cn("rounded-2xl p-5", href && "transition-shadow hover:shadow-md")}>
      <div className="flex items-center justify-between">
        <div className={cn("flex size-9 items-center justify-center rounded-xl", iconClass)}>
          <Icon className="size-4.5" />
        </div>
        {tag && (
          <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", tagClass)}>{tag}</span>
        )}
      </div>
      <div className="mt-3.5 text-xs font-semibold text-neutral-500">{label}</div>
      <div className={cn("mt-0.5 text-2xl font-extrabold tracking-tight text-neutral-900", valueClass)}>{value}</div>
      <div className="mt-0.5 text-xs font-medium text-neutral-400">{sub}</div>
    </Card>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export function ExecutiveKpiCards({ drivers }: { drivers: DriverDTO[] }) {
  const formFieldDefs = useFormFieldDefs();
  const active = drivers.filter((d) => d.status === "ACTIVE");
  const terminated = drivers.filter((d) => d.status === "TERMINATED");
  const summary = summarizeFormExpiries(active, new Date(), formFieldDefs);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        icon={Users}
        iconClass="bg-indigo-50 text-indigo-600"
        label="Total Drivers"
        value={drivers.length}
        sub={`${active.length} active · ${terminated.length} terminated`}
      />
      <Kpi
        icon={AlertOctagon}
        iconClass="bg-red-50 text-red-600"
        valueClass="text-red-600"
        label="Overdue / Expired"
        value={summary.expired}
        sub="Action required now"
        tag="Now"
        tagClass="bg-red-50 text-red-600"
        href="/reports/soon-to-expire"
      />
      <Kpi
        icon={Clock}
        iconClass="bg-amber-50 text-amber-600"
        label="Expiring in 30 Days"
        value={summary.expiring30}
        sub="Action required soon"
        tag="30 days"
        tagClass="bg-amber-50 text-amber-700"
        href="/reports/soon-to-expire"
      />
      <Kpi
        icon={CalendarClock}
        iconClass="bg-orange-50 text-orange-600"
        label="Expiring in 60 Days"
        value={summary.expiring60}
        sub="Upcoming renewals"
        tag="60 days"
        tagClass="bg-orange-50 text-orange-700"
      />
    </div>
  );
}
