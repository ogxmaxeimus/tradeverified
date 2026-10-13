import { NextResponse } from 'next/server';
import { getStripe, TIER_FROM_PRICE } from '@/lib/stripe/config';
import { createServiceClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const tier = session.metadata?.tier;
      if (userId && tier) {
        await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', userId);
        if (tier === 'pro') {
          await supabase.from('profiles').update({ is_featured: true }).eq('id', userId);
        }
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionItem = subscription.items.data[0];
      const priceId = subscriptionItem?.price.id;
      const tier = priceId ? (TIER_FROM_PRICE[priceId] ?? 'free') : 'free';
      const customerId = subscription.customer as string;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        const status = subscription.status;
        const effectiveTier = status === 'active' || status === 'trialing' ? tier : 'free';
        await supabase.from('profiles').update({
          subscription_tier: effectiveTier,
          is_featured: effectiveTier === 'pro',
        }).eq('id', profile.id);

        const periodStart = subscriptionItem?.current_period_start;
        const periodEnd = subscriptionItem?.current_period_end;

        await supabase.from('subscriptions').upsert({
          user_id: profile.id,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          tier: effectiveTier as 'free' | 'pro' | 'employer' | 'enterprise',
          status: status as 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete',
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, { onConflict: 'stripe_subscription_id' });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        await supabase.from('profiles').update({
          subscription_tier: 'free',
          is_featured: false,
        }).eq('id', profile.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
