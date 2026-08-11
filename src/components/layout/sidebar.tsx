"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, UserX, UploadCloud, Settings, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/drivers?status=ACTIVE", label: "Active Drivers", icon: Users, match: "/drivers", statusParam: "ACTIVE" },
  {
    href: "/drivers?status=TERMINATED",
    label: "Terminated Drivers",
    icon: UserX,
    match: "/drivers",
    statusParam: "TERMINATED",
  },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const setUploadOpen = useUIStore((s) => s.setUploadOpen);

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
          const active = item.match ? pathname === item.match : pathname === item.href;
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

      <div className="px-3 py-4 border-t border-neutral-100">
        <button
          onClick={() => router.push("/drivers?status=ALL")}
          className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-xs text-neutral-400 hover:bg-neutral-100 transition-colors"
        >
          View all records
        </button>
      </div>
    </aside>
  );
}
