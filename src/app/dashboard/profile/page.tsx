import type { Metadata } from "next";
import { saveProfile } from "@/app/actions/profile";
import { DashboardNav, Flash } from "@/components/ui";
import { STATES, TRADES } from "@/lib/constants";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const flash = await searchParams;
  const { supabase, viewer } = await requireViewer();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, city, state, headline, bio")
    .eq("id", viewer.id)
    .single();
  const { data: worker } = viewer.role === "worker"
    ? await supabase
        .from("worker_profiles")
        .select("trade, years_experience, hourly_rate, open_to_work")
        .eq("profile_id", viewer.id)
        .maybeSingle()
    : { data: null };
  const { data: employer } = viewer.role === "employer"
    ? await supabase
        .from("employer_profiles")
        .select("company_name, website")
        .eq("profile_id", viewer.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      <DashboardNav role={viewer.role} />
      <Flash error={flash.error} notice={flash.notice} />
      <form action={saveProfile} className="card max-w-2xl space-y-4 p-6">
        <label className="label">
          Full name
          <input className="input" name="full_name" defaultValue={profile?.full_name ?? ""} required />
        </label>
        <label className="label">
          Headline
          <input className="input" name="headline" defaultValue={profile?.headline ?? ""} maxLength={140} />
        </label>
        <label className="label">
          Bio
          <textarea className="input min-h-28" name="bio" defaultValue={profile?.bio ?? ""} maxLength={2000} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="label">
            City
            <input className="input" name="city" defaultValue={profile?.city ?? ""} />
          </label>
          <label className="label">
            State
            <select className="input" name="state" defaultValue={profile?.state ?? ""}>
              <option value="">Select</option>
              {STATES.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </label>
        </div>
        {worker ? (
          <>
            <label className="label">
              Trade
              <select className="input" name="trade" defaultValue={worker.trade}>
                {TRADES.map((trade) => (
                  <option key={trade}>{trade}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="label">
                Years of experience
                <input className="input" name="years_experience" type="number" min="0" max="80" defaultValue={worker.years_experience} />
              </label>
              <label className="label">
                Hourly rate
                <input className="input" name="hourly_rate" type="number" min="0" step="0.01" defaultValue={worker.hourly_rate ?? ""} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" name="open_to_work" defaultChecked={worker.open_to_work} />
              Open to work
            </label>
          </>
        ) : null}
        {employer ? (
          <>
            <label className="label">
              Company
              <input className="input" name="company_name" defaultValue={employer.company_name} required />
            </label>
            <label className="label">
              Website
              <input className="input" name="website" defaultValue={employer.website ?? ""} placeholder="https://" />
            </label>
          </>
        ) : null}
        <button className="btn btn-primary" type="submit">Save profile</button>
      </form>
    </div>
  );
}
