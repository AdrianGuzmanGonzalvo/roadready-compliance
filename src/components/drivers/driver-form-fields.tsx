"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2, UploadCloud, FileText, Image as ImageIcon, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComplianceBadge } from "@/components/drivers/compliance-badge";
import { CompanyRosterFields } from "@/components/companies/company-roster-fields";
import { useCanEdit } from "@/hooks/use-auth";
import { useUploadDriverDocument } from "@/hooks/use-driver-documents";
import { fileTypeForAnalytics, trackEvent } from "@/lib/analytics";
import type { DriverFormState } from "@/hooks/use-driver-form";
import type { DriverDTO, DriverStatusValue, FormFieldDef } from "@/types/driver";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The identity grid, compliance form dates, and documents sections shared by the driver drawer and the full-page driver detail view. */
export function DriverFormFields({
  driver,
  formFieldDefs,
  form,
}: {
  driver: DriverDTO;
  formFieldDefs: FormFieldDef[];
  form: DriverFormState;
}) {
  const canEdit = useCanEdit();
  const { status, setStatus, identity, setIdentity, formDates, setFormDates } = form;

  const uploadDocument = useUploadDriverDocument();
  const [docFile, setDocFile] = React.useState<File | null>(null);
  const [docLabel, setDocLabel] = React.useState("");
  const docInputRef = React.useRef<HTMLInputElement>(null);

  function handleUploadDocument() {
    if (!docFile) return;
    const label = docLabel.trim() || docFile.name;
    uploadDocument.mutate(
      { driverId: driver.id, file: docFile, label },
      {
        onSuccess: () => {
          trackEvent("document_uploaded", {
            file_type: fileTypeForAnalytics(docFile.type),
            size_kb: Math.round(docFile.size / 1024),
            has_custom_label: !!docLabel.trim(),
          });
          toast.success(`Uploaded ${label}`);
          setDocFile(null);
          setDocLabel("");
          if (docInputRef.current) docInputRef.current.value = "";
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to upload document"),
      }
    );
  }

  return (
    <fieldset disabled={!canEdit} className="contents">
      <section className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as DriverStatusValue)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="TERMINATED">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CompanyRosterFields
          company={identity.company}
          roster={identity.roster}
          onCompanyChange={(company) => setIdentity((s) => ({ ...s, company }))}
          onRosterChange={(roster) => setIdentity((s) => ({ ...s, roster }))}
          showRoster={false}
        />
        <div className="space-y-1.5">
          <Label>Client ID</Label>
          <Input
            value={identity.clientId}
            onChange={(e) => setIdentity((s) => ({ ...s, clientId: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={identity.phone} onChange={(e) => setIdentity((s) => ({ ...s, phone: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            value={identity.email}
            onChange={(e) => setIdentity((s) => ({ ...s, email: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Position</Label>
          <Input
            value={identity.position}
            onChange={(e) => setIdentity((s) => ({ ...s, position: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Driver&apos;s License #</Label>
          <Input
            value={identity.driversLicense}
            onChange={(e) => setIdentity((s) => ({ ...s, driversLicense: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>License Class</Label>
          <Input
            value={identity.licenseClass}
            onChange={(e) => setIdentity((s) => ({ ...s, licenseClass: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Endorsements</Label>
          <Input
            value={identity.endorsements}
            onChange={(e) => setIdentity((s) => ({ ...s, endorsements: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Restrictions</Label>
          <Input
            value={identity.restrictions}
            onChange={(e) => setIdentity((s) => ({ ...s, restrictions: e.target.value }))}
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Update Result</Label>
          <Input
            value={identity.updateResult}
            onChange={(e) => setIdentity((s) => ({ ...s, updateResult: e.target.value }))}
            placeholder="e.g. COMPLETE FILE"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Note</Label>
          <Input value={identity.note} onChange={(e) => setIdentity((s) => ({ ...s, note: e.target.value }))} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900">Compliance Form Dates</h3>
        <div className="grid grid-cols-1 gap-3">
          {formFieldDefs.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 p-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900">{f.label}</p>
                <p className="text-xs text-neutral-400 truncate">{f.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ComplianceBadge
                  date={formDates[f.key] ? new Date(formDates[f.key]).toISOString() : null}
                  compact
                />
                <Input
                  type="date"
                  value={formDates[f.key] ?? ""}
                  onChange={(e) => setFormDates((s) => ({ ...s, [f.key]: e.target.value }))}
                  className="w-[150px]"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900">Documents</h3>

        {driver.documents.length > 0 && (
          <ul className="flex flex-col gap-2">
            {driver.documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 p-2.5"
              >
                <a
                  href={`/api/drivers/${driver.id}/documents/${doc.id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-2.5 hover:opacity-80"
                >
                  {doc.contentType?.startsWith("image/") ? (
                    <ImageIcon className="size-5 shrink-0 text-neutral-400" />
                  ) : (
                    <FileText className="size-5 shrink-0 text-neutral-400" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">{doc.label}</p>
                    <p className="truncate text-xs text-neutral-400">
                      {doc.filename} · {formatBytes(doc.size)} ·{" "}
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => form.handleDeleteDocument(doc.id, doc.label)}
                  disabled={form.isDeletingDocument}
                  title="Delete document"
                  className="size-8 shrink-0 text-neutral-400 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-200 p-2.5">
            <label
              htmlFor="driver-doc-input"
              className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
            >
              <Paperclip className="size-4" />
              {docFile ? docFile.name : "Choose file"}
            </label>
            <input
              id="driver-doc-input"
              ref={docInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            />
            <Input
              placeholder="Label (e.g. DS-703 signed)"
              value={docLabel}
              onChange={(e) => setDocLabel(e.target.value)}
              className="h-8 flex-1 text-sm"
            />
            <Button
              size="sm"
              onClick={handleUploadDocument}
              disabled={!docFile || uploadDocument.isPending}
              className="h-8 shrink-0"
            >
              {uploadDocument.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <UploadCloud className="size-3.5" />}
              Upload
            </Button>
          </div>
        )}
      </section>
    </fieldset>
  );
}
