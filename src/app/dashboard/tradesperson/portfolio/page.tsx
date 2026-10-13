'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PortfolioItem } from '@/types/database';

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [tradespersonId, setTradespersonId] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: tp } = await supabase.from('tradesperson_profiles').select('id').eq('user_id', user.id).single();
      if (!tp) return;
      setTradespersonId(tp.id);
      const { data } = await supabase.from('portfolio_items').select('*').eq('tradesperson_id', tp.id).order('created_at', { ascending: false });
      setItems(data ?? []);
    }
    load();
  }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let beforeUrl = null;
    let afterUrl = null;
    const beforeFile = form.get('before_image') as File;
    const afterFile = form.get('after_image') as File;

    if (beforeFile?.size > 0) {
      const path = `${user.id}/${Date.now()}-before.${beforeFile.name.split('.').pop()}`;
      await supabase.storage.from('portfolio').upload(path, beforeFile);
      beforeUrl = supabase.storage.from('portfolio').getPublicUrl(path).data.publicUrl;
    }
    if (afterFile?.size > 0) {
      const path = `${user.id}/${Date.now()}-after.${afterFile.name.split('.').pop()}`;
      await supabase.storage.from('portfolio').upload(path, afterFile);
      afterUrl = supabase.storage.from('portfolio').getPublicUrl(path).data.publicUrl;
    }

    const { data } = await supabase.from('portfolio_items').insert({
      tradesperson_id: tradespersonId,
      title: form.get('title') as string,
      description: form.get('description') as string,
      before_image_url: beforeUrl,
      after_image_url: afterUrl,
      completed_at: form.get('completed_at') as string || null,
    }).select().single();

    if (data) setItems((prev) => [data, ...prev]);
    setShowForm(false);
    (e.target as HTMLFormElement).reset();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('portfolio_items').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Add Project</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add Portfolio Project</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <Input id="title" name="title" label="Project Title" required />
              <Textarea id="description" name="description" label="Description" rows={3} />
              <Input id="completed_at" name="completed_at" label="Completion Date" type="date" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Before Photo</label>
                  <input type="file" name="before_image" accept="image/*" className="text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">After Photo</label>
                  <input type="file" name="after_image" accept="image/*" className="text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save Project</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center p-12 text-center">
            <p className="text-gray-500">No portfolio items yet. Add your first project to showcase your work.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="grid grid-cols-2 gap-0.5 bg-gray-200 dark:bg-gray-800">
                {item.before_image_url && (
                  <div className="aspect-square bg-gray-100 dark:bg-gray-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.before_image_url} alt="Before" className="h-full w-full object-cover" />
                  </div>
                )}
                {item.after_image_url && (
                  <div className="aspect-square bg-gray-100 dark:bg-gray-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.after_image_url} alt="After" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                    {item.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>}
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
