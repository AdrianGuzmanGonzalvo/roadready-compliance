"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComplianceBadge, DriverStatusBadge } from "@/components/drivers/compliance-badge";
import { CompanyRosterFields } from "@/components/companies/company-roster-fields";
import { useUIStore } from "@/store/ui-store";
import { useDrivers, useUpdateDriver, useDeleteDriver } from "@/hooks/use-drivers";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import { FORM_FIELD_DEFS } from "@/types/driver";
import type { ComplianceFormDTO, DriverStatusValue } from "@/types/driver";

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

const EMPTY_FORM: Record<string, string> = Object.fromEntries(
  [...FORM_FIELD_DEFS.map((f) => f.key), "annualDefensiveDrivingTest"].map((k) => [k, ""])
);

export function DriverDrawer() {
  const selectedDriverId = useUIStore((s) => s.selectedDriverId);
  const closeDriver = useUIStore((s) => s.closeDriver);
  const { data: drivers } = useDrivers();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();
  const formFieldDefs = useFormFieldDefs();

  const driver = drivers?.find((d) => d.id === selectedDriverId) ?? null;

  const [status, setStatus] = React.useState<DriverStatusValue>("ACTIVE");
  const [identity, setIdentity] = React.useState({
    clientId: "",
    company: "",
    roster: "",
    phone: "",
    position: "",
    driversLicense: "",
    licenseClass: "",
    endorsements: "",
    restrictions: "",
    updateResult: "",
    note: "",
  });
  const [formDates, setFormDates] = React.useState<Record<string, string>>(EMPTY_FORM);

  React.useEffect(() => {
    if (!driver) return;
    setStatus(driver.status);
    setIdentity({
      clientId: driver.clientId ?? "",
      company: driver.company ?? "",
      roster: driver.roster ?? "",
      phone: driver.phone ?? "",
      position: driver.position ?? "",
      driversLicense: driver.driversLicense ?? "",
      licenseClass: driver.licenseClass ?? "",
      endorsements: driver.endorsements ?? "",
      restrictions: driver.restrictions ?? "",
      updateResult: driver.updateResult ?? "",
      note: driver.note ?? "",
    });
    setFormDates({
      pptXray: toDateInputValue(driver.complianceForm?.pptXray ?? null),
      mcsa5876: toDateInputValue(driver.complianceForm?.mcsa5876 ?? null),
      ds703: toDateInputValue(driver.complianceForm?.ds703 ?? null),
      ds704: toDateInputValue(driver.complianceForm?.ds704 ?? null),
      licenseExp: toDateInputValue(driver.complianceForm?.licenseExp ?? null),
      ds870: toDateInputValue(driver.complianceForm?.ds870 ?? null),
      ds872: toDateInputValue(driver.complianceForm?.ds872 ?? null),
      ds873: toDateInputValue(driver.complianceForm?.ds873 ?? null),
      ds875: toDateInputValue(driver.complianceForm?.ds875 ?? null),
      ds875y: toDateInputValue(driver.complianceForm?.ds875y ?? null),
      annualDefensiveDrivingTest: toDateInputValue(driver.complianceForm?.annualDefensiveDrivingTest ?? null),
    });
  }, [driver]);

  if (!driver) {
    return (
      <Sheet open={false} onOpenChange={(open) => !open && closeDriver()}>
        <SheetContent />
      </Sheet>
    );
  }

  function handleSave() {
    if (!driver) return;
    const form: Partial<ComplianceFormDTO> = {};
    for (const key of Object.keys(formDates)) {
      form[key as keyof ComplianceFormDTO] = formDates[key] ? new Date(formDates[key]).toISOString() : null;
    }

    updateDriver.mutate(
      {
        id: driver.id,
        driver: { status, ...identity },
        form,
      },
      {
        onSuccess: () => {
          toast.success(`Saved compliance updates for ${driver.firstName} ${driver.lastName}`);
          closeDriver();
        },
        onError: () => toast.error("Failed to save changes"),
      }
    );
  }

  function handleDelete() {
    if (!driver) return;
    const name = `${driver.firstName} ${driver.lastName}`;
    if (!window.confirm(`Delete ${name}? This permanently removes their record and compliance dates.`)) return;

    deleteDriver.mutate(driver.id, {
      onSuccess: () => {
        toast.success(`Deleted ${name}`);
        closeDriver();
      },
      onError: () => toast.error("Failed to delete driver"),
    });
  }

  return (
    <Sheet open={!!selectedDriverId} onOpenChange={(open) => !open && closeDriver()}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>
              {driver.lastName}, {driver.firstName}
            </SheetTitle>
            <DriverStatusBadge status={driver.status} />
          </div>
          <SheetDescription>
            {driver.position ?? "Driver"} · License {driver.driversLicense ?? "—"} · SSN {driver.ssn ?? "—"}
            {(driver.company || driver.roster) && (
              <>
                {" "}
                · {driver.company ?? "—"}
                {driver.roster ? ` / ${driver.roster}` : ""}
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="flex flex-col gap-6 py-4">
          <section className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as DriverStatusValue)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CompanyRosterFields
              company={identity.company}
              roster={identity.roster}
              onCompanyChange={(company) => setIdentity((s) => ({ ...s, company }))}
              onRosterChange={(roster) => setIdentity((s) => ({ ...s, roster }))}
            />
            <div className="space-y-1.5">
              <Label>Client ID</Label>
              <Input
                value={identity.clientId}
                onChange={(e) => setIdentity((s) => ({ ...s, clientId: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={identity.phone} onChange={(e) => setIdentity((s) => ({ ...s, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input
                value={identity.position}
                onChange={(e) => setIdentity((s) => ({ ...s, position: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Driver&apos;s License #</Label>
              <Input
                value={identity.driversLicense}
                onChange={(e) => setIdentity((s) => ({ ...s, driversLicense: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>License Class</Label>
              <Input
                value={identity.licenseClass}
                onChange={(e) => setIdentity((s) => ({ ...s, licenseClass: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Endorsements</Label>
              <Input
                value={identity.endorsements}
                onChange={(e) => setIdentity((s) => ({ ...s, endorsements: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Restrictions</Label>
              <Input
                value={identity.restrictions}
                onChange={(e) => setIdentity((s) => ({ ...s, restrictions: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Update Result</Label>
              <Input
                value={identity.updateResult}
                onChange={(e) => setIdentity((s) => ({ ...s, updateResult: e.target.value }))}
                placeholder="e.g. COMPLETE FILE"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Note</Label>
              <Input value={identity.note} onChange={(e) => setIdentity((s) => ({ ...s, note: e.target.value }))} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">Compliance Form Dates</h3>
            <div className="grid grid-cols-1 gap-3">
              {formFieldDefs.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 p-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{f.label}</p>
                    <p className="text-xs text-neutral-400 truncate">{f.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ComplianceBadge date={formDates[f.key] ? new Date(formDates[f.key]).toISOString() : null} compact />
                    <Input
                      type="date"
                      value={formDates[f.key]}
                      onChange={(e) => setFormDates((s) => ({ ...s, [f.key]: e.target.value }))}
                      className="w-[150px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </SheetBody>

        <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-4">
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={deleteDriver.isPending}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="size-4" />
            {deleteDriver.isPending ? "Deleting..." : "Delete Driver"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeDriver}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateDriver.isPending}>
              {updateDriver.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
