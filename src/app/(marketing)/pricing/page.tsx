'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PRICING } from '@/lib/constants';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(tier: 'pro' | 'employer') {
    setLoading(tier);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const { url } = await res.json();
      if (url) router.push(url);
    } catch {
      alert('Please sign in first to subscribe.');
    }
    setLoading(null);
  }

  const plans: {
    key: string;
    name: string;
    price: number | null;
    features: string[];
    cta: string;
    href?: string;
    popular?: boolean;
  }[] = [
    { key: 'free', ...PRICING.free, cta: 'Get Started', href: '/signup' },
    { key: 'pro', ...PRICING.pro, cta: 'Upgrade to Pro', popular: true },
    { key: 'employer', ...PRICING.employer, cta: 'Start Hiring' },
    { key: 'enterprise', ...PRICING.enterprise, cta: 'Contact Sales', href: '/contact' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50 dark:bg-gray-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Simple, Transparent Pricing</h1>
            <p className="mt-4 text-lg text-gray-500">Choose the plan that fits your needs. Upgrade or downgrade anytime.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card key={plan.key} className={`relative flex flex-col ${plan.popular ? 'border-blue-500 border-2 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.price !== null ? (
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${plan.price}<span className="text-sm font-normal text-gray-500">/mo</span>
                      </span>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">Custom</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    {plan.href ? (
                      <Link href={plan.href}><Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>{plan.cta}</Button></Link>
                    ) : (
                      <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} onClick={() => handleSubscribe(plan.key as 'pro' | 'employer')} disabled={loading === plan.key}>
                        {loading === plan.key ? 'Loading...' : plan.cta}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
