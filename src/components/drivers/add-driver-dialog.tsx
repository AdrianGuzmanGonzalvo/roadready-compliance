"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUIStore } from "@/store/ui-store";
import { useCreateDriver } from "@/hooks/use-drivers";
import type { DriverStatusValue } from "@/types/driver";

const EMPTY = {
  lastName: "",
  firstName: "",
  clientId: "",
  phone: "",
  position: "",
  driversLicense: "",
  licenseClass: "",
  endorsements: "",
  restrictions: "",
  note: "",
};

export function AddDriverDialog() {
  const open = useUIStore((s) => s.addDriverOpen);
  const setOpen = useUIStore((s) => s.setAddDriverOpen);
  const openDriver = useUIStore((s) => s.openDriver);
  const createDriver = useCreateDriver();

  const [status, setStatus] = React.useState<DriverStatusValue>("ACTIVE");
  const [fields, setFields] = React.useState(EMPTY);

  function reset() {
    setStatus("ACTIVE");
    setFields(EMPTY);
  }

  function handleCreate() {
    if (!fields.lastName.trim() || !fields.firstName.trim()) return;

    createDriver.mutate(
      { ...fields, status },
      {
        onSuccess: (driver) => {
          toast.success(`Added ${driver.firstName} ${driver.lastName}`);
          setOpen(false);
          reset();
          openDriver(driver.id);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add driver"),
      }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Driver</DialogTitle>
          <DialogDescription>Create a new driver record. You can add compliance form dates next.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>First Name *</Label>
            <Input
              value={fields.firstName}
              onChange={(e) => setFields((s) => ({ ...s, firstName: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Last Name *</Label>
            <Input
              value={fields.lastName}
              onChange={(e) => setFields((s) => ({ ...s, lastName: e.target.value }))}
            />
          </div>

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

          <div className="space-y-1.5">
            <Label>Client ID</Label>
            <Input value={fields.clientId} onChange={(e) => setFields((s) => ({ ...s, clientId: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={fields.phone} onChange={(e) => setFields((s) => ({ ...s, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Position</Label>
            <Input
              value={fields.position}
              onChange={(e) => setFields((s) => ({ ...s, position: e.target.value }))}
              placeholder="DRIVER"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Driver&apos;s License #</Label>
            <Input
              value={fields.driversLicense}
              onChange={(e) => setFields((s) => ({ ...s, driversLicense: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>License Class</Label>
            <Input
              value={fields.licenseClass}
              onChange={(e) => setFields((s) => ({ ...s, licenseClass: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Endorsements</Label>
            <Input
              value={fields.endorsements}
              onChange={(e) => setFields((s) => ({ ...s, endorsements: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Restrictions</Label>
            <Input
              value={fields.restrictions}
              onChange={(e) => setFields((s) => ({ ...s, restrictions: e.target.value }))}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Note</Label>
            <Input value={fields.note} onChange={(e) => setFields((s) => ({ ...s, note: e.target.value }))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!fields.firstName.trim() || !fields.lastName.trim() || createDriver.isPending}
          >
            {createDriver.isPending ? "Adding..." : "Add Driver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
