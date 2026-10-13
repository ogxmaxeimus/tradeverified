import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Building2, Search, ShieldCheck, Clock, Users, FileText,
  ArrowRight, CheckCircle, Filter, BadgeCheck, TrendingDown,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'For Employers — Hire Verified Trades Talent',
  description: 'Post jobs, search verified tradespeople, and hire skilled workers with confidence. Filter by trade, certification, and location.',
};

const benefits = [
  { icon: ShieldCheck, title: 'Hire with Confidence', desc: 'Every candidate can be verified — licenses, certifications, and reviews backed by proof of service.' },
  { icon: Filter, title: 'Powerful Filters', desc: 'Search by trade, certification, location, and experience to find exactly who you need.' },
  { icon: FileText, title: 'Unlimited Job Posts', desc: 'Post as many roles as you want and manage every application in one dashboard.' },
  { icon: Users, title: 'Build a Talent Pipeline', desc: 'Save promising candidates and reach back out when your next role opens.' },
  { icon: Clock, title: 'Hire Faster', desc: 'Skip the resume guesswork. Portfolios and verified credentials let you shortlist in minutes.' },
  { icon: TrendingDown, title: 'Reduce Bad Hires', desc: 'Verified work history and real reviews dramatically lower the risk of a costly mis-hire.' },
];

const steps = [
  { num: '1', title: 'Create your company profile', desc: 'Add your logo, details, and what makes you a great place to work.' },
  { num: '2', title: 'Post your jobs', desc: 'Specify trade, certifications, pay, and location requirements.' },
  { num: '3', title: 'Search & filter talent', desc: 'Browse verified tradespeople and review portfolios and ratings.' },
  { num: '4', title: 'Connect & hire', desc: 'Applications come to you — review, save, and contact candidates directly.' },
];

export default function ForEmployersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              <Building2 className="h-4 w-4" />
              The hiring platform for skilled trades employers
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Hire skilled trades talent you can <span className="text-blue-300">actually trust</span>
            </h1>
            <p className="mt-6 text-lg text-blue-100 sm:text-xl max-w-2xl">
              Stop sorting through unverified resumes. Search a marketplace of verified HVAC techs, plumbers, electricians, welders, and more — with real credentials and proof-backed reviews.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/signup?role=employer">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 w-full sm:w-auto">
                  Start hiring <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                  Browse the talent pool
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-blue-200">$99/month for unlimited job posts and full candidate search. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* Cost of bad hire */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">A bad trades hire is expensive</h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Rework, safety incidents, failed inspections, and lost client trust add up fast. The fix isn&apos;t more resumes — it&apos;s better signal before you hire.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Verified licenses and certifications, not self-reported claims',
                  'Portfolio photos that show real workmanship',
                  'Reviews from customers with proof of service',
                  'Complete work history at a glance',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <BadgeCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
              <CardContent className="p-8">
                <p className="text-5xl font-bold text-blue-700 dark:text-blue-300">$17K+</p>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Average cost of a single bad hire (U.S. Dept. of Labor estimates). Verification pays for itself many times over.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Everything you need to hire well</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <Card key={b.title}>
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 mb-4">
                    <b.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Hiring in 4 simple steps</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">{s.num}</div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing callout */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-blue-500">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Employer plan — $99/month</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Everything you need to find and hire verified trades talent.</p>
              <div className="mt-6 grid sm:grid-cols-2 gap-3 text-left">
                {['Unlimited job posts', 'Full candidate search & filters', 'Save candidates', 'Contact workers directly', 'View portfolios & reviews', 'Application management'].map((f) => (
                  <span key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500" /> {f}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup?role=employer"><Button size="lg">Start hiring</Button></Link>
                <Link href="/pricing"><Button size="lg" variant="outline">See Enterprise options</Button></Link>
              </div>
              <p className="mt-4 text-sm text-gray-400">Hiring at scale? <Link href="/contact" className="text-blue-600 hover:underline">Talk to us about Enterprise</Link>.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Search className="mx-auto h-12 w-12 text-white mb-4" />
          <h2 className="text-3xl font-bold text-white">Find your next great hire today</h2>
          <p className="mt-4 text-lg text-blue-100">Post a job in minutes and start reviewing verified candidates.</p>
          <div className="mt-8">
            <Link href="/signup?role=employer">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">Get started</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
