"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserDTO, UserRole } from "@/types/user";

const USERS_KEY = ["users"] as const;

async function fetchUsers(): Promise<UserDTO[]> {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to load users");
  const data = await res.json();
  return data.users;
}

export function useUsers(options?: { enabled?: boolean }) {
  return useQuery({ queryKey: USERS_KEY, queryFn: fetchUsers, enabled: options?.enabled ?? true });
}

async function createUser(payload: { username: string; password: string; role: UserRole }): Promise<UserDTO> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create user");
  return data.user;
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

async function updateUser({
  id,
  ...body
}: {
  id: string;
  username?: string;
  password?: string;
  role?: UserRole;
}): Promise<UserDTO> {
  const res = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update user");
  return data.user;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });
}

async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to delete user");
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
