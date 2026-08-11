"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDrivers } from "@/hooks/use-drivers";
import { useCurrentUser } from "@/hooks/use-auth";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { UserDialog } from "@/components/settings/user-dialog";
import type { UserDTO } from "@/types/user";

export default function SettingsPage() {
  const router = useRouter();
  const { data: drivers } = useDrivers();
  const { data: currentUser } = useCurrentUser();
  const { data: users } = useUsers();
  const deleteUser = useDeleteUser();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserDTO | null>(null);

  function openAddDialog() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEditDialog(user: UserDTO) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  function handleDelete(user: UserDTO) {
    if (!window.confirm(`Delete user "${user.username}"? They'll immediately lose access.`)) return;
    deleteUser.mutate(user.id, {
      onSuccess: () => toast.success(`Deleted ${user.username}`),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete user"),
    });
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500">Account and application settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900">Account</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-600 space-y-3">
          <p>
            Signed in as <span className="font-medium text-neutral-900">{currentUser?.username ?? "—"}</span>
          </p>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-semibold text-neutral-900">Users</CardTitle>
            <p className="text-xs text-neutral-400">Who can sign in to this site.</p>
          </div>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="size-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-neutral-100">
            {users?.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {u.username}
                    {u.id === currentUser?.id && <span className="ml-1.5 text-xs text-neutral-400">(you)</span>}
                  </p>
                  <p className="text-xs text-neutral-400">Added {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(u)} title="Edit user">
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(u)}
                    title="Delete user"
                    disabled={(users?.length ?? 0) <= 1}
                    className="text-neutral-400 hover:text-red-600 disabled:hover:text-neutral-400"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900">Database</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-600 space-y-1">
          <p>Storage: SQLite via Prisma ORM</p>
          <p>Records: {drivers?.length ?? "—"} drivers</p>
        </CardContent>
      </Card>

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editingUser} />
    </div>
  );
}
