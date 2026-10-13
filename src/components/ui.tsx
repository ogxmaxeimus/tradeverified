import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import type { Viewer } from "@/lib/session";

const BADGE: Record<string, string> = {
  verified: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-900",
  rejected: "bg-red-100 text-red-800",
  unverified: "bg-slate-100 text-slate-600",
};

const BADGE_LABEL: Record<string, string> = {
  verified: "Verified",
  pending: "Pending review",
  rejected: "Rejected",
  unverified: "Unverified",
};

export function VerificationBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[status] ?? BADGE.unverified}`}
    >
      {BADGE_LABEL[status] ?? status}
    </span>
  );
}

export function Flash({
  error,
  notice,
}: {
  error?: string;
  notice?: string;
}) {
  if (!error && !notice) return null;
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}
      role={error ? "alert" : "status"}
    >
      {error ?? notice}
    </p>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </span>
      TradeVerified
    </Link>
  );
}

export function Header({ viewer }: { viewer: Viewer | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
          <Link href="/workers" className="hover:text-blue-700">Workers</Link>
          <Link href="/jobs" className="hover:text-blue-700">Jobs</Link>
          {viewer ? <Link href="/dashboard" className="hover:text-blue-700">Dashboard</Link> : null}
          {viewer?.role === "admin" ? <Link href="/admin" className="hover:text-blue-700">Review</Link> : null}
        </nav>
        <div className="flex items-center gap-2">
          {viewer ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">{viewer.fullName}</span>
              <form action={signOut}>
                <button className="btn btn-ghost" type="submit">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Sign in</Link>
              <Link href="/signup" className="btn btn-primary">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function DashboardNav({ role }: { role: Viewer["role"] }) {
  const links = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/profile", label: "Profile" },
  ];
  if (role === "worker") {
    links.push(
      { href: "/dashboard/credentials", label: "Licenses" },
      { href: "/dashboard/portfolio", label: "Portfolio" },
    );
  }
  if (role === "employer") {
    links.push(
      { href: "/dashboard/jobs", label: "My jobs" },
      { href: "/jobs/new", label: "Post a job" },
    );
  }
  if (role === "admin") {
    links.push({ href: "/admin", label: "Review queue" });
  }

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="btn btn-ghost">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
