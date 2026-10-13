'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { TRADES, US_STATES, AVAILABILITY_OPTIONS } from '@/lib/constants';
import type { Profile, TradespersonProfile } from '@/types/database';

export default function TradespersonProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tradesperson, setTradesperson] = useState<TradespersonProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      const { data: tp } = await supabase.from('tradesperson_profiles').select('*').eq('user_id', user.id).single();
      setTradesperson(tp);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').update({
      first_name: form.get('first_name') as string,
      last_name: form.get('last_name') as string,
      phone: form.get('phone') as string,
      city: form.get('city') as string,
      state: form.get('state') as string,
      zip_code: form.get('zip_code') as string,
      bio: form.get('bio') as string,
    }).eq('id', user.id);

    const tradeData = {
      trade: form.get('trade') as string,
      years_experience: parseInt(form.get('years_experience') as string) || 0,
      hourly_rate: parseFloat(form.get('hourly_rate') as string) || null,
      availability: form.get('availability') as string,
      license_number: form.get('license_number') as string,
      headline: form.get('headline') as string,
    };

    if (tradesperson) {
      await supabase.from('tradesperson_profiles').update(tradeData).eq('id', tradesperson.id);
    } else {
      await supabase.from('tradesperson_profiles').insert({ ...tradeData, user_id: user.id });
    }

    setSaving(false);
    setMessage('Profile saved successfully!');
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    setProfile((p) => p ? { ...p, avatar_url: publicUrl } : p);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>

      <Card>
        <CardContent className="flex items-center gap-6 p-6">
          <Avatar src={profile?.avatar_url} firstName={profile?.first_name} lastName={profile?.last_name} size="xl" />
          <div>
            <label className="cursor-pointer">
              <span className="text-sm font-medium text-blue-600 hover:underline">Upload photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG. Max 5MB.</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Input id="first_name" name="first_name" label="First Name" defaultValue={profile?.first_name ?? ''} />
            <Input id="last_name" name="last_name" label="Last Name" defaultValue={profile?.last_name ?? ''} />
            <Input id="phone" name="phone" label="Phone" defaultValue={profile?.phone ?? ''} />
            <Input id="city" name="city" label="City" defaultValue={profile?.city ?? ''} />
            <Select id="state" name="state" label="State" defaultValue={profile?.state ?? ''} options={[{ value: '', label: 'Select state' }, ...US_STATES.map((s) => ({ value: s, label: s }))]} />
            <Input id="zip_code" name="zip_code" label="ZIP Code" defaultValue={profile?.zip_code ?? ''} />
            <div className="sm:col-span-2">
              <Textarea id="bio" name="bio" label="Bio" rows={4} defaultValue={profile?.bio ?? ''} placeholder="Tell employers about yourself..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Trade Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Select id="trade" name="trade" label="Primary Trade" defaultValue={tradesperson?.trade ?? ''} options={[{ value: '', label: 'Select trade' }, ...TRADES.map((t) => ({ value: t.value, label: t.label }))]} />
            <Input id="headline" name="headline" label="Headline" defaultValue={tradesperson?.headline ?? ''} placeholder="e.g. Master HVAC Technician" />
            <Input id="years_experience" name="years_experience" label="Years of Experience" type="number" defaultValue={tradesperson?.years_experience ?? 0} />
            <Input id="hourly_rate" name="hourly_rate" label="Hourly Rate ($)" type="number" step="0.01" defaultValue={tradesperson?.hourly_rate ?? ''} />
            <Select id="availability" name="availability" label="Availability" defaultValue={tradesperson?.availability ?? 'available'} options={AVAILABILITY_OPTIONS.map((a) => ({ value: a, label: a.charAt(0).toUpperCase() + a.slice(1).replace('-', ' ') }))} />
            <Input id="license_number" name="license_number" label="License Number" defaultValue={tradesperson?.license_number ?? ''} />
          </CardContent>
        </Card>

        {message && <p className="text-sm text-green-600">{message}</p>}
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
      </form>
    </div>
  );
}
