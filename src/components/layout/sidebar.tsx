"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, Users, UserMinus, UserX, UploadCloud, FileBarChart, FileText, Settings, ShieldCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/drivers?status=ACTIVE", label: "Active Drivers", icon: Users, match: "/drivers", status: "ACTIVE" },
  {
    href: "/drivers?status=INACTIVE",
    label: "Inactive Drivers",
    icon: UserMinus,
    match: "/drivers",
    status: "INACTIVE",
  },
  {
    href: "/drivers?status=TERMINATED",
    label: "Terminated Drivers",
    icon: UserX,
    match: "/drivers",
    status: "TERMINATED",
  },
  { href: "/reports", label: "Reports", icon: FileBarChart, match: "/reports" },
  { href: "/forms", label: "Forms", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const setUploadOpen = useUIStore((s) => s.setUploadOpen);
  const currentStatus = searchParams.get("status");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-2 px-5 h-14 border-b border-neutral-100">
        <ShieldCheck className="size-5 text-neutral-900" />
        <span className="font-semibold text-neutral-900 text-sm leading-tight">
          RoadReady
          <span className="block text-[11px] font-normal text-neutral-400">19-A Compliance</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.match
            ? pathname.startsWith(item.match) && ("status" in item ? currentStatus === item.status : true)
            : pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}

        <button
          onClick={() => setUploadOpen(true)}
          className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <UploadCloud className="size-4" />
          Upload Excel
        </button>
      </nav>

      <div className="px-3 py-4 border-t border-neutral-100 space-y-1">
        <button
          onClick={() => router.push("/drivers?status=ALL")}
          className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-xs text-neutral-400 hover:bg-neutral-100 transition-colors"
        >
          View all records
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
