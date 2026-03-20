import type { ReactNode } from 'react';
import DashboardContactFrame from '@/components/contact/DashboardContactFrame';

export default function InfluencerContactLayout({ children }: { children: ReactNode }) {
  return <DashboardContactFrame role="INFLUENCER">{children}</DashboardContactFrame>;
}
