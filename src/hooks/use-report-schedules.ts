"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReportScheduleDTO, ReportScheduleFrequency } from "@/types/report-schedule";

async function fetchSchedules(): Promise<ReportScheduleDTO[]> {
  const res = await fetch("/api/report-schedules");
  if (!res.ok) throw new Error("Failed to load report schedules");
  const data = await res.json();
  return data.schedules;
}

export function useReportSchedules(options?: { enabled?: boolean }) {
  return useQuery({ queryKey: ["report-schedules"], queryFn: fetchSchedules, enabled: options?.enabled ?? true });
}

export interface CreateScheduleInput {
  recipients: string;
  frequency: ReportScheduleFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  companyFilter?: string;
  rosterFilter?: string;
}

export function useCreateReportSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateScheduleInput) => {
      const res = await fetch("/api/report-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create schedule");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["report-schedules"] }),
  });
}

export function useToggleReportSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/report-schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update schedule");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["report-schedules"] }),
  });
}

export function useDeleteReportSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/report-schedules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete schedule");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["report-schedules"] }),
  });
}
