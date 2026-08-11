export interface RosterDTO {
  id: string;
  name: string;
  companyId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDTO {
  id: string;
  name: string;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  rosters: RosterDTO[];
}
