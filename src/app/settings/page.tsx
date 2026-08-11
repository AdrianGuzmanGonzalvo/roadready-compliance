"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDrivers } from "@/hooks/use-drivers";
import { FORM_FIELD_DEFS } from "@/types/driver";

export default function SettingsPage() {
  const { data: drivers } = useDrivers();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500">About this compliance tracker.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900">Database</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-600 space-y-1">
          <p>Storage: SQLite via Prisma ORM</p>
          <p>Records: {drivers?.length ?? "—"} drivers</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900">Tracked Compliance Forms</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-600">
          <ul className="grid grid-cols-2 gap-1.5">
            {FORM_FIELD_DEFS.map((f) => (
              <li key={f.key}>
                <span className="font-medium text-neutral-800">{f.label}</span> — {f.description}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900">Color Legend</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm text-neutral-600">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-500" /> Expired</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-500" /> 1–30 days</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-orange-500" /> 31–60 days</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-500" /> 60+ days (compliant)</span>
        </CardContent>
      </Card>
    </div>
  );
}
