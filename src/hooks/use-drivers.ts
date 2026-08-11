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
