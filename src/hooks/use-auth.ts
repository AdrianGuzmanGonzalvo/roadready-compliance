"use client";

import { useQuery } from "@tanstack/react-query";
import type { SessionUserDTO } from "@/types/user";

async function fetchCurrentUser(): Promise<SessionUserDTO> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) throw new Error("Not signed in");
  return res.json();
}

export function useCurrentUser() {
  return useQuery({ queryKey: ["current-user"], queryFn: fetchCurrentUser });
}
