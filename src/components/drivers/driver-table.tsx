"use client";

import type { MouseEvent } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ComplianceBadge } from "@/components/drivers/compliance-badge";
import { StatusQuickSelect } from "@/components/drivers/status-quick-select";
import { useUIStore } from "@/store/ui-store";
import { useDeleteDriver } from "@/hooks/use-drivers";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import { nextExpiringForm } from "@/lib/compliance";
import type { DriverDTO } from "@/types/driver";

interface DriverTableProps {
  drivers: DriverDTO[];
  selectedIds: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}

export function DriverTable({ drivers, selectedIds, onToggleOne, onToggleAll }: DriverTableProps) {
  const openDriver = useUIStore((s) => s.openDriver);
  const deleteDriver = useDeleteDriver();
  const formFieldDefs = useFormFieldDefs();

  const allSelected = drivers.length > 0 && drivers.every((d) => selectedIds.has(d.id));
  const someSelected = drivers.some((d) => selectedIds.has(d.id));

  function handleDelete(e: MouseEvent, driver: DriverDTO) {
    e.stopPropagation();
    const name = `${driver.firstName} ${driver.lastName}`;
    if (!window.confirm(`Delete ${name}? This permanently removes their record and compliance dates.`)) return;
    deleteDriver.mutate(driver.id, {
      onSuccess: () => toast.success(`Deleted ${name}`),
      onError: () => toast.error("Failed to delete driver"),
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-9">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={(checked) => onToggleAll(checked === true)}
              aria-label="Select all"
              onClick={(e) => e.stopPropagation()}
            />
          </TableHead>
          <TableHead>Driver</TableHead>
          <TableHead>Company / Roster</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>License #</TableHead>
          <TableHead>Next Due</TableHead>
          <TableHead className="w-9" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {drivers.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-neutral-400 py-10">
              No drivers match the current filters.
            </TableCell>
          </TableRow>
        )}
        {drivers.map((driver) => {
          const next = nextExpiringForm(driver, formFieldDefs);
          return (
            <TableRow key={driver.id} className="cursor-pointer" onClick={() => openDriver(driver.id)}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(driver.id)}
                  onCheckedChange={() => onToggleOne(driver.id)}
                  aria-label={`Select ${driver.firstName} ${driver.lastName}`}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableCell>
              <TableCell className="font-medium text-neutral-900">
                {driver.lastName}, {driver.firstName}
              </TableCell>
              <TableCell className="text-neutral-500">
                {driver.company ?? "—"}
                {driver.roster ? ` / ${driver.roster}` : ""}
              </TableCell>
              <TableCell>
                <StatusQuickSelect
                  driverId={driver.id}
                  status={driver.status}
                  driverName={`${driver.firstName} ${driver.lastName}`}
                />
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
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDelete(e, driver)}
                  title="Delete driver"
                  className="size-8 text-neutral-400 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
