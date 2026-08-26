"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FORM_FIELD_DEFS, type FormFieldDef } from "@/types/driver";

export interface FormFieldOverride {
  label?: string;
  description?: string;
  frequency?: string;
}

interface FormLabelsResponse {
  overrides: Record<string, FormFieldOverride>;
  customForms: FormFieldDef[];
}

async function fetchFormLabels(): Promise<FormLabelsResponse> {
  const res = await fetch("/api/form-labels");
  if (!res.ok) throw new Error("Failed to load form labels");
  return res.json();
}

export function useFormLabels() {
  return useQuery({ queryKey: ["form-labels"], queryFn: fetchFormLabels, staleTime: 60_000 });
}

export function useFormLabelOverrides() {
  const { data } = useFormLabels();
  return { data: data?.overrides };
}

/** Built-in forms (+ admin-set overrides) plus any admin-added custom forms, as one ordered list. */
export function useFormFieldDefs(): FormFieldDef[] {
  const { data } = useFormLabels();
  const overrides = data?.overrides;
  const customForms = data?.customForms ?? [];
  return React.useMemo(() => {
    const builtIn: FormFieldDef[] = FORM_FIELD_DEFS.map((f) => {
      const o = overrides?.[f.key];
      return {
        key: f.key,
        label: o?.label ?? f.label,
        description: o?.description ?? f.description,
        frequency: o?.frequency ?? f.frequency,
        isCustom: false,
      };
    });
    return [...builtIn, ...customForms];
  }, [overrides, customForms]);
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

export function useCreateCustomForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { label: string; description: string; frequency: string }) => {
      const res = await fetch("/api/custom-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create form");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["form-labels"] }),
  });
}

export function useUpdateCustomForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      ...body
    }: {
      key: string;
      label?: string;
      description?: string;
      frequency?: string;
    }) => {
      const res = await fetch(`/api/custom-forms/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error ?? "Failed to update form");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["form-labels"] }),
  });
}

export function useDeleteCustomForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch(`/api/custom-forms/${key}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete form");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-labels"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}
