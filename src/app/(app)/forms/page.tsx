"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useFormFieldDefs } from "@/hooks/use-form-labels";

export default function FormsPage() {
  const formFieldDefs = useFormFieldDefs();
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Forms</h1>
        <p className="text-sm text-neutral-500">Reference for the tracked Article 19-A compliance forms.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900">Tracked Compliance Forms</CardTitle>
          <p className="text-xs text-neutral-400">
            NYS Article 19-A Driver Qualification Record forms, official names, and renewal frequency.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form</TableHead>
                <TableHead>Official Name</TableHead>
                <TableHead>Renewal Frequency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formFieldDefs.map((f) => (
                <TableRow key={f.key}>
                  <TableCell className="font-medium text-neutral-900 whitespace-nowrap">{f.label}</TableCell>
                  <TableCell className="text-neutral-700 whitespace-normal">{f.description}</TableCell>
                  <TableCell className="text-neutral-500 whitespace-normal">{f.frequency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="px-4 py-3 text-xs text-neutral-400 border-t border-neutral-100">
            <span className="font-medium text-neutral-600">Update Result</span> — Driver File Compliance Status.
            Dynamic/continuous internal tracking of overall file status (e.g. complete vs. inactive/out of work),
            not tied to a single expiration date. Edit it from the driver detail drawer.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900">Color Legend</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm text-neutral-600">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500" /> Expired
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-500" /> 1–30 days
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-orange-500" /> 31–60 days
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" /> 60+ days (compliant)
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
