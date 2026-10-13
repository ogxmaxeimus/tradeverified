"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbMessage, field, optional } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { uploadToBucket, validateUpload } from "@/lib/uploads";

function bounce(message: string): never {
  redirect(`/dashboard/portfolio?error=${encodeURIComponent(message)}`);
}

export async function addPortfolioItem(formData: FormData) {
  const { supabase, viewer } = await requireRole("worker");
  const title = field(formData, "title");
  const description = field(formData, "description");
  const completed = field(formData, "completed_on");
  const upload = validateUpload(formData.get("image"), "image");

  if (title.length < 2) bounce("Enter a title.");
  if (description.length > 2000) bounce("Description must be 2,000 characters or fewer.");
  if (completed && !/^\d{4}-\d{2}-\d{2}$/.test(completed)) bounce("Enter a valid completion date.");
  if (upload.error || !upload.file) bounce(upload.error ?? "Choose an image.");

  const uploaded = await uploadToBucket(supabase, "portfolio", viewer.id, upload.file);
  if (uploaded.error) bounce(uploaded.error.message);

  const { error } = await supabase.from("portfolio_items").insert({
    worker_id: viewer.id,
    title,
    description: optional(description),
    image_path: uploaded.path,
    completed_on: optional(completed),
  });

  if (error) {
    await supabase.storage.from("portfolio").remove([uploaded.path]);
    bounce(dbMessage(error));
  }

  revalidatePath("/dashboard/portfolio");
  revalidatePath(`/workers/${viewer.id}`);
  redirect("/dashboard/portfolio?notice=Portfolio item added");
}

export async function deletePortfolioItem(formData: FormData) {
  const { supabase, viewer } = await requireRole("worker");
  const id = field(formData, "id");
  const { data: row } = await supabase
    .from("portfolio_items")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
  if (error) bounce(dbMessage(error));
  if (row?.image_path && !row.image_path.startsWith("/")) {
    await supabase.storage.from("portfolio").remove([row.image_path]);
  }
  revalidatePath("/dashboard/portfolio");
  revalidatePath(`/workers/${viewer.id}`);
  redirect("/dashboard/portfolio?notice=Portfolio item removed");
}
