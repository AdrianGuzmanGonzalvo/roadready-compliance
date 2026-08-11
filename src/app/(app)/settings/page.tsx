"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDrivers } from "@/hooks/use-drivers";
import { useCurrentUser } from "@/hooks/use-auth";

export default function SettingsPage() {
  const router = useRouter();
  const { data: drivers } = useDrivers();
  const { data: user } = useCurrentUser();

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
            Signed in as <span className="font-medium text-neutral-900">{user?.username ?? "—"}</span>
          </p>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            Sign out
          </Button>
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
    </div>
  );
}
