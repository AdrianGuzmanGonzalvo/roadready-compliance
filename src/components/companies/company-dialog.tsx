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
import { useCreateCompany, useUpdateCompany } from "@/hooks/use-companies";
import type { CompanyDTO } from "@/types/company";

const EMPTY = {
  name: "",
  address: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  notes: "",
  rosters: "",
};

export function CompanyDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: CompanyDTO | null;
}) {
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const isEditing = !!company;
  const pending = createCompany.isPending || updateCompany.isPending;

  const [fields, setFields] = React.useState(EMPTY);

  React.useEffect(() => {
    if (!open) return;
    setFields({
      name: company?.name ?? "",
      address: company?.address ?? "",
      contactName: company?.contactName ?? "",
      contactPhone: company?.contactPhone ?? "",
      contactEmail: company?.contactEmail ?? "",
      notes: company?.notes ?? "",
      rosters: "",
    });
  }, [open, company]);

  function handleSave() {
    if (!fields.name.trim()) return;

    if (isEditing) {
      updateCompany.mutate(
        { id: company.id, ...fields },
        {
          onSuccess: () => {
            toast.success(`Updated ${fields.name}`);
            onOpenChange(false);
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update company"),
        }
      );
    } else {
      const rosters = fields.rosters
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      createCompany.mutate(
        { ...fields, rosters },
        {
          onSuccess: () => {
            toast.success(`Added ${fields.name}`);
            onOpenChange(false);
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create company"),
        }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Company" : "Add Company"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update company information."
              : "Create a company. You can add rosters now or manage them afterward."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Company Name *</Label>
            <Input
              value={fields.name}
              onChange={(e) => setFields((s) => ({ ...s, name: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Address</Label>
            <Input value={fields.address} onChange={(e) => setFields((s) => ({ ...s, address: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Name</Label>
            <Input
              value={fields.contactName}
              onChange={(e) => setFields((s) => ({ ...s, contactName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Phone</Label>
            <Input
              value={fields.contactPhone}
              onChange={(e) => setFields((s) => ({ ...s, contactPhone: e.target.value }))}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Contact Email</Label>
            <Input
              value={fields.contactEmail}
              onChange={(e) => setFields((s) => ({ ...s, contactEmail: e.target.value }))}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Notes</Label>
            <Input value={fields.notes} onChange={(e) => setFields((s) => ({ ...s, notes: e.target.value }))} />
          </div>
          {!isEditing && (
            <div className="col-span-2 space-y-1.5">
              <Label>Rosters (optional)</Label>
              <Input
                value={fields.rosters}
                onChange={(e) => setFields((s) => ({ ...s, rosters: e.target.value }))}
                placeholder="e.g. JFK, LGA, PREK"
              />
              <p className="text-xs text-neutral-400">Comma-separated. You can add more later.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!fields.name.trim() || pending}>
            {pending ? "Saving..." : isEditing ? "Save Changes" : "Add Company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
