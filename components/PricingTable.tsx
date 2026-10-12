"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { btnGhost, btnPrimary, Field, inputClass } from "./ui";

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: "$0",
    who: "Tradespeople getting on the record",
    points: ["Profile, credentials, and reviews", "3 portfolio projects", "Apply to every open job", "Join trade groups"],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$19",
    who: "Tradespeople who want the first look",
    points: ["Everything in Free", "Unlimited portfolio projects", "Featured placement in search", "Priority when ratings tie"],
    featured: true,
  },
  {
    id: "employer" as const,
    name: "Employer",
    price: "$99",
    who: "Shops and contractors who hire",
    points: ["Unlimited job posts", "Candidate search and filters", "Save people and message them", "Application statuses your crew can see"],
  },
];

export function PricingTable() {
  const router = useRouter();
  const { currentUser, setPlan } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [lead, setLead] = useState({ name: "", email: "", company: "", message: "" });
  const { submitLead } = useStore();
  const [sent, setSent] = useState(false);

  function choose(plan: "free" | "pro" | "employer") {
    setError(null);
    if (!currentUser) {
      const role = plan === "employer" ? "employer" : "worker";
      router.push(`/signup?role=${role}&plan=${plan}`);
      return;
    }
    const result = setPlan(plan);
    if (result) setError(result);
  }

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <article key={plan.id} className={`relative flex flex-col rounded-2xl border bg-surface p-6 ${plan.featured ? "border-brand shadow-[0_20px_50px_-30px_#2563eb]" : "border-line"}`}>
            {plan.featured ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Popular</span> : null}
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="mt-3 text-3xl font-extrabold">{plan.price}<span className="text-base font-medium text-muted">{plan.id === "free" ? "" : "/mo"}</span></p>
            <p className="mt-1 min-h-12 text-sm text-muted">{plan.who}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">
              {plan.points.map((point) => <li key={point}>✓ {point}</li>)}
            </ul>
            <button className={`${plan.featured ? btnPrimary : btnGhost} mt-6`} onClick={() => choose(plan.id)}>
              {currentUser?.plan === plan.id ? "Current plan" : plan.id === "employer" ? "Start hiring" : plan.id === "pro" ? "Go Pro" : "Use Free"}
            </button>
          </article>
        ))}
        <article className="flex flex-col rounded-2xl border border-line bg-surface p-6">
          <h3 className="text-lg font-bold">Enterprise</h3>
          <p className="mt-3 text-3xl font-extrabold">Custom</p>
          <p className="mt-1 min-h-12 text-sm text-muted">Franchises and staffing desks</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">
            <li>✓ Everything in Employer</li>
            <li>✓ Several hiring seats</li>
            <li>✓ A person who answers the phone</li>
            <li>✓ Room for a board lookup later</li>
          </ul>
          <button className={`${btnGhost} mt-6`} onClick={() => setLeadOpen(true)}>Contact us</button>
        </article>
      </div>
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      <p className="mt-4 text-sm text-muted">Choosing a plan turns it on for this account in your browser. Card billing is not connected.</p>
      {leadOpen ? (
        <form
          className="mt-6 grid gap-3 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const result = submitLead(lead);
            if (result) setError(result);
            else {
              setSent(true);
              setLeadOpen(false);
            }
          }}
        >
          <Field label="Name"><input className={inputClass} value={lead.name} onChange={(event) => setLead({ ...lead, name: event.target.value })} required /></Field>
          <Field label="Work email"><input type="email" className={inputClass} value={lead.email} onChange={(event) => setLead({ ...lead, email: event.target.value })} required /></Field>
          <Field label="Company"><input className={inputClass} value={lead.company} onChange={(event) => setLead({ ...lead, company: event.target.value })} /></Field>
          <Field label="What do you need to hire?"><input className={inputClass} value={lead.message} onChange={(event) => setLead({ ...lead, message: event.target.value })} required /></Field>
          <div className="sm:col-span-2"><button className={btnPrimary}>Save request</button></div>
        </form>
      ) : null}
      {sent ? <p className="mt-4 text-sm font-medium text-good">Request saved in this workspace.</p> : null}
    </div>
  );
}
