"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isTrade } from "@/lib/constants";
import { dbMessage, field, optional } from "@/lib/format";
import { requireViewer } from "@/lib/session";

function bounce(message: string): never {
  redirect(`/dashboard/profile?error=${encodeURIComponent(message)}`);
}

export async function saveProfile(formData: FormData) {
  const { supabase, viewer } = await requireViewer();
  const fullName = field(formData, "full_name");
  const city = field(formData, "city");
  const state = field(formData, "state").toUpperCase();
  const headline = field(formData, "headline");
  const bio = field(formData, "bio");

  if (fullName.length < 2 || fullName.length > 120) bounce("Enter a name under 120 characters.");
  if (state && !/^[A-Z]{2}$/.test(state)) bounce("Choose a two-letter state.");
  if (headline.length > 140) bounce("Headline must be 140 characters or fewer.");
  if (bio.length > 2000) bounce("Bio must be 2,000 characters or fewer.");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      city: optional(city),
      state: optional(state),
      headline: optional(headline),
      bio: optional(bio),
    })
    .eq("id", viewer.id);

  if (profileError) bounce(dbMessage(profileError));

  if (viewer.role === "worker") {
    const trade = field(formData, "trade");
    const years = Number(field(formData, "years_experience") || "0");
    const rateRaw = field(formData, "hourly_rate");
    const rate = rateRaw === "" ? null : Number(rateRaw);
    if (!isTrade(trade)) bounce("Choose a trade.");
    if (!Number.isInteger(years) || years < 0 || years > 80) {
      bounce("Years of experience must be a whole number from 0 to 80.");
    }
    if (rate !== null && (Number.isNaN(rate) || rate < 0)) bounce("Enter a valid hourly rate.");

    const { error } = await supabase
      .from("worker_profiles")
      .update({
        trade,
        years_experience: years,
        hourly_rate: rate,
        open_to_work: formData.get("open_to_work") === "on",
      })
      .eq("profile_id", viewer.id);
    if (error) bounce(dbMessage(error));
  }

  if (viewer.role === "employer") {
    const company = field(formData, "company_name");
    const website = field(formData, "website");
    if (company.length < 2) bounce("Enter a company name.");
    const { error } = await supabase
      .from("employer_profiles")
      .update({
        company_name: company,
        website: optional(website),
      })
      .eq("profile_id", viewer.id);
    if (error) bounce(dbMessage(error));
  }

  revalidatePath("/dashboard");
  revalidatePath(`/workers/${viewer.id}`);
  redirect("/dashboard/profile?notice=Profile saved");
}
