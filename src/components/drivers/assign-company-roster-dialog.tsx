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
import { CompanyRosterFields } from "@/components/companies/company-roster-fields";
import { useBulkAssignCompanyRoster } from "@/hooks/use-drivers";

export function AssignCompanyRosterDialog({
  open,
  onOpenChange,
  driverIds,
  onApplied,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverIds: string[];
  onApplied?: () => void;
}) {
  const bulkAssign = useBulkAssignCompanyRoster();
  const [company, setCompany] = React.useState("");
  const [roster, setRoster] = React.useState("");
  const count = driverIds.length;

  React.useEffect(() => {
    if (open) {
      setCompany("");
      setRoster("");
    }
  }, [open]);

  function handleApply() {
    if (count === 0) return;
    bulkAssign.mutate(
      { ids: driverIds, company, roster },
      {
        onSuccess: () => {
          toast.success(`Updated ${count} driver${count === 1 ? "" : "s"}`);
          onOpenChange(false);
          onApplied?.();
        },
        onError: () => toast.error("Failed to update some drivers"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Company / Roster</DialogTitle>
          <DialogDescription>
            Applies to {count} selected driver{count === 1 ? "" : "s"}. Choosing &quot;— None —&quot; clears that
            field on all of them.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <CompanyRosterFields
            company={company}
            roster={roster}
            onCompanyChange={setCompany}
            onRosterChange={setRoster}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={bulkAssign.isPending}>
            {bulkAssign.isPending ? "Applying..." : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
