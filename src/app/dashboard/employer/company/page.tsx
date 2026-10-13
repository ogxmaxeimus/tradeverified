'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { US_STATES, COMPANY_SIZES } from '@/lib/constants';
import type { Company } from '@/types/database';

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('companies').select('*').eq('owner_id', user.id).single();
      setCompany(data);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const companyData = {
      name: form.get('name') as string,
      description: form.get('description') as string,
      website: form.get('website') as string,
      industry: form.get('industry') as string,
      size: form.get('size') as string,
      city: form.get('city') as string,
      state: form.get('state') as string,
      zip_code: form.get('zip_code') as string,
      phone: form.get('phone') as string,
      email: form.get('email') as string,
    };

    if (company) {
      await supabase.from('companies').update(companyData).eq('id', company.id);
    } else {
      const { data } = await supabase.from('companies').insert({ ...companyData, owner_id: user.id }).select().single();
      setCompany(data);
    }

    setSaving(false);
    setMessage('Company profile saved!');
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const path = `${user.id}/logo.${file.name.split('.').pop()}`;
    await supabase.storage.from('company-logos').upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(path);
    await supabase.from('companies').update({ logo_url: publicUrl }).eq('id', company.id);
    setCompany((c) => c ? { ...c, logo_url: publicUrl } : c);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Profile</h1>

      {company?.logo_url && (
        <Card>
          <CardContent className="flex items-center gap-6 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={company.logo_url} alt="Company logo" className="h-20 w-20 rounded-lg object-cover" />
            <label className="cursor-pointer">
              <span className="text-sm font-medium text-blue-600 hover:underline">Change logo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input id="name" name="name" label="Company Name" defaultValue={company?.name ?? ''} required />
            </div>
            <div className="sm:col-span-2">
              <Textarea id="description" name="description" label="Description" rows={4} defaultValue={company?.description ?? ''} />
            </div>
            <Input id="website" name="website" label="Website" defaultValue={company?.website ?? ''} />
            <Input id="industry" name="industry" label="Industry" defaultValue={company?.industry ?? ''} />
            <Select id="size" name="size" label="Company Size" defaultValue={company?.size ?? ''} options={[{ value: '', label: 'Select size' }, ...COMPANY_SIZES.map((s) => ({ value: s, label: s + ' employees' }))]} />
            <Input id="phone" name="phone" label="Phone" defaultValue={company?.phone ?? ''} />
            <Input id="email" name="email" label="Email" type="email" defaultValue={company?.email ?? ''} />
            <Input id="city" name="city" label="City" defaultValue={company?.city ?? ''} />
            <Select id="state" name="state" label="State" defaultValue={company?.state ?? ''} options={[{ value: '', label: 'Select state' }, ...US_STATES.map((s) => ({ value: s, label: s }))]} />
            <Input id="zip_code" name="zip_code" label="ZIP Code" defaultValue={company?.zip_code ?? ''} />
          </CardContent>
        </Card>
        {message && <p className="text-sm text-green-600">{message}</p>}
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Company Profile'}</Button>
      </form>
    </div>
  );
}
