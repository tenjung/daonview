import type { ReactNode } from 'react';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';

export default async function AdvertiserDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireDashboardRole('ADVERTISER');

  return children;
}
