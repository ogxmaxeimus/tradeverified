import Link from 'next/link';
import { Shield, Star, Briefcase, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TRADES } from '@/lib/constants';

const features = [
  {
    icon: Shield,
    title: 'Verified Profiles',
    description: 'Every tradesperson is verified with certifications, work history, and customer reviews backed by proof of service.',
  },
  {
    icon: Star,
    title: 'Trusted Reviews',
    description: 'Only verified customers can leave reviews. Upload proof of service for authentic, trustworthy ratings.',
  },
  {
    icon: Briefcase,
    title: 'Job Board',
    description: 'Find your next opportunity. Search jobs by trade, location, and certification requirements.',
  },
  {
    icon: Users,
    title: 'Employer Tools',
    description: 'Post jobs, search qualified workers, filter by trade and certifications, and manage applications.',
  },
];

const stats = [
  { value: '50K+', label: 'Verified Tradespeople' },
  { value: '10K+', label: 'Active Jobs' },
  { value: '4.8', label: 'Average Rating' },
  { value: '98%', label: 'Satisfaction Rate' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              <Shield className="h-4 w-4" />
              Trusted by 50,000+ trades professionals
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              The Professional Network for{' '}
              <span className="text-blue-200">Skilled Trades</span>
            </h1>
            <p className="mt-6 text-lg text-blue-100 sm:text-xl max-w-2xl">
              Build your verified profile, showcase your work, earn trusted reviews, and connect with employers looking for top talent.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/signup?role=tradesperson">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 w-full sm:w-auto">
                  Join as Tradesperson
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup?role=employer">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                  Hire Workers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trades */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Every Trade, One Platform</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400">From HVAC to welding, find verified professionals in every skilled trade.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {TRADES.map((trade) => (
              <Link key={trade.value} href={`/marketplace?trade=${trade.value}`}>
                <Card className="hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{trade.icon}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{trade.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Why TradeVerified?</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400">Built specifically for the skilled trades industry.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to Get Verified?</h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            Join thousands of skilled trades professionals building their reputation on TradeVerified.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                Create Free Profile
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                View Pricing
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-blue-200">
            {['Free basic profile', 'Verified reviews', 'Portfolio showcase', 'Job applications'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
