import { requireRole } from '@/lib/auth';

export default async function TradespersonLayout({ children }: { children: React.ReactNode }) {
  await requireRole('tradesperson');
  return children;
}
