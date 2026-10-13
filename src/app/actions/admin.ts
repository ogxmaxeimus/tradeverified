"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbMessage, field, optional } from "@/lib/format";
import { requireRole } from "@/lib/session";

function bounce(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

export async function reviewCredential(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const id = field(formData, "id");
  const decision = field(formData, "decision");
  const note = field(formData, "note");
  if (decision !== "approved" && decision !== "rejected") bounce("Choose approve or reject.");

  const { data: row, error: readError } = await supabase
    .from("credentials")
    .select("worker_id")
    .eq("id", id)
    .maybeSingle();
  if (readError || !row) bounce(readError ? dbMessage(readError) : "Credential not found.");

  const { error } = await supabase
    .from("credentials")
    .update({
      status: decision,
      review_note: optional(note),
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) bounce(dbMessage(error));
  revalidatePath("/admin");
  revalidatePath("/workers");
  revalidatePath(`/workers/${row.worker_id}`);
  redirect(`/admin?notice=${decision === "approved" ? "Credential approved" : "Credential rejected"}`);
}
