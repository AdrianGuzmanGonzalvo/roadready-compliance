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

/** Roles that can view everything but never create, update, or delete anything — keep in sync with src/lib/auth.ts. */
const READ_ONLY_ROLES = new Set(["DEMO", "SIMPLE_USER"]);

/** False for a read-only (Demo/Simple User) account, or while the current user hasn't loaded yet. */
export function useCanEdit(): boolean {
  const { data: currentUser } = useCurrentUser();
  return !!currentUser && !READ_ONLY_ROLES.has(currentUser.role);
}
