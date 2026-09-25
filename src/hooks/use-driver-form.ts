"use client";

import * as React from "react";
import { toast } from "sonner";
import { useUpdateDriver, useDeleteDriver } from "@/hooks/use-drivers";
import { useDeleteDriverDocument } from "@/hooks/use-driver-documents";
import { useCanEdit } from "@/hooks/use-auth";
import { getFormDate } from "@/lib/compliance";
import { trackEvent } from "@/lib/analytics";
import type { ComplianceFormDTO, DriverDTO, DriverStatusValue, FormFieldDef } from "@/types/driver";

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export interface DriverIdentityState {
  clientId: string;
  company: string;
  roster: string;
  phone: string;
  email: string;
  position: string;
  driversLicense: string;
  licenseClass: string;
  endorsements: string;
  restrictions: string;
  updateResult: string;
  note: string;
}

function buildIdentity(driver: DriverDTO): DriverIdentityState {
  return {
    clientId: driver.clientId ?? "",
    company: driver.company ?? "",
    roster: driver.roster ?? "",
    phone: driver.phone ?? "",
    email: driver.email ?? "",
    position: driver.position ?? "",
    driversLicense: driver.driversLicense ?? "",
    licenseClass: driver.licenseClass ?? "",
    endorsements: driver.endorsements ?? "",
    restrictions: driver.restrictions ?? "",
    updateResult: driver.updateResult ?? "",
    note: driver.note ?? "",
  };
}

function buildFormDates(driver: DriverDTO, formFieldDefs: FormFieldDef[]): Record<string, string> {
  const dates: Record<string, string> = {
    annualDefensiveDrivingTest: toDateInputValue(driver.complianceForm?.annualDefensiveDrivingTest ?? null),
  };
  for (const f of formFieldDefs) {
    dates[f.key] = toDateInputValue(getFormDate(driver, f));
  }
  return dates;
}

/**
 * Shared editable state + save/delete handlers behind a driver's detail view —
 * used by both the side drawer and the full-page detail route so the two stay
 * in sync. Callers must mount the component using this hook with `key={driver.id}`
 * so switching drivers remounts fresh state instead of needing a sync effect.
 */
export function useDriverForm(
  driver: DriverDTO,
  formFieldDefs: FormFieldDef[],
  onDone: () => void,
  source: "driver_drawer" | "driver_detail_page" = "driver_drawer"
) {
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();
  const deleteDocument = useDeleteDriverDocument();
  const canEdit = useCanEdit();

  const [status, setStatus] = React.useState<DriverStatusValue>(driver.status);
  const [identity, setIdentity] = React.useState<DriverIdentityState>(() => buildIdentity(driver));
  const [formDates, setFormDates] = React.useState<Record<string, string>>(() => buildFormDates(driver, formFieldDefs));

  function handleSave() {
    const form: Partial<ComplianceFormDTO> = {
      annualDefensiveDrivingTest: formDates.annualDefensiveDrivingTest
        ? new Date(formDates.annualDefensiveDrivingTest).toISOString()
        : null,
    };
    const customForm: Record<string, string | null> = {};
    for (const f of formFieldDefs) {
      const raw = formDates[f.key];
      const iso = raw ? new Date(raw).toISOString() : null;
      if (f.isCustom) customForm[f.key] = iso;
      else form[f.key as keyof ComplianceFormDTO] = iso;
    }
    const statusChanged = status !== driver.status;
    const formDatesChanged = formFieldDefs.filter(
      (f) => (formDates[f.key] ?? "") !== toDateInputValue(getFormDate(driver, f))
    ).length;

    updateDriver.mutate(
      {
        id: driver.id,
        driver: { status, ...identity },
        form,
        customForm,
      },
      {
        onSuccess: () => {
          trackEvent("driver_updated", { status_changed: statusChanged, form_dates_changed: formDatesChanged });
          toast.success(`Saved compliance updates for ${driver.firstName} ${driver.lastName}`);
          onDone();
        },
        onError: () => toast.error("Failed to save changes"),
      }
    );
  }

  function handleDelete() {
    const name = `${driver.firstName} ${driver.lastName}`;
    if (!window.confirm(`Delete ${name}? This permanently removes their record and compliance dates.`)) return;

    deleteDriver.mutate(driver.id, {
      onSuccess: () => {
        trackEvent("driver_deleted", { location: source });
        toast.success(`Deleted ${name}`);
        onDone();
      },
      onError: () => toast.error("Failed to delete driver"),
    });
  }

  function handleDeleteDocument(documentId: string, label: string) {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    deleteDocument.mutate(
      { driverId: driver.id, documentId },
      {
        onSuccess: () => {
          trackEvent("document_deleted", {});
          toast.success(`Deleted ${label}`);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete document"),
      }
    );
  }

  return {
    canEdit,
    status,
    setStatus,
    identity,
    setIdentity,
    formDates,
    setFormDates,
    handleSave,
    handleDelete,
    handleDeleteDocument,
    isSaving: updateDriver.isPending,
    isDeleting: deleteDriver.isPending,
    isDeletingDocument: deleteDocument.isPending,
  };
}

export type DriverFormState = ReturnType<typeof useDriverForm>;
