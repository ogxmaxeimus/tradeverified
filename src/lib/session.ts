import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "worker" | "employer" | "admin";

export type Viewer = {
  id: string;
  email: string | null;
  role: Role;
  fullName: string;
};

function isRole(value: string): value is Role {
  return value === "worker" || value === "employer" || value === "admin";
}

async function viewerFromClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Viewer | null> {
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", id)
    .maybeSingle();

  if (!profile || !isRole(profile.role)) return null;
  const email = data.claims.email;
  return {
    id,
    email: typeof email === "string" ? email : null,
    role: profile.role,
    fullName: profile.full_name,
  };
}

export async function getViewer() {
  const supabase = await createClient();
  return viewerFromClient(supabase);
}

export async function requireViewer() {
  const supabase = await createClient();
  const viewer = await viewerFromClient(supabase);
  if (!viewer) redirect("/login");
  return { supabase, viewer };
}

export async function requireRole(role: Role) {
  const session = await requireViewer();
  if (session.viewer.role !== role) {
    redirect("/dashboard?error=That page is for a different account type.");
  }
  return session;
}
