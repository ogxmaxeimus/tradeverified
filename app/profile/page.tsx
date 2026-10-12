"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountFrame } from "@/components/SideNav";
import { Shell } from "@/components/Shell";
import { WorkArt } from "@/components/WorkArt";
import { CredentialBadge, Field, btnGhost, btnPrimary, inputClass, useTitle } from "@/components/ui";
import { shrinkImage } from "@/lib/images";
import { useStore, type ProfileInput } from "@/lib/store";
import type { Availability } from "@/lib/types";

export default function EditProfilePage() {
  useTitle("Edit profile");
  const router = useRouter();
  const store = useStore();

  useEffect(() => {
    if (!store.currentUser) router.replace("/login?next=/profile");
    else if (store.currentUser.role === "employer") router.replace("/company");
  }, [router, store.currentUser]);

  if (!store.currentProfessional || !store.currentUser) {
    return <Shell><p className="p-10 text-muted">Opening your profile…</p></Shell>;
  }

  return (
    <Shell>
      <AccountFrame>
        <Editor />
      </AccountFrame>
    </Shell>
  );
}

function Editor() {
  const store = useStore();
  const pro = store.currentProfessional!;
  const [form, setForm] = useState<ProfileInput>({
    title: pro.title,
    city: pro.city,
    region: pro.region,
    about: pro.about,
    skills: pro.skills,
    years: pro.years,
    rate: pro.rate,
    availability: pro.availability,
    licensed: pro.licensed,
    insured: pro.insured,
    backgroundChecked: pro.backgroundChecked,
    osha: pro.osha,
  });
  const [skills, setSkills] = useState(pro.skills.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState({ title: "", location: "", summary: "", image: "" });
  const [credential, setCredential] = useState({ name: "", detail: "", issuer: "", issued: "", expires: "", reference: "" });
  const [checkError, setCheckError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Edit profile</h1>
          <p className="text-sm text-muted">Public page: <Link className="font-semibold text-brand" href={`/professionals/${pro.slug}`}>/{pro.slug}</Link></p>
        </div>
      </div>
      <form
        className="grid gap-3 rounded-2xl border border-line bg-surface p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const result = store.updateProfile({ ...form, skills: skills.split(",") });
          setError(result);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title"><input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
          <Field label="Rate"><input className={inputClass} value={form.rate} onChange={(event) => setForm({ ...form, rate: event.target.value })} placeholder="$40–60/hr" /></Field>
          <Field label="City"><input className={inputClass} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field>
          <Field label="State or province"><input className={inputClass} value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} /></Field>
          <Field label="Years">
            <input type="number" min={0} max={60} className={inputClass} value={form.years} onChange={(event) => setForm({ ...form, years: Number(event.target.value) })} />
          </Field>
          <Field label="Availability">
            <select className={inputClass} value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value as Availability })}>
              <option>Available now</option>
              <option>Booking 2 weeks</option>
              <option>Limited</option>
            </select>
          </Field>
        </div>
        <Field label="About the work">
          <textarea className={inputClass} rows={5} value={form.about} onChange={(event) => setForm({ ...form, about: event.target.value })} />
        </Field>
        <Field label="Skills, separated by commas">
          <input className={inputClass} value={skills} onChange={(event) => setSkills(event.target.value)} />
        </Field>
        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Licensed" checked={form.licensed} onChange={(licensed) => setForm({ ...form, licensed })} />
          <Toggle label="Insured" checked={form.insured} onChange={(insured) => setForm({ ...form, insured })} />
          <Toggle label="Background checked" checked={form.backgroundChecked} onChange={(backgroundChecked) => setForm({ ...form, backgroundChecked })} />
          <Toggle label="OSHA card on file" checked={form.osha} onChange={(osha) => setForm({ ...form, osha })} />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button className={`${btnPrimary} w-max`}>Save profile</button>
      </form>

      <section id="portfolio" className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-lg font-bold">Portfolio</h2>
        <p className="mt-1 text-sm text-muted">{store.currentUser?.plan === "free" ? "Free accounts show 3 projects." : "Pro removes the cap."} Photos stay in this browser.</p>
        <div className="mt-4 grid gap-3">
          {pro.portfolio.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-[160px_1fr]">
              <WorkArt title={item.title} trade={pro.trade} image={item.image} label="After" />
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted">{item.summary}</p>
                <button className="mt-2 text-sm font-semibold text-rose-600" onClick={() => store.removePortfolio(item.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <form
          className="mt-4 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const result = store.addPortfolio(project);
            setError(result);
            if (!result) setProject({ title: "", location: "", summary: "", image: "" });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Project title"><input className={inputClass} value={project.title} onChange={(event) => setProject({ ...project, title: event.target.value })} /></Field>
            <Field label="Location"><input className={inputClass} value={project.location} onChange={(event) => setProject({ ...project, location: event.target.value })} /></Field>
          </div>
          <Field label="What you did"><textarea className={inputClass} rows={3} value={project.summary} onChange={(event) => setProject({ ...project, summary: event.target.value })} /></Field>
          <Field label="Photo">
            <input
              type="file"
              accept="image/*"
              className="text-sm"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  const image = await shrinkImage(file);
                  setProject((current) => ({ ...current, image }));
                } catch {
                  setError("Could not read that image.");
                }
              }}
            />
          </Field>
          <button className={`${btnGhost} w-max`}>Add project</button>
        </form>
      </section>

      <section id="credentials" className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-lg font-bold">Credentials</h2>
        <p className="mt-1 text-sm text-muted">A new credential stays pending until you run a workspace check. That check confirms the number shape and a future expiration. It does not call a license board. The badge shows the source either way.</p>
        <div className="mt-4 space-y-3">
          {pro.credentials.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-muted">{item.source} · {item.reference}</p>
              </div>
              <div className="flex items-center gap-2">
                <CredentialBadge credential={item} />
                {item.status === "pending" ? (
                  <button className={btnGhost} onClick={() => setCheckError(store.checkCredential(item.id))}>Run check</button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {checkError ? <p className="mt-3 text-sm text-rose-600">{checkError}</p> : null}
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const result = store.addCredential(credential);
            setCheckError(result);
            if (!result) setCredential({ name: "", detail: "", issuer: "", issued: "", expires: "", reference: "" });
          }}
        >
          <Field label="Credential"><input className={inputClass} value={credential.name} onChange={(event) => setCredential({ ...credential, name: event.target.value })} placeholder="EPA 608" /></Field>
          <Field label="Detail"><input className={inputClass} value={credential.detail} onChange={(event) => setCredential({ ...credential, detail: event.target.value })} placeholder="Universal" /></Field>
          <Field label="Issuer"><input className={inputClass} value={credential.issuer} onChange={(event) => setCredential({ ...credential, issuer: event.target.value })} placeholder="EPA" /></Field>
          <Field label="Reference number"><input className={inputClass} value={credential.reference} onChange={(event) => setCredential({ ...credential, reference: event.target.value })} /></Field>
          <Field label="Issued"><input type="date" className={inputClass} value={credential.issued} onChange={(event) => setCredential({ ...credential, issued: event.target.value })} /></Field>
          <Field label="Expires"><input type="date" className={inputClass} value={credential.expires} onChange={(event) => setCredential({ ...credential, expires: event.target.value })} /></Field>
          <div className="sm:col-span-2"><button className={`${btnGhost} w-max`}>Add credential</button></div>
        </form>
      </section>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
