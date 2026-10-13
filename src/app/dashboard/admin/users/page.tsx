'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getFullName } from '@/lib/utils';
import type { Profile } from '@/types/database';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
      setUsers(data ?? []);
    }
    load();
  }, []);

  async function toggleVerified(userId: string, current: boolean) {
    const supabase = createClient();
    await supabase.from('profiles').update({ is_verified: !current }).eq('id', userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_verified: !current } : u));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Users</h1>
      <div className="space-y-2">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar src={user.avatar_url} firstName={user.first_name} lastName={user.last_name} size="sm" />
                <div>
                  <p className="font-medium">{getFullName(user.first_name, user.last_name)}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{user.role}</Badge>
                <Badge variant={user.is_verified ? 'verified' : 'secondary'}>
                  {user.is_verified ? 'Verified' : 'Unverified'}
                </Badge>
                <button
                  onClick={() => toggleVerified(user.id, user.is_verified)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Toggle
                </button>
                <Link href={`/dashboard/admin/users/${user.id}`}>
                  <Button size="sm" variant="outline">Edit profile</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
