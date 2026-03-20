import type { ReactNode } from 'react';
import DashboardContactFrame from '@/components/contact/DashboardContactFrame';

export default function AdvertiserContactLayout({ children }: { children: ReactNode }) {
  return <DashboardContactFrame role="ADVERTISER">{children}</DashboardContactFrame>;
}
