"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ComplianceFormDTO, DriverDTO, DriverStatusValue } from "@/types/driver";

const DRIVERS_KEY = ["drivers"] as const;

async function fetchDrivers(): Promise<DriverDTO[]> {
  const res = await fetch("/api/drivers");
  if (!res.ok) throw new Error("Failed to load drivers");
  const data = await res.json();
  return data.drivers;
}

export function useDrivers() {
  return useQuery({ queryKey: DRIVERS_KEY, queryFn: fetchDrivers });
}

export interface UpdateDriverPayload {
  id: string;
  driver?: Partial<
    Pick<
      DriverDTO,
      | "pfl"
      | "clientId"
      | "company"
      | "roster"
      | "lastName"
      | "firstName"
      | "phone"
      | "position"
      | "driversLicense"
      | "ssn"
      | "dob"
      | "licenseClass"
      | "endorsements"
      | "restrictions"
      | "updateResult"
      | "note"
      | "medicalCondition"
      | "bpFollowUp"
      | "diabeticFollowUp"
    > & { status: DriverStatusValue }
  >;
  form?: Partial<ComplianceFormDTO>;
}

async function updateDriver(payload: UpdateDriverPayload): Promise<DriverDTO> {
  const res = await fetch(`/api/drivers/${payload.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driver: payload.driver, form: payload.form }),
  });
  if (!res.ok) throw new Error("Failed to update driver");
  const data = await res.json();
  return data.driver;
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVERS_KEY });
    },
  });
}

export interface CreateDriverPayload {
  lastName: string;
  firstName: string;
  status: DriverStatusValue;
  clientId?: string;
  company?: string;
  roster?: string;
  phone?: string;
  position?: string;
  driversLicense?: string;
  licenseClass?: string;
  endorsements?: string;
  restrictions?: string;
  note?: string;
}

async function createDriver(payload: CreateDriverPayload): Promise<DriverDTO> {
  const res = await fetch("/api/drivers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create driver");
  return data.driver;
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVERS_KEY });
    },
  });
}

async function deleteDriver(id: string): Promise<void> {
  const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete driver");
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVERS_KEY });
    },
  });
}

async function deleteDrivers(ids: string[]): Promise<void> {
  const results = await Promise.all(
    ids.map((id) => fetch(`/api/drivers/${id}`, { method: "DELETE" }).then((res) => res.ok))
  );
  if (results.some((ok) => !ok)) throw new Error("Some drivers failed to delete");
}

export function useDeleteDrivers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDrivers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVERS_KEY });
    },
  });
}

export interface BulkAssignCompanyRosterPayload {
  ids: string[];
  company: string;
  roster: string;
}

async function bulkAssignCompanyRoster({ ids, company, roster }: BulkAssignCompanyRosterPayload): Promise<void> {
  const results = await Promise.all(
    ids.map((id) =>
      fetch(`/api/drivers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver: { company, roster } }),
      }).then((res) => res.ok)
    )
  );
  if (results.some((ok) => !ok)) throw new Error("Some drivers failed to update");
}

export function useBulkAssignCompanyRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkAssignCompanyRoster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVERS_KEY });
    },
  });
}

export interface ImportResponse {
  created: number;
  updated: number;
  total: number;
  sheetsFound: string[];
  warnings: string[];
}

async function importWorkbook(file: File): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/drivers/import", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Import failed");
  return data;
}

export function useImportDrivers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importWorkbook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVERS_KEY });
    },
  });
}
