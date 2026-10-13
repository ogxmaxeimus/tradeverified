"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isTrade } from "@/lib/constants";
import { dbMessage, field, optional } from "@/lib/format";
import { requireRole, requireViewer } from "@/lib/session";

function bounce(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function moneyOrNull(value: string, label: string) {
  if (!value) return null;
  const amount = Number(value);
  if (Number.isNaN(amount) || amount < 0) bounce("/jobs/new", `Enter a valid ${label}.`);
  return amount;
}

export async function createJob(formData: FormData) {
  const { supabase, viewer } = await requireRole("employer");
  const title = field(formData, "title");
  const trade = field(formData, "trade");
  const description = field(formData, "description");
  const city = field(formData, "city");
  const state = field(formData, "state").toUpperCase();
  const employment = field(formData, "employment_type");
  const payUnit = field(formData, "pay_unit");
  const payMin = moneyOrNull(field(formData, "pay_min"), "minimum pay");
  const payMax = moneyOrNull(field(formData, "pay_max"), "maximum pay");

  if (title.length < 2) bounce("/jobs/new", "Enter a job title.");
  if (!isTrade(trade)) bounce("/jobs/new", "Choose a trade.");
  if (description.length < 10) bounce("/jobs/new", "Add a short description.");
  if (!city) bounce("/jobs/new", "Enter a city.");
  if (!/^[A-Z]{2}$/.test(state)) bounce("/jobs/new", "Choose a state.");
  if (!["full_time", "contract", "part_time"].includes(employment)) {
    bounce("/jobs/new", "Choose an employment type.");
  }
  if (payUnit && !["hour", "year", "project"].includes(payUnit)) {
    bounce("/jobs/new", "Choose a pay unit.");
  }
  if (payMin !== null && payMax !== null && payMax < payMin) {
    bounce("/jobs/new", "Maximum pay must be at least the minimum.");
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      employer_id: viewer.id,
      title,
      trade,
      description,
      city,
      state,
      employment_type: employment,
      pay_min: payMin,
      pay_max: payMax,
      pay_unit: optional(payUnit),
      required_certification: optional(field(formData, "required_certification")),
      status: "open",
    })
    .select("id")
    .single();

  if (error || !data) bounce("/jobs/new", error ? dbMessage(error) : "Could not create the job.");
  revalidatePath("/jobs");
  revalidatePath("/dashboard/jobs");
  redirect(`/jobs/${data.id}?notice=Job posted`);
}

export async function setJobStatus(formData: FormData) {
  const { supabase } = await requireRole("employer");
  const id = field(formData, "id");
  const status = field(formData, "status");
  if (status !== "open" && status !== "closed") bounce(`/dashboard/jobs/${id}`, "Choose open or closed.");

  const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
  if (error) bounce(`/dashboard/jobs/${id}`, dbMessage(error));
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/dashboard/jobs");
  redirect(`/dashboard/jobs/${id}?notice=Job updated`);
}

export async function applyToJob(formData: FormData) {
  const { supabase, viewer } = await requireViewer();
  const jobId = field(formData, "job_id");
  const note = field(formData, "cover_note");
  if (viewer.role !== "worker") bounce(`/jobs/${jobId}`, "Only worker accounts can apply.");
  if (note.length > 2000) bounce(`/jobs/${jobId}`, "Note must be 2,000 characters or fewer.");

  const { error } = await supabase.from("applications").insert({
    job_id: jobId,
    worker_id: viewer.id,
    cover_note: optional(note),
    status: "submitted",
  });

  if (error) {
    const message = error.code === "23505" ? "You already applied to this job." : dbMessage(error);
    bounce(`/jobs/${jobId}`, message);
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
  redirect(`/jobs/${jobId}?notice=Application sent`);
}

export async function withdrawApplication(formData: FormData) {
  const { supabase } = await requireRole("worker");
  const id = field(formData, "id");
  const jobId = field(formData, "job_id");
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) bounce(`/jobs/${jobId}`, dbMessage(error));
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
  redirect(`/jobs/${jobId}?notice=Application withdrawn`);
}

export async function setApplicationStatus(formData: FormData) {
  const { supabase } = await requireRole("employer");
  const id = field(formData, "id");
  const jobId = field(formData, "job_id");
  const status = field(formData, "status");
  if (!["submitted", "reviewed", "accepted", "declined"].includes(status)) {
    bounce(`/dashboard/jobs/${jobId}`, "Choose an application status.");
  }
  const { error } = await supabase.from("applications").update({ status }).eq("id", id);
  if (error) bounce(`/dashboard/jobs/${jobId}`, dbMessage(error));
  revalidatePath(`/dashboard/jobs/${jobId}`);
  redirect(`/dashboard/jobs/${jobId}?notice=Application updated`);
}
