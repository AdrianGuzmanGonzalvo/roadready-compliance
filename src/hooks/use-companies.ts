"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompanyDTO, RosterDTO } from "@/types/company";

const COMPANIES_KEY = ["companies"] as const;

async function fetchCompanies(): Promise<CompanyDTO[]> {
  const res = await fetch("/api/companies");
  if (!res.ok) throw new Error("Failed to load companies");
  const data = await res.json();
  return data.companies;
}

export function useCompanies() {
  return useQuery({ queryKey: COMPANIES_KEY, queryFn: fetchCompanies });
}

export interface CreateCompanyPayload {
  name: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  rosters?: string[];
}

async function createCompany(payload: CreateCompanyPayload): Promise<CompanyDTO> {
  const res = await fetch("/api/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create company");
  return data.company;
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMPANIES_KEY }),
  });
}

export interface UpdateCompanyPayload {
  id: string;
  name?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

async function updateCompany({ id, ...body }: UpdateCompanyPayload): Promise<CompanyDTO> {
  const res = await fetch(`/api/companies/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update company");
  return data.company;
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompany,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMPANIES_KEY }),
  });
}

async function deleteCompany(id: string): Promise<void> {
  const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete company");
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMPANIES_KEY }),
  });
}

async function createRoster({ companyId, name, notes }: { companyId: string; name: string; notes?: string }): Promise<RosterDTO> {
  const res = await fetch(`/api/companies/${companyId}/rosters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add roster");
  return data.roster;
}

export function useCreateRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRoster,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMPANIES_KEY }),
  });
}

async function updateRoster({ id, ...body }: { id: string; name?: string; notes?: string }): Promise<RosterDTO> {
  const res = await fetch(`/api/rosters/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update roster");
  return data.roster;
}

export function useUpdateRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRoster,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMPANIES_KEY }),
  });
}

async function deleteRoster(id: string): Promise<void> {
  const res = await fetch(`/api/rosters/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete roster");
}

export function useDeleteRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRoster,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMPANIES_KEY }),
  });
}
