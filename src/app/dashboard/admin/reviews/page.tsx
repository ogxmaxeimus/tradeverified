'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import type { Review } from '@/types/database';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles(first_name, last_name)')
        .eq('status', filter)
        .order('created_at', { ascending: false });
      setReviews(data ?? []);
    }
    load();
  }, [filter]);

  async function moderate(id: string, status: 'approved' | 'rejected') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('reviews').update({
      status,
      is_public: status === 'approved',
      moderated_by: user?.id,
      moderated_at: new Date().toISOString(),
    }).eq('id', id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Moderation</h1>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'flagged'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <StarRating rating={review.rating} size="sm" />
                  {review.title && <h3 className="font-semibold mt-1">{review.title}</h3>}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    By {review.reviewer?.first_name} {review.reviewer?.last_name}
                  </p>
                </div>
                {filter === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => moderate(review.id, 'approved')}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => moderate(review.id, 'rejected')}>Reject</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {reviews.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-gray-500">No {filter} reviews.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
