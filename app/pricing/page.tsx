"use client";

import { PricingTable } from "@/components/PricingTable";
import { Shell } from "@/components/Shell";
import { useTitle } from "@/components/ui";

export default function PricingPage() {
  useTitle("Pricing");
  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-center text-4xl font-extrabold tracking-tight">Pricing</h1>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted">Free to find work. Pay when you want to be seen first, or when you are the one hiring.</p>
        <div className="mt-8"><PricingTable /></div>
      </div>
    </Shell>
  );
}
