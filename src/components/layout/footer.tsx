import Link from 'next/link';
import { Shield } from 'lucide-react';
import { SITE_NAME } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-gray-900 dark:text-white">{SITE_NAME}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              The professional network for skilled trades workers.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/for-tradespeople" className="hover:text-blue-600">For Tradespeople</Link></li>
              <li><Link href="/for-employers" className="hover:text-blue-600">For Employers</Link></li>
              <li><Link href="/marketplace" className="hover:text-blue-600">Find Workers</Link></li>
              <li><Link href="/jobs" className="hover:text-blue-600">Job Board</Link></li>
              <li><Link href="/pricing" className="hover:text-blue-600">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Trades</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/marketplace?trade=hvac" className="hover:text-blue-600">HVAC</Link></li>
              <li><Link href="/marketplace?trade=plumbing" className="hover:text-blue-600">Plumbing</Link></li>
              <li><Link href="/marketplace?trade=electrical" className="hover:text-blue-600">Electrical</Link></li>
              <li><Link href="/marketplace?trade=welding" className="hover:text-blue-600">Welding</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-blue-600">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
