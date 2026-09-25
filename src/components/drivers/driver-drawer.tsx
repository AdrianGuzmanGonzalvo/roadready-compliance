"use client";

import { FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DriverStatusBadge } from "@/components/drivers/compliance-badge";
import { DriverFormFields } from "@/components/drivers/driver-form-fields";
import { DriverFormActions } from "@/components/drivers/driver-form-actions";
import { useUIStore } from "@/store/ui-store";
import { useDrivers } from "@/hooks/use-drivers";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import { useDriverForm } from "@/hooks/use-driver-form";
import { trackEvent } from "@/lib/analytics";
import type { DriverDTO } from "@/types/driver";

function DriverDrawerBody({ driver, onClose }: { driver: DriverDTO; onClose: () => void }) {
  const formFieldDefs = useFormFieldDefs();
  const form = useDriverForm(driver, formFieldDefs, onClose);

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <SheetTitle>
            {driver.lastName}, {driver.firstName}
          </SheetTitle>
          <DriverStatusBadge status={driver.status} />
        </div>
        <SheetDescription>
          {driver.position ?? "Driver"} · License {driver.driversLicense ?? "—"} · SSN {driver.ssn ?? "—"}
          {(driver.company || driver.roster) && (
            <>
              {" "}
              · {driver.company ?? "—"}
              {driver.roster ? ` / ${driver.roster}` : ""}
            </>
          )}
        </SheetDescription>

        <Button variant="outline" size="sm" asChild className="w-fit">
          <a
            href={`/api/drivers/${driver.id}/forms`}
            download
            onClick={() => trackEvent("package_form_downloaded", {})}
          >
            <FileText className="size-4" />
            19A Package Form
          </a>
        </Button>
      </SheetHeader>

      <SheetBody className="flex flex-col gap-6 py-4">
        <DriverFormFields driver={driver} formFieldDefs={formFieldDefs} form={form} />
      </SheetBody>

      <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-4">
        <DriverFormActions form={form} onCancel={onClose} />
      </div>
    </>
  );
}

export function DriverDrawer() {
  const selectedDriverId = useUIStore((s) => s.selectedDriverId);
  const closeDriver = useUIStore((s) => s.closeDriver);
  const { data: drivers } = useDrivers();

  const driver = drivers?.find((d) => d.id === selectedDriverId) ?? null;

  return (
    <Sheet open={!!selectedDriverId} onOpenChange={(open) => !open && closeDriver()}>
      <SheetContent className="sm:max-w-lg">
        {driver && <DriverDrawerBody key={driver.id} driver={driver} onClose={closeDriver} />}
      </SheetContent>
    </Sheet>
  );
}
