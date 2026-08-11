"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanies } from "@/hooks/use-companies";

const NONE = "__none__";

export function CompanyRosterFields({
  company,
  roster,
  onCompanyChange,
  onRosterChange,
}: {
  company: string;
  roster: string;
  onCompanyChange: (company: string) => void;
  onRosterChange: (roster: string) => void;
}) {
  const { data: companies } = useCompanies();

  const selectedCompany = companies?.find((c) => c.name === company);
  // Keep whatever roster is already set (even if it doesn't belong to the managed company) visible as an option.
  const rosterOptions = selectedCompany
    ? Array.from(new Set([...selectedCompany.rosters.map((r) => r.name), ...(roster ? [roster] : [])]))
    : roster
      ? [roster]
      : [];

  function handleCompanyChange(value: string) {
    const next = value === NONE ? "" : value;
    onCompanyChange(next);
    onRosterChange("");
  }

  return (
    <>
      <div className="space-y-1.5">
        <Label>Company</Label>
        <Select value={company || NONE} onValueChange={handleCompanyChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>— None —</SelectItem>
            {companies?.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
            {company && !companies?.some((c) => c.name === company) && (
              <SelectItem value={company}>{company} (unmanaged)</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Roster</Label>
        <Select value={roster || NONE} onValueChange={(v) => onRosterChange(v === NONE ? "" : v)} disabled={!company}>
          <SelectTrigger>
            <SelectValue placeholder={company ? "Select a roster" : "Select a company first"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>— None —</SelectItem>
            {rosterOptions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
