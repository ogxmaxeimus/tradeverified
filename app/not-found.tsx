import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4 text-ink">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-brand">404</p>
        <h1 className="mt-2 text-3xl font-extrabold">That page is not on the job</h1>
        <p className="mt-2 text-muted">The link may be old, or the record was cleared from this browser.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">Back home</Link>
      </div>
    </div>
  );
}
