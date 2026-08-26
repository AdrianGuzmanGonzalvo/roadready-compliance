"use client";

import * as React from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormLabelOverrides, useUpdateFormLabel, type FormFieldOverride } from "@/hooks/use-form-labels";
import { FORM_FIELD_DEFS } from "@/types/driver";

type EditableField = "label" | "description" | "frequency";

function FieldEditor({
  formKey,
  field,
  fieldLabel,
  defaultValue,
  overrideValue,
}: {
  formKey: string;
  field: EditableField;
  fieldLabel: string;
  defaultValue: string;
  overrideValue?: string;
}) {
  const updateField = useUpdateFormLabel();
  const [value, setValue] = React.useState(overrideValue ?? defaultValue);

  React.useEffect(() => {
    setValue(overrideValue ?? defaultValue);
  }, [overrideValue, defaultValue]);

  const isOverridden = !!overrideValue;
  const dirty = value.trim() !== (overrideValue ?? defaultValue);

  function save() {
    const trimmed = value.trim();
    updateField.mutate(
      { key: formKey, field, value: !trimmed || trimmed === defaultValue ? null : trimmed },
      { onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to save") }
    );
  }

  function reset() {
    setValue(defaultValue);
    updateField.mutate(
      { key: formKey, field, value: null },
      { onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to reset") }
    );
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs text-neutral-400">{fieldLabel}</Label>
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => dirty && save()}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="h-8 flex-1 text-sm"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={reset}
          title="Reset to default"
          disabled={!isOverridden}
          className="size-8 shrink-0 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
        >
          <RotateCcw className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function FormFieldEditorBlock({
  formKey,
  defaultLabel,
  defaultDescription,
  defaultFrequency,
  override,
}: {
  formKey: string;
  defaultLabel: string;
  defaultDescription: string;
  defaultFrequency: string;
  override?: FormFieldOverride;
}) {
  return (
    <li className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-3">
      <FieldEditor formKey={formKey} field="label" fieldLabel="Form" defaultValue={defaultLabel} overrideValue={override?.label} />
      <FieldEditor
        formKey={formKey}
        field="description"
        fieldLabel="Official Name"
        defaultValue={defaultDescription}
        overrideValue={override?.description}
      />
      <FieldEditor
        formKey={formKey}
        field="frequency"
        fieldLabel="Renewal Frequency"
        defaultValue={defaultFrequency}
        overrideValue={override?.frequency}
      />
    </li>
  );
}

export function FormLabelsCard() {
  const { data: overrides } = useFormLabelOverrides();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-neutral-900">Tracked Compliance Forms</CardTitle>
        <p className="text-xs text-neutral-400">
          Rename any form, its official name, or renewal frequency as shown across the app. Edits save on blur or
          Enter; use the reset icon to restore the built-in default.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-neutral-100">
          {FORM_FIELD_DEFS.map((f) => (
            <FormFieldEditorBlock
              key={f.key}
              formKey={f.key}
              defaultLabel={f.label}
              defaultDescription={f.description}
              defaultFrequency={f.frequency}
              override={overrides?.[f.key]}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
