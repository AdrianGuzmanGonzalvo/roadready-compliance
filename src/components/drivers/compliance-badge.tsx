import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { daysRemaining, statusForDate, STATUS_CONFIG } from "@/lib/compliance";

export function ComplianceBadge({ date, compact = false }: { date: string | null; compact?: boolean }) {
  const status = statusForDate(date);
  const config = STATUS_CONFIG[status];
  const days = daysRemaining(date);

  if (!date) {
    return (
      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs", config.badgeClass)}>
        —
      </span>
    );
  }

  return (
    <span
      title={format(new Date(date), "MMM d, yyyy")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        config.badgeClass
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {compact ? (days !== null ? `${days}d` : "—") : `${format(new Date(date), "MM/dd/yy")}${days !== null ? ` (${days}d)` : ""}`}
    </span>
  );
}

export function DriverStatusBadge({ status }: { status: "ACTIVE" | "TERMINATED" | "OUT_OF_WORK" }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    TERMINATED: "bg-neutral-100 text-neutral-500 border-neutral-200",
    OUT_OF_WORK: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const labels: Record<string, string> = {
    ACTIVE: "Active",
    TERMINATED: "Terminated",
    OUT_OF_WORK: "Out of Work",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}
