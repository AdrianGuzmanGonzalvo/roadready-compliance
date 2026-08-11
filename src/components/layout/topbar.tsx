"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, UploadCloud, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { useDrivers } from "@/hooks/use-drivers";
import { overallStatus } from "@/lib/compliance";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const search = useUIStore((s) => s.search);
  const setSearch = useUIStore((s) => s.setSearch);
  const setUploadOpen = useUIStore((s) => s.setUploadOpen);
  const { data: drivers } = useDrivers();

  const expiredCount =
    drivers?.filter((d) => d.status === "ACTIVE" && overallStatus(d.complianceForm) === "expired").length ?? 0;

  function handleSearchChange(value: string) {
    setSearch(value);
    if (pathname !== "/drivers") router.push("/drivers?status=ALL");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name, license #, or phone..."
          className="pl-8"
        />
      </div>

      <div className="flex-1" />

      {expiredCount > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
          <AlertTriangle className="size-3.5" />
          {expiredCount} active driver{expiredCount === 1 ? "" : "s"} with expired forms
        </div>
      )}

      <Button size="sm" onClick={() => setUploadOpen(true)}>
        <UploadCloud className="size-4" />
        Upload New Excel
      </Button>
    </header>
  );
}
