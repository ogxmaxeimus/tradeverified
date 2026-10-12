import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/"><Logo /></Link>
        <p className="max-w-xl text-sm text-muted">
          The professional network for skilled trades. Profiles, licenses, and reviews in this workspace are sample records stored in your browser.
        </p>
        <p className="text-sm text-muted">© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
