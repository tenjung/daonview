import type { ReactNode } from 'react';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireDashboardRole('ADMIN');

  return children;
}
