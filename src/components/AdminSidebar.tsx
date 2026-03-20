import { Suspense } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { ADMIN_NAV } from '@/constants/navigation';
import type { CampaignCounts } from '@/lib/adminUtils';

interface AdminSidebarProps {
  initialCounts?: CampaignCounts;
}

export default function AdminSidebar({ initialCounts }: AdminSidebarProps) {
  return (
    <Suspense fallback={<div className="w-[260px] shrink-0 border-r border-slate-100 bg-white" />}>
      <DashboardSidebar
        userType="ADMIN"
        userName="관리자"
        links={ADMIN_NAV}
        initialCounts={initialCounts}
      />
    </Suspense>
  );
}
