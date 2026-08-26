"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";
import type { UserDTO, UserRole } from "@/types/user";

export function UserDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserDTO | null;
}) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isEditing = !!user;
  const pending = createUser.isPending || updateUser.isPending;

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("USER");

  React.useEffect(() => {
    if (!open) return;
    setUsername(user?.username ?? "");
    setPassword("");
    setConfirmPassword("");
    setRole(user?.role ?? "USER");
  }, [open, user]);

  const passwordMismatch = password.length > 0 && password !== confirmPassword;
  const canSave = isEditing
    ? username.trim().length > 0 && !passwordMismatch && (password.length === 0 || password.length >= 4)
    : username.trim().length > 0 && password.length >= 4 && !passwordMismatch;

  function handleSave() {
    if (!canSave) return;

    if (isEditing) {
      updateUser.mutate(
        { id: user.id, username: username.trim(), role, ...(password ? { password } : {}) },
        {
          onSuccess: () => {
            toast.success(`Updated ${username}`);
            onOpenChange(false);
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update user"),
        }
      );
    } else {
      createUser.mutate(
        { username: username.trim(), password, role },
        {
          onSuccess: () => {
            toast.success(`Added user ${username}`);
            onOpenChange(false);
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create user"),
        }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the username or set a new password. Leave password blank to keep it unchanged."
              : "Create a new login for this site."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label>{isEditing ? "New Password (optional)" : "Password"}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {passwordMismatch && <p className="text-xs text-red-600">Passwords don&apos;t match.</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave || pending}>
            {pending ? "Saving..." : isEditing ? "Save Changes" : "Add User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
