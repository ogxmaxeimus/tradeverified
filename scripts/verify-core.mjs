/**
 * Exercises the pilot loop against a local Supabase stack.
 * Reads .env.local. Does not print keys.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv(path) {
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(new URL("../.env.local", import.meta.url));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase URL or publishable key in .env.local");
  process.exit(1);
}

const password = "pilot-demo-2026";
const anon = createClient(url, key, { auth: { persistSession: false } });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function signIn(email) {
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign in failed for ${email}: ${error.message}`);
  return { client, userId: data.user.id };
}

const failures = [];

try {
  const { data: hvac, error: searchError } = await anon.rpc("search_workers", {
    trade_filter: "HVAC",
    certification_filter: "EPA 608",
    city_filter: "Austin",
    state_filter: "TX",
  });
  assert(!searchError, searchError?.message ?? "search failed");
  assert(hvac?.some((row) => row.full_name === "Jordan Ellis"), "HVAC search did not return Jordan Ellis");
  assert(!hvac?.some((row) => row.full_name === "Riley Brooks"), "Certification filter leaked an unmatched worker");

  const { data: pendingPublic } = await anon
    .from("credentials")
    .select("id, name")
    .eq("name", "Texas Plumber License");
  assert((pendingPublic ?? []).length === 0, "Anon can see a pending credential");

  const alex = await signIn("alex.nguyen@tradeverified.dev");
  const { data: ownPending } = await alex.client
    .from("credentials")
    .select("id, status")
    .eq("worker_id", alex.userId)
    .eq("status", "pending")
    .limit(1);
  assert(ownPending?.length === 1, "Worker cannot read their pending credential");
  const { data: selfApproved } = await alex.client
    .from("credentials")
    .update({ status: "approved" })
    .eq("id", ownPending[0].id)
    .select("id");
  assert((selfApproved ?? []).length === 0, "Worker was able to self-approve a credential");

  const riley = await signIn("riley.brooks@tradeverified.dev");
  const pdf = new File(["%PDF-1.1 pilot"], "license.pdf", { type: "application/pdf" });
  const storedPath = `${riley.userId}/verify-${Date.now()}.pdf`;
  const upload = await riley.client.storage.from("credentials").upload(storedPath, pdf, {
    contentType: "application/pdf",
    upsert: false,
  });
  assert(!upload.error, `Upload failed: ${upload.error?.message}`);

  const inserted = await riley.client
    .from("credentials")
    .insert({
      worker_id: riley.userId,
      kind: "certification",
      name: "AWS Certified Welder",
      issuing_authority: "American Welding Society",
      license_number: "AWS-PILOT",
      status: "pending",
      document_path: storedPath,
    })
    .select("id")
    .single();
  assert(!inserted.error, inserted.error?.message ?? "insert credential failed");

  const pendingWorker = await riley.client
    .from("worker_profiles")
    .select("verification_status")
    .eq("profile_id", riley.userId)
    .single();
  assert(pendingWorker.data?.verification_status === "pending", "Upload did not move the worker to pending");

  const admin = await signIn("avery.quinn@tradeverified.dev");
  const review = await admin.client
    .from("credentials")
    .update({
      status: "approved",
      review_note: "Verified by the core-flow script, then removed.",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", inserted.data.id)
    .select("id");
  assert((review.data ?? []).length === 1, "Admin could not approve the credential");

  const verified = await anon
    .from("worker_profiles")
    .select("verification_status")
    .eq("profile_id", riley.userId)
    .single();
  assert(verified.data?.verification_status === "verified", "Approved credential did not verify the worker");

  const removed = await admin.client.from("credentials").delete().eq("id", inserted.data.id);
  assert(!removed.error, removed.error?.message ?? "cleanup delete failed");
  await admin.client.storage.from("credentials").remove([storedPath]);
  const restored = await anon
    .from("worker_profiles")
    .select("verification_status")
    .eq("profile_id", riley.userId)
    .single();
  assert(restored.data?.verification_status === "unverified", "Deleting the test credential did not restore unverified");

  const marcus = await signIn("marcus.hale@tradeverified.dev");
  const job = await marcus.client
    .from("jobs")
    .insert({
      employer_id: marcus.userId,
      title: "Temporary verify job",
      trade: "Welding",
      description: "Created by scripts/verify-core.mjs and deleted at the end.",
      city: "Austin",
      state: "TX",
      employment_type: "contract",
      status: "open",
    })
    .select("id")
    .single();
  assert(!job.error, job.error?.message ?? "job insert failed");

  const jordan = await signIn("jordan.ellis@tradeverified.dev");
  const application = await jordan.client
    .from("applications")
    .insert({
      job_id: job.data.id,
      worker_id: jordan.userId,
      cover_note: "Verification script application.",
      status: "submitted",
    })
    .select("id")
    .single();
  assert(!application.error, application.error?.message ?? "apply failed");

  const seen = await marcus.client
    .from("applications")
    .select("id, cover_note")
    .eq("id", application.data.id)
    .maybeSingle();
  assert(seen.data?.cover_note?.includes("Verification script"), "Employer cannot read the application");

  const status = await marcus.client
    .from("applications")
    .update({ status: "reviewed" })
    .eq("id", application.data.id)
    .select("status")
    .single();
  assert(status.data?.status === "reviewed", "Employer could not update application status");

  await jordan.client.from("applications").delete().eq("id", application.data.id);
  await marcus.client.from("jobs").delete().eq("id", job.data.id);

  const signup = await anon.auth.signUp({
    email: `admin-attempt-${Date.now()}@tradeverified.dev`,
    password,
    options: { data: { full_name: "Not An Admin", role: "admin", trade: "HVAC" } },
  });
  assert(!signup.error, signup.error?.message ?? "signup failed");
  const createdId = signup.data.user?.id;
  assert(createdId, "signup did not return a user");
  const roleCheck = await signup.data.session
    ? createClient(url, key, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${signup.data.session.access_token}` } },
      })
    : null;
  if (!roleCheck) throw new Error("Signup did not create a session. Enable local auth confirmations off.");
  const profile = await roleCheck.from("profiles").select("role").eq("id", createdId).single();
  assert(profile.data?.role === "worker", `Signup with role=admin created ${profile.data?.role}`);

  console.log("Core flows passed: search, RLS, upload, admin review, apply, signup role lock.");
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
