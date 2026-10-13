import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">That profile or job is not available.</p>
      <Link href="/workers" className="btn btn-primary mt-6">Browse workers</Link>
    </div>
  );
}
