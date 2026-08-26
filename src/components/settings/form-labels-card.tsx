"use client";

import * as React from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormLabelOverrides, useUpdateFormLabel } from "@/hooks/use-form-labels";
import { FORM_FIELD_DEFS } from "@/types/driver";

function FormLabelRow({ formKey, defaultLabel, override }: { formKey: string; defaultLabel: string; override?: string }) {
  const updateLabel = useUpdateFormLabel();
  const [value, setValue] = React.useState(override ?? defaultLabel);

  React.useEffect(() => {
    setValue(override ?? defaultLabel);
  }, [override, defaultLabel]);

  const isOverridden = !!override;
  const dirty = value.trim() !== (override ?? defaultLabel);

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === defaultLabel) {
      updateLabel.mutate(
        { key: formKey, label: null },
        { onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update label") }
      );
      return;
    }
    updateLabel.mutate(
      { key: formKey, label: trimmed },
      { onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update label") }
    );
  }

  function handleReset() {
    setValue(defaultLabel);
    updateLabel.mutate(
      { key: formKey, label: null },
      { onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to reset label") }
    );
  }

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <span className="w-28 shrink-0 text-xs text-neutral-400">{defaultLabel}</span>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => dirty && handleSave()}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-8 flex-1 text-sm"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleReset}
        title="Reset to default"
        disabled={!isOverridden}
        className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
      >
        <RotateCcw className="size-4" />
      </Button>
    </li>
  );
}

export function FormLabelsCard() {
  const { data: overrides } = useFormLabelOverrides();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-neutral-900">Compliance Form Names</CardTitle>
        <p className="text-xs text-neutral-400">
          Rename how each tracked form appears across the app. The gray text on the left is the built-in default.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-neutral-100">
          {FORM_FIELD_DEFS.map((f) => (
            <FormLabelRow key={f.key} formKey={f.key} defaultLabel={f.label} override={overrides?.[f.key]} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
