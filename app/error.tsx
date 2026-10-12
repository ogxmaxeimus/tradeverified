"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4 text-ink">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-extrabold">Something broke</h1>
        <p className="mt-2 text-muted">The page hit an error. Try it again, or reset the sample data from the account menu if a saved workspace got stuck.</p>
        <button className="mt-6 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={reset}>Try again</button>
      </div>
    </div>
  );
}
