'use client';

import AdminSidebar from '@/components/AdminSidebar';
import AdvertiserSidebar from '@/components/AdvertiserSidebar';
import InfluencerSidebar from '@/components/InfluencerSidebar';
import { type DashboardRoleKey } from '@/constants/role';

interface RoleSidebarProps {
  role: DashboardRoleKey;
}

export default function RoleSidebar({ role }: RoleSidebarProps) {
  if (role === 'ADMIN') return <AdminSidebar />;
  if (role === 'ADVERTISER') return <AdvertiserSidebar />;

  return <InfluencerSidebar />;
}
