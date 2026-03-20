import type { ReactNode } from 'react';
import RoleSidebar from '@/components/RoleSidebar';
import { type DashboardRoleKey } from '@/constants/role';

interface DashboardContactFrameProps {
  role: Extract<DashboardRoleKey, 'ADVERTISER' | 'INFLUENCER'>;
  children: ReactNode;
}

export default function DashboardContactFrame({ role, children }: DashboardContactFrameProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <RoleSidebar role={role} />
      <main className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
