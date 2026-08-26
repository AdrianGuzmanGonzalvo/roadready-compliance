"use client";

import * as React from "react";
import { toast } from "sonner";
import { RotateCcw, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormLabelOverrides, useUpdateFormLabel, type FormFieldOverride } from "@/hooks/use-form-labels";
import { FORM_FIELD_DEFS } from "@/types/driver";

type EditableField = "label" | "description" | "frequency";

function FieldInput({
  fieldLabel,
  value,
  defaultValue,
  isOverridden,
  onChange,
  onReset,
}: {
  fieldLabel: string;
  value: string;
  defaultValue: string;
  isOverridden: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-neutral-400">{fieldLabel}</Label>
      <div className="flex items-center gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 flex-1 text-sm" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          title="Reset to default"
          disabled={!isOverridden && value === defaultValue}
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
  const updateField = useUpdateFormLabel();

  const initial = React.useMemo(
    () => ({
      label: override?.label ?? defaultLabel,
      description: override?.description ?? defaultDescription,
      frequency: override?.frequency ?? defaultFrequency,
    }),
    [override?.label, override?.description, override?.frequency, defaultLabel, defaultDescription, defaultFrequency]
  );

  const [values, setValues] = React.useState(initial);

  React.useEffect(() => {
    setValues(initial);
  }, [initial]);

  const defaults = { label: defaultLabel, description: defaultDescription, frequency: defaultFrequency };
  const dirty =
    values.label !== initial.label || values.description !== initial.description || values.frequency !== initial.frequency;

  function setField(field: EditableField, value: string) {
    setValues((s) => ({ ...s, [field]: value }));
  }

  async function handleSave() {
    const changed = (Object.keys(values) as EditableField[]).filter((field) => values[field] !== initial[field]);
    try {
      for (const field of changed) {
        const trimmed = values[field].trim();
        await updateField.mutateAsync({
          key: formKey,
          field,
          value: !trimmed || trimmed === defaults[field] ? null : trimmed,
        });
      }
      toast.success(`Saved ${defaultLabel}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  function handleReset(field: EditableField) {
    setField(field, defaults[field]);
    updateField.mutate(
      { key: formKey, field, value: null },
      { onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to reset") }
    );
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-end">
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
        <FieldInput
          fieldLabel="Form"
          value={values.label}
          defaultValue={defaultLabel}
          isOverridden={!!override?.label}
          onChange={(v) => setField("label", v)}
          onReset={() => handleReset("label")}
        />
        <FieldInput
          fieldLabel="Official Name"
          value={values.description}
          defaultValue={defaultDescription}
          isOverridden={!!override?.description}
          onChange={(v) => setField("description", v)}
          onReset={() => handleReset("description")}
        />
        <FieldInput
          fieldLabel="Renewal Frequency"
          value={values.frequency}
          defaultValue={defaultFrequency}
          isOverridden={!!override?.frequency}
          onChange={(v) => setField("frequency", v)}
          onReset={() => handleReset("frequency")}
        />
      </div>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={!dirty || updateField.isPending}
        className="h-8 shrink-0"
      >
        <Check className="size-3.5" />
        Save
      </Button>
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
          Rename any form, its official name, or renewal frequency as shown across the app. Click Save to apply your
          changes, or use the reset icon to restore a field&apos;s built-in default.
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
