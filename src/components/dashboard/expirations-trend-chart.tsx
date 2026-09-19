"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getMonthlyExpiryTrend } from "@/lib/compliance";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import type { DriverDTO } from "@/types/driver";

const CHART_HEIGHT = 112;

export function ExpirationsTrendChart({ drivers }: { drivers: DriverDTO[] }) {
  const formFieldDefs = useFormFieldDefs();
  const active = drivers.filter((d) => d.status === "ACTIVE");
  const buckets = getMonthlyExpiryTrend(active, 6, new Date(), formFieldDefs);
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <Card className="rounded-2xl p-6 flex flex-col">
      <div>
        <div className="text-sm font-semibold text-neutral-900">Expirations Trend</div>
        <div className="text-xs text-neutral-400 mt-0.5">Forms coming due, next 6 months</div>
      </div>

      <div className="flex-1 flex items-end gap-5 mt-6" style={{ height: CHART_HEIGHT }}>
        {buckets.map((b, i) => {
          const isCurrent = i === 0;
          const height = b.count === 0 ? 4 : Math.max(8, (b.count / max) * CHART_HEIGHT);
          return (
            <div key={`${b.year}-${b.month}`} className="flex-1 flex flex-col items-center gap-2">
              <span className={cn("text-[11px] font-bold", isCurrent ? "text-indigo-600" : "text-neutral-300")}>
                {b.count}
              </span>
              <div
                className={cn("w-full max-w-9 rounded-lg", isCurrent ? "bg-indigo-600" : "bg-neutral-100")}
                style={{ height }}
              />
              <span className={cn("text-[11px] font-semibold", isCurrent ? "text-neutral-900" : "text-neutral-400")}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
