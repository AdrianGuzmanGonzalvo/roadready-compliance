"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ComplianceBadge, DriverStatusBadge } from "@/components/drivers/compliance-badge";
import { useUIStore } from "@/store/ui-store";
import { nextExpiringForm } from "@/lib/compliance";
import type { DriverDTO } from "@/types/driver";

export function DriverTable({ drivers }: { drivers: DriverDTO[] }) {
  const openDriver = useUIStore((s) => s.openDriver);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Driver</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>License #</TableHead>
          <TableHead>Next Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drivers.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-neutral-400 py-10">
              No drivers match the current filters.
            </TableCell>
          </TableRow>
        )}
        {drivers.map((driver) => {
          const next = nextExpiringForm(driver.complianceForm);
          return (
            <TableRow key={driver.id} className="cursor-pointer" onClick={() => openDriver(driver.id)}>
              <TableCell className="font-medium text-neutral-900">
                {driver.lastName}, {driver.firstName}
              </TableCell>
              <TableCell>
                <DriverStatusBadge status={driver.status} />
              </TableCell>
              <TableCell className="text-neutral-500">{driver.position ?? "—"}</TableCell>
              <TableCell className="text-neutral-500">{driver.phone ?? "—"}</TableCell>
              <TableCell className="text-neutral-500">{driver.driversLicense ?? "—"}</TableCell>
              <TableCell>
                {next ? (
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">{next.label}</span>
                    <ComplianceBadge date={next.date} />
                  </span>
                ) : (
                  <span className="text-xs text-neutral-400">No data</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
