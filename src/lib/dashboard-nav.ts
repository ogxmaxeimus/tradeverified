import {
  LayoutDashboard, User, Briefcase, Award, Image, BarChart3,
  Building2, Search, Users, Star, FileText,
} from 'lucide-react';
import type { UserRole } from '@/types/database';

export interface DashboardNavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const dashboardLinksByRole: Record<UserRole, DashboardNavLink[]> = {
  tradesperson: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/tradesperson/profile', label: 'Profile', icon: User },
    { href: '/dashboard/tradesperson/portfolio', label: 'Portfolio', icon: Image },
    { href: '/dashboard/tradesperson/certifications', label: 'Certifications', icon: Award },
    { href: '/dashboard/tradesperson/jobs', label: 'My Applications', icon: Briefcase },
    { href: '/dashboard/tradesperson/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  employer: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/employer/company', label: 'Company', icon: Building2 },
    { href: '/dashboard/employer/jobs', label: 'Job Postings', icon: FileText },
    { href: '/dashboard/employer/search', label: 'Find Workers', icon: Search },
    { href: '/dashboard/employer/candidates', label: 'Saved Candidates', icon: Users },
  ],
  admin: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/admin/users', label: 'Users', icon: Users },
    { href: '/dashboard/admin/reviews', label: 'Reviews', icon: Star },
    { href: '/dashboard/admin/certifications', label: 'Certifications', icon: Award },
    { href: '/dashboard/admin/jobs', label: 'Job Postings', icon: Briefcase },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ],
};

export function getProfilePath(role: UserRole): string {
  if (role === 'tradesperson') return '/dashboard/tradesperson/profile';
  if (role === 'employer') return '/dashboard/employer/company';
  return '/dashboard';
}
