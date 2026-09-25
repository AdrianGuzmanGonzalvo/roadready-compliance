"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LayoutGrid, Users, Building2, UploadCloud, FileBarChart, FileText, Settings, ShieldCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useCanEdit } from "@/hooks/use-auth";
import { resetAnalytics, trackEvent } from "@/lib/analytics";

const navItems = [
  { href: "/dashboard-new", label: "Dashboard", icon: LayoutGrid, badge: "NEW" },
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/drivers?status=ALL", label: "Drivers", icon: Users, match: "/drivers" },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/reports", label: "Reports", icon: FileBarChart, match: "/reports" },
  { href: "/forms", label: "Forms", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const setUploadOpen = useUIStore((s) => s.setUploadOpen);
  const canEdit = useCanEdit();

  async function handleLogout() {
    trackEvent("user_logged_out", { location: "sidebar" });
    await fetch("/api/auth/logout", { method: "POST" });
    resetAnalytics();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white print:hidden sticky top-0 h-screen overflow-y-auto">
      <div className="flex items-center gap-2 px-5 h-14 border-b border-neutral-100">
        <ShieldCheck className="size-5 text-blue-600" />
        <span className="font-semibold text-neutral-900 text-sm leading-tight">
          RoadReady
          <span className="block text-[11px] font-normal text-neutral-400">19-A Compliance</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.match ? pathname.startsWith(item.match) : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-blue-600 text-white" : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <Icon className="size-4" />
              {item.label}
              {item.badge && (
                <span className="ml-auto rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {canEdit && (
          <button
            onClick={() => {
              trackEvent("modal_opened", { modal: "upload_excel", location: "sidebar" });
              setUploadOpen(true);
            }}
            className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <UploadCloud className="size-4" />
            Upload Excel
          </button>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-neutral-100 space-y-1">
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
