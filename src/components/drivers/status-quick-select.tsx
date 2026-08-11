"use client";

import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateDriver } from "@/hooks/use-drivers";
import { cn } from "@/lib/utils";
import type { DriverStatusValue } from "@/types/driver";

const STATUS_STYLES: Record<DriverStatusValue, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-amber-50 text-amber-700 border-amber-200",
  TERMINATED: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

const STATUS_LABELS: Record<DriverStatusValue, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  TERMINATED: "Terminated",
};

export function StatusQuickSelect({
  driverId,
  status,
  driverName,
}: {
  driverId: string;
  status: DriverStatusValue;
  driverName: string;
}) {
  const updateDriver = useUpdateDriver();

  function handleChange(next: string) {
    if (next === status) return;
    updateDriver.mutate(
      { id: driverId, driver: { status: next as DriverStatusValue } },
      {
        onSuccess: () => toast.success(`${driverName} is now ${STATUS_LABELS[next as DriverStatusValue]}`),
        onError: () => toast.error("Failed to update status"),
      }
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={status} onValueChange={handleChange}>
        <SelectTrigger
          className={cn(
            "h-7 w-[130px] rounded-full border px-2.5 py-0 text-xs font-medium shadow-none",
            STATUS_STYLES[status]
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
          <SelectItem value="TERMINATED">Terminated</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
