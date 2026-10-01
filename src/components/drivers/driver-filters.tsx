"use client";

import { Search, Download, FileSpreadsheet, UserPlus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore } from "@/store/ui-store";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import { useCanEdit } from "@/hooks/use-auth";
import { formKeyForAnalytics, trackEvent } from "@/lib/analytics";

const STATUS_TABS = [
  { value: "ACTIVE", label: "Active Drivers", short: "Active" },
  { value: "INACTIVE", label: "Inactive Drivers", short: "Inactive" },
  { value: "TERMINATED", label: "Terminated Drivers", short: "Terminated" },
  { value: "ALL", label: "All Records", short: "All" },
];

interface DriverFiltersProps {
  filteredCount: number;
  totalCount: number;
  onExportXlsx: () => void;
  onExportCsv: () => void;
}

export function DriverFilters({ filteredCount, totalCount, onExportXlsx, onExportCsv }: DriverFiltersProps) {
  const statusTab = useUIStore((s) => s.statusTab);
  const setStatusTab = useUIStore((s) => s.setStatusTab);
  const search = useUIStore((s) => s.search);
  const setSearch = useUIStore((s) => s.setSearch);
  const formFilter = useUIStore((s) => s.formFilter);
  const setFormFilter = useUIStore((s) => s.setFormFilter);
  const windowFilter = useUIStore((s) => s.windowFilter);
  const setWindowFilter = useUIStore((s) => s.setWindowFilter);
  const setAddDriverOpen = useUIStore((s) => s.setAddDriverOpen);
  const formFieldDefs = useFormFieldDefs();
  const canEdit = useCanEdit();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={statusTab}
          onValueChange={(v) => {
            trackEvent("filter_changed", { filter: "driver_status_tab", value: v, location: "drivers_list" });
            setStatusTab(v as typeof statusTab);
          }}
          className="w-full sm:w-auto"
        >
          {/* On phones the four tabs share the row with short labels instead of running off the screen. */}
          <TabsList className="grid w-full grid-cols-4 sm:inline-flex sm:w-auto">
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="px-1 text-xs sm:px-3 sm:text-sm">
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExportCsv}>
            <Download className="size-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onExportXlsx}>
            <FileSpreadsheet className="size-4" />
            Excel
          </Button>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => {
                trackEvent("modal_opened", { modal: "add_driver", location: "drivers_toolbar" });
                setAddDriverOpen(true);
              }}
            >
              <UserPlus className="size-4" />
              Add Driver
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, license #, or phone..."
            className="pl-8"
          />
        </div>

        <Select
          value={formFilter}
          onValueChange={(v) => {
            trackEvent("filter_changed", { filter: "form", value: formKeyForAnalytics(v), location: "drivers_list" });
            setFormFilter(v as typeof formFilter);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by form" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Forms</SelectItem>
            {formFieldDefs.map((f) => (
              <SelectItem key={f.key} value={f.key}>
                {f.label} — {f.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={windowFilter}
          onValueChange={(v) => {
            trackEvent("filter_changed", { filter: "expiration_window", value: v, location: "drivers_list" });
            setWindowFilter(v as typeof windowFilter);
          }}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Expiration window" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any Status</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="30">Expiring in 30 Days</SelectItem>
            <SelectItem value="60">Expiring in 60 Days</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-neutral-400">
          Showing {filteredCount} of {totalCount} drivers
        </span>
      </div>
    </div>
  );
}
