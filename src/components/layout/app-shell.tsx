"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { UploadDialog } from "@/components/upload/upload-dialog";
import { DriverDrawer } from "@/components/drivers/driver-drawer";
import { cn } from "@/lib/utils";

const mobileNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/drivers?status=ACTIVE", label: "Drivers", icon: Users, match: "/drivers" },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <nav className="flex md:hidden items-center justify-around border-b border-neutral-200 bg-white h-12">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const active = item.match ? pathname === item.match : pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 text-[10px] font-medium",
                  active ? "text-neutral-900" : "text-neutral-400"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      <UploadDialog />
      <DriverDrawer />
    </div>
  );
}
