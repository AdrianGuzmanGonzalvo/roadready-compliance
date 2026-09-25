"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanEdit } from "@/hooks/use-auth";
import type { DriverFormState } from "@/hooks/use-driver-form";

/** Delete / Cancel / Save action bar shared by the driver drawer and the full-page driver detail view. */
export function DriverFormActions({ form, onCancel }: { form: DriverFormState; onCancel: () => void }) {
  const canEdit = useCanEdit();

  if (!canEdit) {
    return (
      <Button variant="outline" onClick={onCancel} className="ml-auto">
        Close
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={form.handleDelete}
        disabled={form.isDeleting}
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="size-4" />
        {form.isDeleting ? "Deleting..." : "Delete Driver"}
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={form.handleSave} disabled={form.isSaving}>
          {form.isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </>
  );
}
