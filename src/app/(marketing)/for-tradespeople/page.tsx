import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Shield, Star, Award, Image as ImageIcon, TrendingUp, BadgeCheck,
  Hammer, ArrowRight, CheckCircle, DollarSign, Search,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TRADES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'For Tradespeople — Get Hired & Get Verified',
  description: 'Build a verified profile, showcase your work, earn trusted reviews, and land better-paying jobs in the skilled trades.',
};

const benefits = [
  { icon: BadgeCheck, title: 'Get Verified', desc: 'Upload your licenses and certifications. A verification badge tells employers you are the real deal.' },
  { icon: ImageIcon, title: 'Show Your Work', desc: 'Before/after photos and project galleries prove your craftsmanship better than any resume.' },
  { icon: Star, title: 'Earn Real Reviews', desc: 'Reviews come only from verified customers with proof of service — so your reputation actually means something.' },
  { icon: Search, title: 'Get Found', desc: 'Employers search by trade, location, and certifications. A complete profile puts you in front of them.' },
  { icon: TrendingUp, title: 'Track Your Growth', desc: 'See who viewed your profile and how your applications are doing with built-in analytics.' },
  { icon: DollarSign, title: 'Win Better Jobs', desc: 'Apply directly to quality postings and let your verified profile do the negotiating for you.' },
];

const steps = [
  { num: '1', title: 'Create your free profile', desc: 'Add your trade, experience, and contact info in minutes.' },
  { num: '2', title: 'Upload proof', desc: 'Certifications, licenses, and portfolio photos of your best work.' },
  { num: '3', title: 'Get verified', desc: 'Our team reviews your credentials and adds your verification badge.' },
  { num: '4', title: 'Start getting hired', desc: 'Apply to jobs and let employers find you in the marketplace.' },
];

export default function ForTradespeoplePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-700 to-amber-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              <Hammer className="h-4 w-4" />
              Built for the trades — by people who respect the trades
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Your skills deserve to be <span className="text-amber-200">seen and trusted</span>
            </h1>
            <p className="mt-6 text-lg text-orange-100 sm:text-xl max-w-2xl">
              Stop competing on price against unverified bidders. Build a profile that proves your craft, earns real reviews, and gets you in front of employers who pay for quality.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/signup?role=tradesperson">
                <Button size="lg" className="bg-white text-orange-700 hover:bg-orange-50 w-full sm:w-auto">
                  Create your free profile <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                  See who&apos;s on the platform
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-orange-200">Free to start. No credit card. Upgrade to Pro only when you&apos;re ready.</p>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sound familiar?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              'Losing jobs to cheaper, unlicensed competitors',
              'Great work that nobody outside word-of-mouth ever sees',
              'Reviews scattered across sites that anyone can fake',
            ].map((pain) => (
              <Card key={pain} className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <p className="text-gray-700 dark:text-gray-300">&ldquo;{pain}&rdquo;</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center mt-8 text-lg text-gray-600 dark:text-gray-400">
            TradeVerified fixes all three — by making <strong>verification</strong> your competitive advantage.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Everything you need to stand out</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400">One profile that works as hard as you do.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <Card key={b.title}>
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40 mb-4">
                    <b.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{b.title}</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">From signup to hired in 4 steps</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-xl font-bold text-white">{s.num}</div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trades */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Every trade is welcome</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {TRADES.map((t) => (
              <span key={t.value} className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                <span className="text-lg">{t.icon}</span> {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pro upsell */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-orange-500">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-6 w-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Go Pro for $19/month</h2>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-6">When you&apos;re ready to win more work, Pro pays for itself with one job.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {['Unlimited portfolio uploads', 'Featured placement in search', 'Verification badge', 'Profile analytics', 'Priority in results', 'Stand out from free profiles'].map((f) => (
                  <span key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500" /> {f}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/signup?role=tradesperson"><Button size="lg">Start free</Button></Link>
                <Link href="/pricing"><Button size="lg" variant="outline">Compare plans</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-orange-600 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Shield className="mx-auto h-12 w-12 text-white mb-4" />
          <h2 className="text-3xl font-bold text-white">Your reputation, verified. Your work, seen.</h2>
          <p className="mt-4 text-lg text-orange-100">Join thousands of tradespeople building their future on TradeVerified.</p>
          <div className="mt-8">
            <Link href="/signup?role=tradesperson">
              <Button size="lg" className="bg-white text-orange-700 hover:bg-orange-50">Create your free profile</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
