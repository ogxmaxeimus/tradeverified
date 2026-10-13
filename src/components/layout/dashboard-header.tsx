'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DashboardMobileNav } from '@/components/layout/dashboard-mobile-nav';
import { getFullName } from '@/lib/utils';
import type { Profile } from '@/types/database';

export function DashboardHeader({ profile }: { profile: Profile }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center border-b border-gray-200 bg-white px-4 sm:px-6 dark:border-gray-800 dark:bg-gray-950">
      <DashboardMobileNav role={profile.role} />
      <div className="ml-auto flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <Avatar src={profile.avatar_url} firstName={profile.first_name} lastName={profile.last_name} size="sm" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {getFullName(profile.first_name, profile.last_name)}
            </p>
            <Badge variant={profile.subscription_tier === 'free' ? 'secondary' : 'verified'} className="text-[10px]">
              {profile.subscription_tier === 'free' ? 'Free' : profile.subscription_tier.toUpperCase()}
            </Badge>
          </div>
        </div>
        <button onClick={handleSignOut} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Sign out">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
