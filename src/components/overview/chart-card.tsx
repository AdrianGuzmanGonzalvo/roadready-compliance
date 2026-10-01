import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_SOLID_CLASS } from "@/components/dashboard-new/scorecard-data";
import { cn } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/compliance";

/** Card with the title/description header every Overview chart shares. */
export function ChartCard({
  title,
  description,
  action,
  className,
  contentClassName,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-neutral-900">{title}</CardTitle>
            {description && <p className="text-xs text-neutral-400">{description}</p>}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

export function LegendItem({ swatchClass, children }: { swatchClass: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
      <span className={cn("size-2.5 shrink-0 rounded-sm", swatchClass)} />
      {children}
    </span>
  );
}

/** Form-status wording used across the Overview charts, most urgent first. */
export const RISK_ORDER: ComplianceStatus[] = ["expired", "expiring_30", "expiring_60", "compliant", "missing"];

export const RISK_LABEL: Record<ComplianceStatus, string> = {
  expired: "Expired",
  expiring_30: "Urgent (≤30d)",
  expiring_60: "Upcoming (31–60d)",
  compliant: "Valid (60d+)",
  missing: "No date on file",
};

export function StatusLegend({ includeMissing = false }: { includeMissing?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {RISK_ORDER.filter((s) => includeMissing || s !== "missing").map((s) => (
        <LegendItem key={s} swatchClass={STATUS_SOLID_CLASS[s]}>
          {RISK_LABEL[s]}
        </LegendItem>
      ))}
    </div>
  );
}
