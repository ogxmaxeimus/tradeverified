'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getFullName } from '@/lib/utils';
import { getProfilePath } from '@/lib/dashboard-nav';
import type { Profile } from '@/types/database';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
    load();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (!profile) {
    return <div className="text-gray-500">Loading settings...</div>;
  }

  const profilePath = getProfilePath(profile.role);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{getFullName(profile.first_name, profile.last_name) || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Account type</p>
            <Badge className="mt-1 capitalize">{profile.role}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500">Plan</p>
            <Badge variant={profile.subscription_tier === 'free' ? 'secondary' : 'verified'} className="mt-1 capitalize">
              {profile.subscription_tier}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile & billing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Link href={profilePath}>
            <Button variant="outline">Edit {profile.role === 'employer' ? 'Company' : 'Profile'}</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline">View plans</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut}>Sign out</Button>
        </CardContent>
      </Card>
    </div>
  );
}
