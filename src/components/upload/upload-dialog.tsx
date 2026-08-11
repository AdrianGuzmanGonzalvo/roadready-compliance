"use client";

import * as React from "react";
import { toast } from "sonner";
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { useImportDrivers } from "@/hooks/use-drivers";

export function UploadDialog() {
  const open = useUIStore((s) => s.uploadOpen);
  const setOpen = useUIStore((s) => s.setUploadOpen);
  const importDrivers = useImportDrivers();
  const [file, setFile] = React.useState<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleImport() {
    if (!file) return;
    importDrivers.mutate(file, {
      onSuccess: (result) => {
        toast.success(`Imported ${result.total} driver record(s)`, {
          description: `${result.created} created · ${result.updated} updated${
            result.warnings.length ? ` · ${result.warnings.length} warning(s)` : ""
          }`,
        });
        result.warnings.forEach((w) => toast.warning(w));
        reset();
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Import failed");
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Driver List</DialogTitle>
          <DialogDescription>
            Upload the 19-A driver roster (.xlsx) with <code>PRIME</code>, <code>Active</code>, and{" "}
            <code>Terminated</code> sheets. Existing drivers are matched by name and updated; new drivers are
            created.
          </DialogDescription>
        </DialogHeader>

        <label
          htmlFor="driver-file-input"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 p-8 text-center transition-colors hover:border-neutral-300"
        >
          {file ? (
            <>
              <FileSpreadsheet className="size-8 text-emerald-600" />
              <p className="text-sm font-medium text-neutral-900">{file.name}</p>
              <p className="text-xs text-neutral-400">{(file.size / 1024).toFixed(0)} KB · click to change</p>
            </>
          ) : (
            <>
              <UploadCloud className="size-8 text-neutral-400" />
              <p className="text-sm font-medium text-neutral-700">Click to select an .xlsx file</p>
              <p className="text-xs text-neutral-400">or drag and drop</p>
            </>
          )}
          <input
            id="driver-file-input"
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || importDrivers.isPending}>
            {importDrivers.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
