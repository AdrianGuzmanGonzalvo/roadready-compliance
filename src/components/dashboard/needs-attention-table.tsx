"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getMostUrgentPerDriver, STATUS_CONFIG } from "@/lib/compliance";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import { useUIStore } from "@/store/ui-store";
import type { DriverDTO } from "@/types/driver";

const AVATAR_CLASS: Record<string, string> = {
  expired: "bg-red-50 text-red-700",
  expiring_30: "bg-amber-50 text-amber-700",
  expiring_60: "bg-orange-50 text-orange-700",
  compliant: "bg-emerald-50 text-emerald-700",
  missing: "bg-neutral-100 text-neutral-500",
};

function initials(lastName: string, firstName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function NeedsAttentionTable({ drivers }: { drivers: DriverDTO[] }) {
  const formFieldDefs = useFormFieldDefs();
  const openDriver = useUIStore((s) => s.openDriver);
  const active = drivers.filter((d) => d.status === "ACTIVE");
  const entries = getMostUrgentPerDriver(active, new Date(), formFieldDefs, 5);

  return (
    <Card className="rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <div>
          <div className="text-sm font-semibold text-neutral-900">Needs Attention</div>
          <div className="text-xs text-neutral-400 mt-0.5">Active drivers closest to a compliance gap.</div>
        </div>
        <Link href="/calendar" className="text-xs font-semibold text-indigo-600 hover:underline shrink-0">
          View expiration matrix →
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-neutral-400 text-sm py-10">Every active driver is fully compliant.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Form Due</TableHead>
              <TableHead>Days Left</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => {
              const config = STATUS_CONFIG[e.status];
              return (
                <TableRow key={e.driverId} className="cursor-pointer" onClick={() => openDriver(e.driverId)}>
                  <TableCell className="font-medium text-neutral-900">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", AVATAR_CLASS[e.status])}>
                        {initials(e.lastName, e.firstName)}
                      </span>
                      {e.lastName}, {e.firstName}
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-500">{e.company ?? "—"}</TableCell>
                  <TableCell className="text-neutral-500">{e.formLabel}</TableCell>
                  <TableCell className={cn("font-semibold", e.daysRemaining < 0 ? "text-red-600" : "text-neutral-700")}>
                    {e.daysRemaining < 0 ? `${Math.abs(e.daysRemaining)} days overdue` : `${e.daysRemaining} days`}
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", config.badgeClass)}>
                      {config.label}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
