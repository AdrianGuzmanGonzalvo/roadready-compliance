"use client";

import { useQuery } from "@tanstack/react-query";

interface CurrentUser {
  username: string;
  createdAt: string;
}

async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) throw new Error("Not signed in");
  return res.json();
}

export function useCurrentUser() {
  return useQuery({ queryKey: ["current-user"], queryFn: fetchCurrentUser });
}
