import { create } from "zustand";
import type { FormFieldKey } from "@/types/driver";

export type StatusTab = "ACTIVE" | "TERMINATED" | "ALL";
export type WindowFilter = "ALL" | "expired" | "30" | "60";

interface UIState {
  search: string;
  setSearch: (value: string) => void;

  statusTab: StatusTab;
  setStatusTab: (tab: StatusTab) => void;

  formFilter: FormFieldKey | "ALL";
  setFormFilter: (key: FormFieldKey | "ALL") => void;

  windowFilter: WindowFilter;
  setWindowFilter: (w: WindowFilter) => void;

  selectedDriverId: string | null;
  openDriver: (id: string) => void;
  closeDriver: () => void;

  uploadOpen: boolean;
  setUploadOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  search: "",
  setSearch: (search) => set({ search }),

  statusTab: "ACTIVE",
  setStatusTab: (statusTab) => set({ statusTab }),

  formFilter: "ALL",
  setFormFilter: (formFilter) => set({ formFilter }),

  windowFilter: "ALL",
  setWindowFilter: (windowFilter) => set({ windowFilter }),

  selectedDriverId: null,
  openDriver: (id) => set({ selectedDriverId: id }),
  closeDriver: () => set({ selectedDriverId: null }),

  uploadOpen: false,
  setUploadOpen: (uploadOpen) => set({ uploadOpen }),
}));
