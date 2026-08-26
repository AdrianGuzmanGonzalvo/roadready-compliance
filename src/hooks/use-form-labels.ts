"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FORM_FIELD_DEFS, type FormFieldDef } from "@/types/driver";

async function fetchFormLabelOverrides(): Promise<Record<string, string>> {
  const res = await fetch("/api/form-labels");
  if (!res.ok) throw new Error("Failed to load form labels");
  const data = await res.json();
  return data.overrides;
}

export function useFormLabelOverrides() {
  return useQuery({ queryKey: ["form-labels"], queryFn: fetchFormLabelOverrides, staleTime: 60_000 });
}

/** FORM_FIELD_DEFS with any admin-set label overrides applied. */
export function useFormFieldDefs(): FormFieldDef[] {
  const { data: overrides } = useFormLabelOverrides();
  return React.useMemo(
    () => FORM_FIELD_DEFS.map((f) => ({ ...f, label: overrides?.[f.key] ?? f.label })),
    [overrides]
  );
}

export function useUpdateFormLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, label }: { key: string; label: string | null }) => {
      const res = await fetch("/api/form-labels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, label }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update label");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["form-labels"] }),
  });
}
