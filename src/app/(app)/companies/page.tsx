"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Building2, Mail, Phone, MapPin } from "lucide-react";
import { useCompanies, useDeleteCompany } from "@/hooks/use-companies";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyDialog } from "@/components/companies/company-dialog";
import { RosterManager } from "@/components/companies/roster-manager";
import type { CompanyDTO } from "@/types/company";

export default function CompaniesPage() {
  const { data: companies, isLoading, isError } = useCompanies();
  const deleteCompany = useDeleteCompany();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCompany, setEditingCompany] = React.useState<CompanyDTO | null>(null);

  function openAddDialog() {
    setEditingCompany(null);
    setDialogOpen(true);
  }

  function openEditDialog(company: CompanyDTO) {
    setEditingCompany(company);
    setDialogOpen(true);
  }

  function handleDelete(company: CompanyDTO) {
    const driverWarning =
      company.rosters.length > 0
        ? ` This will also remove its ${company.rosters.length} roster(s).`
        : "";
    if (!window.confirm(`Delete "${company.name}"?${driverWarning} Drivers already assigned to it keep their text values.`)) {
      return;
    }
    deleteCompany.mutate(company.id, {
      onSuccess: () => toast.success(`Deleted ${company.name}`),
      onError: () => toast.error("Failed to delete company"),
    });
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1000px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Companies</h1>
          <p className="text-sm text-neutral-500">
            Manage companies and their rosters. These populate the Company/Roster dropdowns when assigning drivers.
          </p>
        </div>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="size-4" />
          Add Company
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-neutral-400 text-sm py-12 justify-center">
          <Loader2 className="size-4 animate-spin" />
          Loading companies...
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load companies.
        </div>
      )}

      {companies && companies.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Building2 className="size-8 text-neutral-300" />
            <p className="text-sm text-neutral-500">No companies yet.</p>
            <Button size="sm" variant="outline" onClick={openAddDialog}>
              <Plus className="size-4" />
              Add your first company
            </Button>
          </CardContent>
        </Card>
      )}

      {companies && companies.length > 0 && (
        <div className="flex flex-col gap-3">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-neutral-900">{company.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                      {company.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {company.address}
                        </span>
                      )}
                      {company.contactName && <span>{company.contactName}</span>}
                      {company.contactPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" />
                          {company.contactPhone}
                        </span>
                      )}
                      {company.contactEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" />
                          {company.contactEmail}
                        </span>
                      )}
                    </div>
                    {company.notes && <p className="mt-1 text-xs text-neutral-400">{company.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(company)} title="Edit company">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(company)}
                      title="Delete company"
                      className="text-neutral-400 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium text-neutral-500">Rosters</p>
                  <RosterManager companyId={company.id} rosters={company.rosters} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CompanyDialog open={dialogOpen} onOpenChange={setDialogOpen} company={editingCompany} />
    </div>
  );
}
