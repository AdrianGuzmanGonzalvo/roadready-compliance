"use client";

import * as React from "react";
import { Loader2, Download, FileSpreadsheet, Printer, Search, X } from "lucide-react";
import { useDrivers } from "@/hooks/use-drivers";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import { useUIStore } from "@/store/ui-store";
import { getDueSoonEntries } from "@/lib/compliance";
import { exportDueSoonToXlsx, exportDueSoonToCsv } from "@/lib/export";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ComplianceBadge, DriverStatusBadge } from "@/components/drivers/compliance-badge";
import { filterByCompanyRoster } from "@/lib/scope";
import type { DriverStatusValue } from "@/types/driver";

const STATUS_OPTIONS: DriverStatusValue[] = ["ACTIVE", "INACTIVE", "TERMINATED"];
const WIDE_WINDOW_DAYS = 3650; // fetch a broad window; days-remaining filters narrow it below

export default function SoonToExpireReportPage() {
  const { data: drivers, isLoading, isError } = useDrivers();
  const openDriver = useUIStore((s) => s.openDriver);
  const companyFilter = useUIStore((s) => s.companyFilter);
  const rosterFilter = useUIStore((s) => s.rosterFilter);
  const formFieldDefs = useFormFieldDefs();

  const [statusFilter, setStatusFilter] = React.useState<Record<DriverStatusValue, boolean>>({
    ACTIVE: true,
    INACTIVE: false,
    TERMINATED: false,
  });
  const [search, setSearch] = React.useState("");
  const [formFilter, setFormFilter] = React.useState<string>("ALL");
  const [dueFrom, setDueFrom] = React.useState("");
  const [dueTo, setDueTo] = React.useState("");
  const [daysMin, setDaysMin] = React.useState("");
  const [daysMax, setDaysMax] = React.useState("30");

  function resetFilters() {
    setStatusFilter({ ACTIVE: true, INACTIVE: false, TERMINATED: false });
    setSearch("");
    setFormFilter("ALL");
    setDueFrom("");
    setDueTo("");
    setDaysMin("");
    setDaysMax("30");
  }

  const scoped = React.useMemo(() => {
    if (!drivers) return [];
    return filterByCompanyRoster(drivers, companyFilter, rosterFilter).filter((d) => statusFilter[d.status]);
  }, [drivers, companyFilter, rosterFilter, statusFilter]);

  const allEntries = React.useMemo(
    () => getDueSoonEntries(scoped, WIDE_WINDOW_DAYS, new Date(), formFieldDefs),
    [scoped, formFieldDefs]
  );

  const entries = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = daysMin === "" ? null : Number(daysMin);
    const max = daysMax === "" ? null : Number(daysMax);
    const from = dueFrom ? new Date(dueFrom) : null;
    const to = dueTo ? new Date(dueTo) : null;

    return allEntries.filter((entry) => {
      if (formFilter !== "ALL" && entry.formKey !== formFilter) return false;
      if (min !== null && entry.daysRemaining < min) return false;
      if (max !== null && entry.daysRemaining > max) return false;
      if (from && new Date(entry.date) < from) return false;
      if (to && new Date(entry.date) > to) return false;
      if (q) {
        const name = `${entry.firstName} ${entry.lastName}`.toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [allEntries, formFilter, daysMin, daysMax, dueFrom, dueTo, search]);

  const expiredCount = entries.filter((e) => e.status === "expired").length;

  return (
    <div className="flex flex-col gap-4 max-w-[1200px] print:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Soon to Expire Report</h1>
          <p className="text-sm text-neutral-500">
            Compliance forms due soon or already overdue. Filter by driver, status, form, due date, or days
            remaining.
            {companyFilter !== "ALL" && (
              <span className="text-neutral-400">
                {" "}
                · Scoped to {companyFilter}
                {rosterFilter !== "ALL" ? ` / ${rosterFilter}` : ""}
              </span>
            )}
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

      <div className="flex flex-col gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by driver name..."
              className="pl-8"
            />
          </div>

          <Select value={formFilter} onValueChange={(v) => setFormFilter(v as typeof formFilter)}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Forms</SelectItem>
              {formFieldDefs.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-neutral-500">Due date</label>
            <Input type="date" value={dueFrom} onChange={(e) => setDueFrom(e.target.value)} className="w-[145px]" />
            <span className="text-neutral-300">–</span>
            <Input type="date" value={dueTo} onChange={(e) => setDueTo(e.target.value)} className="w-[145px]" />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-neutral-500">Days remaining</label>
            <Input
              type="number"
              value={daysMin}
              onChange={(e) => setDaysMin(e.target.value)}
              placeholder="min"
              className="w-[80px]"
            />
            <span className="text-neutral-300">–</span>
            <Input
              type="number"
              value={daysMax}
              onChange={(e) => setDaysMax(e.target.value)}
              placeholder="max"
              className="w-[80px]"
            />
          </div>

          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="size-4" />
            Reset
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {STATUS_OPTIONS.map((status) => (
            <label key={status} className="flex items-center gap-1.5 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={statusFilter[status]}
                onChange={(e) => setStatusFilter((s) => ({ ...s, [status]: e.target.checked }))}
                className="size-3.5"
              />
              {status === "ACTIVE" ? "Active" : status === "INACTIVE" ? "Inactive" : "Terminated"} drivers
            </label>
          ))}

          <span className="ml-auto text-xs text-neutral-400">
            {entries.length} item{entries.length === 1 ? "" : "s"}
            {expiredCount > 0 ? ` · ${expiredCount} already expired` : ""}
          </span>
        </div>
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
                  <TableHead>Company / Roster</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-neutral-400 py-10">
                      No items match the current filters.
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
                    <TableCell className="text-neutral-500">
                      {entry.company ?? "—"}
                      {entry.roster ? ` / ${entry.roster}` : ""}
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
