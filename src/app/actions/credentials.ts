"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbMessage, field, optional } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { uploadToBucket, validateUpload } from "@/lib/uploads";

function bounce(message: string): never {
  redirect(`/dashboard/credentials?error=${encodeURIComponent(message)}`);
}

function dateOrNull(value: string, label: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) bounce(`Enter a valid ${label}.`);
  return value;
}

export async function addCredential(formData: FormData) {
  const { supabase, viewer } = await requireRole("worker");
  const name = field(formData, "name");
  const authority = field(formData, "issuing_authority");
  const kind = field(formData, "kind");
  const state = field(formData, "state").toUpperCase();
  const issued = dateOrNull(field(formData, "issued_on"), "issue date");
  const expires = dateOrNull(field(formData, "expires_on"), "expiration date");
  const upload = validateUpload(formData.get("document"), "credential");

  if (name.length < 2) bounce("Enter the license or certification name.");
  if (authority.length < 2) bounce("Enter the issuing authority.");
  if (kind !== "license" && kind !== "certification") bounce("Choose license or certification.");
  if (state && !/^[A-Z]{2}$/.test(state)) bounce("Choose a two-letter state.");
  if (upload.error || !upload.file) bounce(upload.error ?? "Choose a file to upload.");

  const uploaded = await uploadToBucket(supabase, "credentials", viewer.id, upload.file);
  if (uploaded.error) bounce(uploaded.error.message);

  const { error } = await supabase.from("credentials").insert({
    worker_id: viewer.id,
    kind,
    name,
    issuing_authority: authority,
    license_number: optional(field(formData, "license_number")),
    state: optional(state),
    issued_on: issued,
    expires_on: expires,
    document_path: uploaded.path,
    status: "pending",
  });

  if (error) {
    await supabase.storage.from("credentials").remove([uploaded.path]);
    bounce(dbMessage(error));
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  redirect("/dashboard/credentials?notice=Submitted for review");
}

export async function deleteCredential(formData: FormData) {
  const { supabase } = await requireRole("worker");
  const id = field(formData, "id");
  const { data: row } = await supabase
    .from("credentials")
    .select("document_path, status")
    .eq("id", id)
    .maybeSingle();

  if (!row || row.status !== "pending") {
    bounce("Only pending submissions can be withdrawn.");
  }

  const { error } = await supabase.from("credentials").delete().eq("id", id);
  if (error) bounce(dbMessage(error));
  if (row.document_path) {
    await supabase.storage.from("credentials").remove([row.document_path]);
  }
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  redirect("/dashboard/credentials?notice=Submission withdrawn");
}
