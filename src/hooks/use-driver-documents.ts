"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DocumentDTO } from "@/types/driver";
import { useCurrentUser } from "@/hooks/use-auth";

export function useUploadDriverDocument() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  return useMutation({
    mutationFn: async ({ driverId, file, label }: { driverId: string; file: File; label: string }) => {
      if (!currentUser) throw new Error("Not signed in");

      const uploadRes = await fetch(
        `/api/drivers/${driverId}/documents/upload?filename=${encodeURIComponent(file.name)}`,
        { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file }
      );
      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to upload document");
      }
      const { pathname } = (await uploadRes.json()) as { pathname: string };

      const res = await fetch(`/api/drivers/${driverId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          filename: file.name,
          pathname,
          contentType: file.type || null,
          size: file.size,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to save document");
      }
      const data = await res.json();
      return data.document as DocumentDTO;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

export function useDeleteDriverDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ driverId, documentId }: { driverId: string; documentId: string }) => {
      const res = await fetch(`/api/drivers/${driverId}/documents/${documentId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete document");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drivers"] }),
  });
}
