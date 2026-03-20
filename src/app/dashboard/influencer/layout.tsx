import type { ReactNode } from 'react';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';

export default async function InfluencerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireDashboardRole('INFLUENCER');

  return children;
}
