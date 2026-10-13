"use server";

import { redirect } from "next/navigation";
import { isTrade } from "@/lib/constants";
import { field, safeNextPath } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string };

export async function signIn(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");
  const next = safeNextPath(formData.get("next") ?? "/dashboard");
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect(next);
}

export async function signUp(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = field(formData, "full_name");
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");
  const role = field(formData, "role");
  const trade = field(formData, "trade");
  const company = field(formData, "company_name");
  const city = field(formData, "city");
  const state = field(formData, "state").toUpperCase();

  if (fullName.length < 2) return { error: "Enter your name." };
  if (!email.includes("@")) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Use at least 8 characters for the password." };
  if (role !== "worker" && role !== "employer") {
    return { error: "Choose worker or employer. Admin accounts are assigned separately." };
  }
  if (role === "worker" && !isTrade(trade)) return { error: "Choose a trade." };
  if (role === "employer" && company.length < 2) return { error: "Enter a company name." };
  if (state && !/^[A-Z]{2}$/.test(state)) return { error: "Choose a two-letter state." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        trade: role === "worker" ? trade : "",
        company_name: role === "employer" ? company : "",
        city,
        state,
      },
    },
  });

  if (error) return { error: error.message };
  if (!data.session) {
    return {
      error: "Account created. Confirm the email, then sign in. Local pilot mode usually signs you in immediately.",
    };
  }
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
