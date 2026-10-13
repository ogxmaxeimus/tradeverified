import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Profile, UserRole } from '@/types/database';

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(role: UserRole | UserRole[]) {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(profile.role)) redirect('/dashboard');
  return profile;
}

export async function getTradespersonProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tradesperson_profiles')
    .select('*, profile:profiles(*)')
    .eq('user_id', userId)
    .single();
  return data;
}

export async function getCompany(ownerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', ownerId)
    .single();
  return data;
}
