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
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase URL or anon/publishable key in .env.local");
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
    trade_filter: "hvac",
    certification_filter: "EPA 608",
    city_filter: "Austin",
    state_filter: "TX",
  });
  assert(!searchError, searchError?.message ?? "search failed");
  assert(
    hvac?.some((row) => row.first_name === "Jordan" && row.last_name === "Ellis"),
    "HVAC search did not return Jordan Ellis",
  );
  assert(
    !hvac?.some((row) => row.first_name === "Riley"),
    "Certification filter leaked an unmatched worker",
  );

  const { data: pendingPublic } = await anon
    .from("tradesperson_certifications")
    .select("id, license_number")
    .eq("license_number", "PL-55821");
  assert((pendingPublic ?? []).length === 0, "Anon can see a pending credential");

  const alex = await signIn("alex.nguyen@tradeverified.dev");
  const { data: alexProfile } = await alex.client
    .from("tradesperson_profiles")
    .select("id")
    .eq("user_id", alex.userId)
    .single();
  const { data: ownPending } = await alex.client
    .from("tradesperson_certifications")
    .select("id, status")
    .eq("tradesperson_id", alexProfile.id)
    .eq("status", "pending")
    .limit(1);
  assert(ownPending?.length === 1, "Tradesperson cannot read their pending credential");
  const selfApproved = await alex.client
    .from("tradesperson_certifications")
    .update({ status: "verified" })
    .eq("id", ownPending[0].id)
    .select("id");
  assert(selfApproved.error, "Worker was able to self-approve a credential");

  const riley = await signIn("riley.brooks@tradeverified.dev");
  const { data: rileyProfile } = await riley.client
    .from("tradesperson_profiles")
    .select("id")
    .eq("user_id", riley.userId)
    .single();
  const catalog = await riley.client
    .from("certifications")
    .select("id")
    .eq("name", "AWS Certified Welder")
    .single();
  assert(!catalog.error, catalog.error?.message ?? "cert catalog lookup failed");

  const pdf = new File(["%PDF-1.1 pilot"], "license.pdf", { type: "application/pdf" });
  const storedPath = `${riley.userId}/verify-${Date.now()}.pdf`;
  const upload = await riley.client.storage.from("certifications").upload(storedPath, pdf, {
    contentType: "application/pdf",
    upsert: false,
  });
  assert(!upload.error, `Upload failed: ${upload.error?.message}`);

  const inserted = await riley.client
    .from("tradesperson_certifications")
    .insert({
      tradesperson_id: rileyProfile.id,
      certification_id: catalog.data.id,
      license_number: "AWS-PILOT",
      issuing_state: "TX",
      status: "verified",
      document_path: storedPath,
    })
    .select("id, status")
    .single();
  assert(!inserted.error, inserted.error?.message ?? "insert credential failed");
  assert(inserted.data.status === "pending", "Upload did not stay pending for review");

  const pendingWorker = await anon
    .from("profiles")
    .select("is_verified")
    .eq("id", riley.userId)
    .single();
  assert(pendingWorker.data?.is_verified === false, "Pending upload marked the profile verified");

  const admin = await signIn("avery.quinn@tradeverified.dev");
  const review = await admin.client
    .from("tradesperson_certifications")
    .update({
      status: "verified",
      verification_method: "document_review",
      verification_notes: "Verified by the core-flow script, then removed.",
      verified_at: new Date().toISOString(),
      verified_by: admin.userId,
    })
    .eq("id", inserted.data.id)
    .select("id");
  assert((review.data ?? []).length === 1, review.error?.message ?? "Admin could not approve the credential");

  const verified = await anon
    .from("profiles")
    .select("is_verified")
    .eq("id", riley.userId)
    .single();
  assert(verified.data?.is_verified === true, "Approved credential did not verify the worker");

  const removed = await admin.client.from("tradesperson_certifications").delete().eq("id", inserted.data.id);
  assert(!removed.error, removed.error?.message ?? "cleanup delete failed");
  await admin.client.storage.from("certifications").remove([storedPath]);
  const restored = await anon
    .from("profiles")
    .select("is_verified")
    .eq("id", riley.userId)
    .single();
  assert(restored.data?.is_verified === false, "Deleting the test credential did not restore unverified");

  const marcus = await signIn("marcus.hale@tradeverified.dev");
  const company = await marcus.client
    .from("companies")
    .select("id")
    .eq("owner_id", marcus.userId)
    .single();
  assert(!company.error, company.error?.message ?? "employer company missing");
  const job = await marcus.client
    .from("jobs")
    .insert({
      company_id: company.data.id,
      posted_by: marcus.userId,
      title: "Temporary verify job",
      trade: "welding",
      description: "Created by scripts/verify-core.mjs and deleted at the end.",
      city: "Austin",
      state: "TX",
      job_type: "contract",
      status: "active",
    })
    .select("id")
    .single();
  assert(!job.error, job.error?.message ?? "job insert failed");

  const jordan = await signIn("jordan.ellis@tradeverified.dev");
  const jordanProfile = await jordan.client
    .from("tradesperson_profiles")
    .select("id")
    .eq("user_id", jordan.userId)
    .single();
  const application = await jordan.client
    .from("job_applications")
    .insert({
      job_id: job.data.id,
      tradesperson_id: jordanProfile.data.id,
      cover_letter: "Verification script application.",
      status: "pending",
    })
    .select("id")
    .single();
  assert(!application.error, application.error?.message ?? "apply failed");

  const seen = await marcus.client
    .from("job_applications")
    .select("id, cover_letter")
    .eq("id", application.data.id)
    .maybeSingle();
  assert(seen.data?.cover_letter?.includes("Verification script"), "Employer cannot read the application");

  const status = await marcus.client
    .from("job_applications")
    .update({ status: "reviewed" })
    .eq("id", application.data.id)
    .select("status")
    .single();
  assert(status.data?.status === "reviewed", "Employer could not update application status");

  await jordan.client.from("job_applications").delete().eq("id", application.data.id);
  await marcus.client.from("jobs").delete().eq("id", job.data.id);

  const signup = await anon.auth.signUp({
    email: `admin-attempt-${Date.now()}@tradeverified.dev`,
    password,
    options: { data: { first_name: "Not", last_name: "Admin", role: "admin", trade: "hvac" } },
  });
  assert(!signup.error, signup.error?.message ?? "signup failed");
  const createdId = signup.data.user?.id;
  assert(createdId, "signup did not return a user");
  if (!signup.data.session) {
    throw new Error("Signup did not create a session. Enable local auth confirmations off.");
  }
  const roleCheck = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${signup.data.session.access_token}` } },
  });
  const profile = await roleCheck.from("profiles").select("role").eq("id", createdId).single();
  assert(profile.data?.role === "tradesperson", `Signup with role=admin created ${profile.data?.role}`);

  console.log("Core flows passed: search, RLS, upload, admin review, apply, signup role lock.");
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
