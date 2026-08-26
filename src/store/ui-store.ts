import { create } from "zustand";

export type StatusTab = "ACTIVE" | "INACTIVE" | "TERMINATED" | "ALL";
export type WindowFilter = "ALL" | "expired" | "30" | "60";

interface UIState {
  search: string;
  setSearch: (value: string) => void;

  statusTab: StatusTab;
  setStatusTab: (tab: StatusTab) => void;

  formFilter: string;
  setFormFilter: (key: string) => void;

  /** Global scope applied to the Dashboard, Reports, and Drivers list. "ALL" means unrestricted. */
  companyFilter: string;
  setCompanyFilter: (company: string) => void;
  rosterFilter: string;
  setRosterFilter: (roster: string) => void;

  windowFilter: WindowFilter;
  setWindowFilter: (w: WindowFilter) => void;

  selectedDriverId: string | null;
  openDriver: (id: string) => void;
  closeDriver: () => void;

  uploadOpen: boolean;
  setUploadOpen: (open: boolean) => void;

  addDriverOpen: boolean;
  setAddDriverOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  search: "",
  setSearch: (search) => set({ search }),

  statusTab: "ACTIVE",
  setStatusTab: (statusTab) => set({ statusTab }),

  formFilter: "ALL",
  setFormFilter: (formFilter) => set({ formFilter }),

  companyFilter: "ALL",
  setCompanyFilter: (companyFilter) => set({ companyFilter, rosterFilter: "ALL" }),
  rosterFilter: "ALL",
  setRosterFilter: (rosterFilter) => set({ rosterFilter }),

  windowFilter: "ALL",
  setWindowFilter: (windowFilter) => set({ windowFilter }),

  selectedDriverId: null,
  openDriver: (id) => set({ selectedDriverId: id }),
  closeDriver: () => set({ selectedDriverId: null }),

  uploadOpen: false,
  setUploadOpen: (uploadOpen) => set({ uploadOpen }),

  addDriverOpen: false,
  setAddDriverOpen: (addDriverOpen) => set({ addDriverOpen }),
}));
