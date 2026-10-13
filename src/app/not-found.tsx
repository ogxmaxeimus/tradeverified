import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-500">That profile or job is not available.</p>
      <div className="mt-6 flex justify-center gap-3 text-sm font-medium">
        <Link href="/marketplace" className="text-blue-600 hover:underline">Browse workers</Link>
        <Link href="/jobs" className="text-blue-600 hover:underline">Browse jobs</Link>
      </div>
    </div>
  );
}
