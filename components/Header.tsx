"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Bell, Bookmark, Briefcase, LayoutDashboard, LogOut, Menu, MessageSquare, Moon, Search, Sun, X } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar, cx } from "./ui";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";

const LINKS = [
  { href: "/network", label: "Network" },
  { href: "/jobs", label: "Jobs" },
  { href: "/projects", label: "Projects" },
  { href: "/groups", label: "Groups" },
  { href: "/resources", label: "Resources" },
  { href: "/pricing", label: "Pricing" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, state, logout, markNotificationsRead, resetDemo } = useStore();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [notes, setNotes] = useState(false);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setOpen(false);
    setMenu(false);
    setNotes(false);
  }, [pathname]);

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }, []);

  const unreadNotes = currentUser
    ? state.notifications.filter((item) => item.userId === currentUser.id && !item.read)
    : [];
  const unreadMessages = currentUser
    ? state.messages.filter((message) => {
        const thread = state.threads.find((item) => item.id === message.threadId);
        return thread?.participantIds.includes(currentUser.id) && message.senderId !== currentUser.id && !message.read;
      }).length
    : 0;

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("tv-theme", next);
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/network?q=${encodeURIComponent(value)}` : "/network");
    setOpen(false);
  }

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" aria-label="TradeVerified home">
          <Logo />
        </Link>
        <form onSubmit={onSearch} className="hidden min-w-0 flex-1 md:block">
          <label className="relative block">
            <span className="sr-only">Search tradespeople</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by trade, skill, city, or name"
              className="w-full rounded-full border border-line bg-soft py-2 pl-9 pr-4 text-sm outline-none focus:border-brand focus:bg-surface"
            />
          </label>
        </form>
        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cx(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                active(link.href) ? "bg-soft text-brand" : "text-muted hover:text-ink",
              )}
              aria-current={active(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button className="grid h-9 w-9 place-items-center rounded-full border border-line" onClick={toggleTheme} aria-label="Toggle color theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {currentUser ? (
            <>
              <Link href="/messages" className="relative hidden h-9 w-9 place-items-center rounded-full border border-line sm:grid" aria-label="Messages">
                <MessageSquare className="h-4 w-4" />
                {unreadMessages > 0 ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{unreadMessages}</span> : null}
              </Link>
              <div className="relative">
                <button
                  className="relative grid h-9 w-9 place-items-center rounded-full border border-line"
                  aria-label="Notifications"
                  onClick={() => {
                    setNotes((value) => !value);
                    setMenu(false);
                    markNotificationsRead();
                  }}
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotes.length > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" /> : null}
                </button>
                {notes ? (
                  <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-line bg-surface p-2 shadow-xl">
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">Notifications</p>
                    {state.notifications.filter((item) => item.userId === currentUser.id).slice(0, 6).length === 0 ? (
                      <p className="px-2 py-4 text-sm text-muted">Nothing new yet.</p>
                    ) : (
                      state.notifications
                        .filter((item) => item.userId === currentUser.id)
                        .slice(0, 6)
                        .map((item) => (
                          <Link key={item.id} href={item.href} className="block rounded-xl px-2 py-2 hover:bg-soft">
                            <span className="block text-sm font-semibold">{item.title}</span>
                            <span className="block text-sm text-muted">{item.body}</span>
                            <span className="text-xs text-muted">{timeAgo(item.createdAt)}</span>
                          </Link>
                        ))
                    )}
                  </div>
                ) : null}
              </div>
              <div className="relative">
                <button className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3" onClick={() => { setMenu((value) => !value); setNotes(false); }}>
                  <Avatar name={currentUser.name} size={28} />
                  <span className="hidden text-left text-sm leading-tight sm:block">
                    <span className="block font-semibold">{currentUser.name.split(" ")[0]}</span>
                    <span className="block text-xs text-muted">{currentUser.role === "employer" ? "Employer" : "Tradesperson"}</span>
                  </span>
                </button>
                {menu ? (
                  <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
                    <MenuLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
                    <MenuLink href="/saved" icon={<Bookmark className="h-4 w-4" />} label="Saved" />
                    <MenuLink href="/jobs" icon={<Briefcase className="h-4 w-4" />} label="Jobs" />
                    {currentUser.role === "worker" ? <MenuLink href="/profile" icon={<Avatar name={currentUser.name} size={16} />} label="Edit profile" /> : <MenuLink href="/company" icon={<Briefcase className="h-4 w-4" />} label="Company" />}
                    <button className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-soft" onClick={() => { resetDemo(); setMenu(false); router.push("/"); }}>
                      Reset sample data
                    </button>
                    <button className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-soft" onClick={() => { logout(); setMenu(false); router.push("/"); }}>
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="rounded-full px-3 py-2 text-sm font-semibold text-ink">Log in</Link>
              <Link href="/signup" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">Sign up</Link>
            </div>
          )}
          <button className="grid h-9 w-9 place-items-center rounded-full border border-line lg:hidden" aria-label="Open menu" onClick={() => setOpen((value) => !value)}>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-line bg-surface px-4 py-4 lg:hidden">
          <form onSubmit={onSearch} className="mb-3 md:hidden">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the network" className="w-full rounded-xl border border-line bg-soft px-3 py-2 text-sm" />
          </form>
          <div className="grid gap-1">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-soft">{link.label}</Link>
            ))}
            {currentUser ? (
              <>
                <Link href="/dashboard" className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-soft">Dashboard</Link>
                <Link href="/messages" className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-soft">Messages</Link>
                <Link href="/saved" className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-soft">Saved</Link>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link href="/login" className="rounded-full border border-line px-4 py-2 text-sm font-semibold">Log in</Link>
                <Link href="/signup" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm hover:bg-soft">
      {icon} {label}
    </Link>
  );
}
