"use client";

import * as React from "react";
import { Loader2, Download, FileSpreadsheet, Printer } from "lucide-react";
import { useDrivers } from "@/hooks/use-drivers";
import { useUIStore } from "@/store/ui-store";
import { getDueSoonEntries } from "@/lib/compliance";
import { exportDueSoonToXlsx, exportDueSoonToCsv } from "@/lib/export";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ComplianceBadge, DriverStatusBadge } from "@/components/drivers/compliance-badge";

export default function SoonToExpireReportPage() {
  const { data: drivers, isLoading, isError } = useDrivers();
  const openDriver = useUIStore((s) => s.openDriver);
  const [includeInactive, setIncludeInactive] = React.useState(false);
  const [includeTerminated, setIncludeTerminated] = React.useState(false);

  const scoped = React.useMemo(() => {
    if (!drivers) return [];
    return drivers.filter((d) => {
      if (d.status === "ACTIVE") return true;
      if (d.status === "INACTIVE") return includeInactive;
      if (d.status === "TERMINATED") return includeTerminated;
      return true;
    });
  }, [drivers, includeInactive, includeTerminated]);

  const entries = React.useMemo(() => getDueSoonEntries(scoped, 30), [scoped]);
  const expiredCount = entries.filter((e) => e.status === "expired").length;

  return (
    <div className="flex flex-col gap-4 max-w-[1200px] print:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Soon to Expire Report</h1>
          <p className="text-sm text-neutral-500">
            Every compliance form due within 30 days (including any already overdue), most urgent first.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => exportDueSoonToCsv(entries)}>
            <Download className="size-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportDueSoonToXlsx(entries)}>
            <FileSpreadsheet className="size-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm print:hidden">
        <label className="flex items-center gap-1.5 text-neutral-600">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="size-3.5"
          />
          Include inactive drivers
        </label>
        <label className="flex items-center gap-1.5 text-neutral-600">
          <input
            type="checkbox"
            checked={includeTerminated}
            onChange={(e) => setIncludeTerminated(e.target.checked)}
            className="size-3.5"
          />
          Include terminated drivers
        </label>
        <span className="ml-auto text-xs text-neutral-400">
          {entries.length} item{entries.length === 1 ? "" : "s"}
          {expiredCount > 0 ? ` · ${expiredCount} already expired` : ""}
        </span>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-neutral-400 text-sm py-12 justify-center">
          <Loader2 className="size-4 animate-spin" />
          Loading drivers...
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load driver data.
        </div>
      )}

      {drivers && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-neutral-400 py-10">
                      Nothing due within 30 days. All clear.
                    </TableCell>
                  </TableRow>
                )}
                {entries.map((entry) => (
                  <TableRow
                    key={`${entry.driverId}-${entry.formKey}`}
                    className="cursor-pointer"
                    onClick={() => openDriver(entry.driverId)}
                  >
                    <TableCell className="font-medium text-neutral-900">
                      {entry.lastName}, {entry.firstName}
                    </TableCell>
                    <TableCell>
                      <DriverStatusBadge status={entry.driverStatus} />
                    </TableCell>
                    <TableCell className="text-neutral-600">{entry.formLabel}</TableCell>
                    <TableCell className="text-neutral-500">
                      {new Date(entry.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <ComplianceBadge date={entry.date} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
