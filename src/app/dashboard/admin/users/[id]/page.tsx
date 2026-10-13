'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { US_STATES } from '@/lib/constants';
import type { Profile } from '@/types/database';

const ROLE_OPTIONS = [
  { value: 'tradesperson', label: 'Tradesperson' },
  { value: 'employer', label: 'Employer' },
  { value: 'admin', label: 'Admin' },
];

export default function AdminEditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [userId]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.from('profiles').update({
      first_name: form.get('first_name') as string,
      last_name: form.get('last_name') as string,
      phone: form.get('phone') as string,
      city: form.get('city') as string,
      state: form.get('state') as string,
      zip_code: form.get('zip_code') as string,
      bio: form.get('bio') as string,
      role: form.get('role') as string,
      is_verified: form.get('is_verified') === 'on',
      is_featured: form.get('is_featured') === 'on',
    }).eq('id', userId);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push('/dashboard/admin/users');
    router.refresh();
  }

  if (loading) return <div className="text-gray-500">Loading user...</div>;
  if (!profile) return <div className="text-gray-500">User not found.</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/admin/users" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> Back to Manage Users
      </Link>

      <div className="flex items-center gap-4">
        <Avatar src={profile.avatar_url} firstName={profile.first_name} lastName={profile.last_name} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
          <p className="text-gray-500">{profile.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Input id="first_name" name="first_name" label="First Name" defaultValue={profile.first_name ?? ''} />
            <Input id="last_name" name="last_name" label="Last Name" defaultValue={profile.last_name ?? ''} />
            <Input id="phone" name="phone" label="Phone" defaultValue={profile.phone ?? ''} />
            <Input id="city" name="city" label="City" defaultValue={profile.city ?? ''} />
            <Select id="state" name="state" label="State" defaultValue={profile.state ?? ''} options={[{ value: '', label: 'Select state' }, ...US_STATES.map((s) => ({ value: s, label: s }))]} />
            <Input id="zip_code" name="zip_code" label="ZIP Code" defaultValue={profile.zip_code ?? ''} />
            <div className="sm:col-span-2">
              <Textarea id="bio" name="bio" label="Bio" rows={4} defaultValue={profile.bio ?? ''} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Account & Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select id="role" name="role" label="Role" defaultValue={profile.role} options={ROLE_OPTIONS} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_verified" defaultChecked={profile.is_verified} className="h-4 w-4" />
              Verified
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_featured" defaultChecked={profile.is_featured} className="h-4 w-4" />
              Featured
            </label>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save & Return'}</Button>
          <Link href="/dashboard/admin/users"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
