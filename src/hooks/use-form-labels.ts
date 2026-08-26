"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FORM_FIELD_DEFS, type FormFieldDef } from "@/types/driver";

export interface FormFieldOverride {
  label?: string;
  description?: string;
  frequency?: string;
}

async function fetchFormLabelOverrides(): Promise<Record<string, FormFieldOverride>> {
  const res = await fetch("/api/form-labels");
  if (!res.ok) throw new Error("Failed to load form labels");
  const data = await res.json();
  return data.overrides;
}

export function useFormLabelOverrides() {
  return useQuery({ queryKey: ["form-labels"], queryFn: fetchFormLabelOverrides, staleTime: 60_000 });
}

/** FORM_FIELD_DEFS with any admin-set overrides (label/description/frequency) applied. */
export function useFormFieldDefs(): FormFieldDef[] {
  const { data: overrides } = useFormLabelOverrides();
  return React.useMemo(
    () =>
      FORM_FIELD_DEFS.map((f) => {
        const o = overrides?.[f.key];
        return {
          ...f,
          label: o?.label ?? f.label,
          description: o?.description ?? f.description,
          frequency: o?.frequency ?? f.frequency,
        };
      }),
    [overrides]
  );
}

export function useUpdateFormLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      field,
      value,
    }: {
      key: string;
      field: "label" | "description" | "frequency";
      value: string | null;
    }) => {
      const res = await fetch("/api/form-labels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, field, value }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update form field");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["form-labels"] }),
  });
}
