"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ComplianceBadge } from "@/components/drivers/compliance-badge";
import { useUIStore } from "@/store/ui-store";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import type { DriverDTO } from "@/types/driver";

export function ExpirationMatrix({ drivers }: { drivers: DriverDTO[] }) {
  const openDriver = useUIStore((s) => s.openDriver);
  const formFieldDefs = useFormFieldDefs();
  const active = drivers.filter((d) => d.status === "ACTIVE");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-neutral-900">Expiration Matrix — Active Drivers</CardTitle>
        <p className="text-xs text-neutral-400">Click a row to view or update a driver&apos;s compliance dates.</p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-white">Driver</TableHead>
              {formFieldDefs.map((f) => (
                <TableHead key={f.key} title={f.description}>
                  {f.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.length === 0 && (
              <TableRow>
                <TableCell colSpan={formFieldDefs.length + 1} className="text-center text-neutral-400 py-8">
                  No active drivers yet. Upload an Excel file to get started.
                </TableCell>
              </TableRow>
            )}
            {active.map((driver) => (
              <TableRow
                key={driver.id}
                className="cursor-pointer"
                onClick={() => openDriver(driver.id)}
              >
                <TableCell className="sticky left-0 bg-white font-medium text-neutral-900">
                  {driver.lastName}, {driver.firstName}
                </TableCell>
                {formFieldDefs.map((f) => (
                  <TableCell key={f.key}>
                    <ComplianceBadge date={driver.complianceForm?.[f.key] ?? null} compact />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
