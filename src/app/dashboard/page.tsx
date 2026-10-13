import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/auth';
import { TradespersonDashboard } from '@/components/dashboard/tradesperson-dashboard';
import { EmployerDashboard } from '@/components/dashboard/employer-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  switch (profile.role) {
    case 'tradesperson':
      return <TradespersonDashboard userId={profile.id} />;
    case 'employer':
      return <EmployerDashboard userId={profile.id} />;
    case 'admin':
      return <AdminDashboard />;
    default:
      redirect('/login');
  }
}
