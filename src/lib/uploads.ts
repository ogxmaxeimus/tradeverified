import type { SupabaseClient } from "@supabase/supabase-js";

const CREDENTIAL_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateUpload(
  value: FormDataEntryValue | null,
  kind: "credential" | "image",
) {
  if (!(value instanceof File) || value.size === 0) {
    return { file: null, error: "Choose a file to upload." };
  }
  const allowed = kind === "credential" ? CREDENTIAL_TYPES : IMAGE_TYPES;
  if (!allowed.has(value.type)) {
    return {
      file: null,
      error:
        kind === "credential"
          ? "Upload a PDF, JPEG, PNG, or WebP."
          : "Upload a JPEG, PNG, or WebP image.",
    };
  }
  if (value.size > 10 * 1024 * 1024) {
    return { file: null, error: "Files must be 10 MB or smaller." };
  }
  return { file: value, error: null };
}

export async function uploadToBucket(
  supabase: SupabaseClient,
  bucket: "credentials" | "portfolio",
  userId: string,
  file: File,
) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "upload";
  const path = `${userId}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  return { path, error };
}
