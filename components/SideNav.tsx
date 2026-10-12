"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Briefcase, Building2, LayoutDashboard, MessageSquare, Search, UserRound, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { cx } from "./ui";

export function SideNav() {
  const pathname = usePathname();
  const { currentUser } = useStore();
  const worker = currentUser?.role === "worker";
  const items = worker
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/profile", label: "My profile", icon: UserRound },
        { href: "/jobs", label: "Find jobs", icon: Briefcase },
        { href: "/network", label: "Network", icon: Users },
        { href: "/messages", label: "Messages", icon: MessageSquare },
        { href: "/saved", label: "Saved jobs", icon: Bookmark },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/jobs", label: "Jobs", icon: Briefcase },
        { href: "/network", label: "Candidates", icon: Search },
        { href: "/company", label: "Company", icon: Building2 },
        { href: "/messages", label: "Messages", icon: MessageSquare },
        { href: "/saved", label: "Saved pros", icon: Bookmark },
      ];

  return (
    <aside className="h-max rounded-2xl border border-line bg-navy p-3 text-white">
      <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-blue-100/70">
        {worker ? "Your trade" : currentUser?.name ?? "Hiring"}
      </p>
      <nav className="grid gap-1" aria-label="Account">
        {items.map((item) => {
          const Icon = item.icon;
          const on = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                on ? "bg-brand text-white" : "text-blue-100 hover:bg-white/10",
              )}
              aria-current={on ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AccountFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <SideNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
