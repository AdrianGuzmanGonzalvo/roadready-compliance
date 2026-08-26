"use client";

import * as React from "react";
import { toast } from "sonner";
import { RotateCcw, Check, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useFormLabels,
  useUpdateFormLabel,
  useCreateCustomForm,
  useUpdateCustomForm,
  useDeleteCustomForm,
  type FormFieldOverride,
} from "@/hooks/use-form-labels";
import { FORM_FIELD_DEFS } from "@/types/driver";
import type { FormFieldDef } from "@/types/driver";

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
  onReset?: () => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-neutral-400">{fieldLabel}</Label>
      <div className="flex items-center gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 flex-1 text-sm" />
        {onReset && (
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
        )}
      </div>
    </div>
  );
}

function BuiltInFormRow({
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
      <Button size="sm" onClick={handleSave} disabled={!dirty || updateField.isPending} className="h-8 shrink-0">
        <Check className="size-3.5" />
        Save
      </Button>
    </li>
  );
}

function CustomFormRow({ form }: { form: FormFieldDef }) {
  const updateCustomForm = useUpdateCustomForm();
  const deleteCustomForm = useDeleteCustomForm();

  const initial = React.useMemo(
    () => ({ label: form.label, description: form.description, frequency: form.frequency }),
    [form.label, form.description, form.frequency]
  );
  const [values, setValues] = React.useState(initial);

  React.useEffect(() => {
    setValues(initial);
  }, [initial]);

  const dirty =
    values.label !== initial.label || values.description !== initial.description || values.frequency !== initial.frequency;

  function setField(field: EditableField, value: string) {
    setValues((s) => ({ ...s, [field]: value }));
  }

  async function handleSave() {
    if (!values.label.trim()) {
      toast.error("Form name is required");
      return;
    }
    try {
      await updateCustomForm.mutateAsync({
        key: form.key,
        label: values.label.trim(),
        description: values.description.trim(),
        frequency: values.frequency.trim(),
      });
      toast.success(`Saved ${values.label.trim()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${form.label}"? This also removes every driver's recorded date for it.`)) return;
    deleteCustomForm.mutate(form.key, {
      onSuccess: () => toast.success(`Deleted ${form.label}`),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete form"),
    });
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-end">
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
        <FieldInput
          fieldLabel="Form"
          value={values.label}
          defaultValue={form.label}
          isOverridden={false}
          onChange={(v) => setField("label", v)}
        />
        <FieldInput
          fieldLabel="Official Name"
          value={values.description}
          defaultValue={form.description}
          isOverridden={false}
          onChange={(v) => setField("description", v)}
        />
        <FieldInput
          fieldLabel="Renewal Frequency"
          value={values.frequency}
          defaultValue={form.frequency}
          isOverridden={false}
          onChange={(v) => setField("frequency", v)}
        />
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" onClick={handleSave} disabled={!dirty || updateCustomForm.isPending} className="h-8">
          <Check className="size-3.5" />
          Save
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDelete}
          disabled={deleteCustomForm.isPending}
          title="Delete form"
          className="size-8 text-neutral-400 hover:text-red-600"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}

function AddFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createCustomForm = useCreateCustomForm();
  const [label, setLabel] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [frequency, setFrequency] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setLabel("");
    setDescription("");
    setFrequency("");
  }, [open]);

  function handleCreate() {
    if (!label.trim()) return;
    createCustomForm.mutate(
      { label: label.trim(), description: description.trim(), frequency: frequency.trim() },
      {
        onSuccess: () => {
          toast.success(`Added ${label.trim()}`);
          onOpenChange(false);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add form"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tracked Form</DialogTitle>
          <DialogDescription>
            Adds a new compliance form that behaves like the built-in ones everywhere in the app.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label>Form</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. DS-999" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Official Name</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Renewal Frequency</Label>
            <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!label.trim() || createCustomForm.isPending}>
            {createCustomForm.isPending ? "Adding..." : "Add Form"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FormLabelsCard() {
  const { data } = useFormLabels();
  const overrides = data?.overrides;
  const customForms = data?.customForms ?? [];
  const [addOpen, setAddOpen] = React.useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold text-neutral-900">Tracked Compliance Forms</CardTitle>
          <p className="text-xs text-neutral-400">
            Rename any form, its official name, or renewal frequency, or add a new one. Click Save to apply changes.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Add Form
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-neutral-100">
          {FORM_FIELD_DEFS.map((f) => (
            <BuiltInFormRow
              key={f.key}
              formKey={f.key}
              defaultLabel={f.label}
              defaultDescription={f.description}
              defaultFrequency={f.frequency}
              override={overrides?.[f.key]}
            />
          ))}
          {customForms.map((f) => (
            <CustomFormRow key={f.key} form={f} />
          ))}
        </ul>
      </CardContent>
      <AddFormDialog open={addOpen} onOpenChange={setAddOpen} />
    </Card>
  );
}
