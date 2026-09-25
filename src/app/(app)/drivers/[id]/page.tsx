"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DriverStatusBadge } from "@/components/drivers/compliance-badge";
import { DriverFormFields } from "@/components/drivers/driver-form-fields";
import { DriverFormActions } from "@/components/drivers/driver-form-actions";
import { useDrivers } from "@/hooks/use-drivers";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import { useDriverForm } from "@/hooks/use-driver-form";
import { trackEvent } from "@/lib/analytics";
import type { DriverDTO } from "@/types/driver";

function DriverDetailBody({ driver }: { driver: DriverDTO }) {
  const router = useRouter();
  const formFieldDefs = useFormFieldDefs();
  const form = useDriverForm(driver, formFieldDefs, () => router.push("/drivers"), "driver_detail_page");

  return (
    <div className="flex flex-col gap-6 max-w-[900px]">
      <Link
        href="/drivers"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="size-4" />
        Back to Drivers
      </Link>

      <div className="flex flex-col gap-1.5 border-b border-neutral-100 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-neutral-900">
            {driver.lastName}, {driver.firstName}
          </h1>
          <DriverStatusBadge status={driver.status} />
        </div>
        <p className="text-sm text-neutral-500">
          {driver.position ?? "Driver"} · License {driver.driversLicense ?? "—"} · SSN {driver.ssn ?? "—"}
          {(driver.company || driver.roster) && (
            <>
              {" "}
              · {driver.company ?? "—"}
              {driver.roster ? ` / ${driver.roster}` : ""}
            </>
          )}
        </p>
        <Button variant="outline" size="sm" asChild className="mt-1 w-fit">
          <a
            href={`/api/drivers/${driver.id}/forms`}
            download
            onClick={() => trackEvent("package_form_downloaded", {})}
          >
            <FileText className="size-4" />
            19A Package Form
          </a>
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        <DriverFormFields driver={driver} formFieldDefs={formFieldDefs} form={form} />
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-4">
        <DriverFormActions form={form} onCancel={() => router.push("/drivers")} />
      </div>
    </div>
  );
}

export default function DriverDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: drivers, isLoading, isError } = useDrivers();
  const driver = drivers?.find((d) => d.id === params.id) ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-400 text-sm py-12 justify-center">
        <Loader2 className="size-4 animate-spin" />
        Loading driver...
      </div>
    );
  }

  if (isError || !driver) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-neutral-500">Driver not found.</p>
        <Button variant="outline" asChild>
          <Link href="/drivers">Back to Drivers</Link>
        </Button>
      </div>
    );
  }

  return <DriverDetailBody key={driver.id} driver={driver} />;
}
