import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  coerceDashboardRole,
  getRoleDashboardPath,
  type DashboardRoleKey,
} from '@/constants/role';

interface RequireDashboardRoleResult {
  userId: string;
  role: DashboardRoleKey;
}

export async function requireDashboardRole(
  requiredRole: DashboardRoleKey
): Promise<RequireDashboardRoleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const normalizedRole = coerceDashboardRole(profile?.role || user.user_metadata?.role);

  if (!normalizedRole) {
    redirect('/login');
  }

  if (normalizedRole !== requiredRole) {
    redirect(getRoleDashboardPath(normalizedRole));
  }

  return {
    userId: user.id,
    role: normalizedRole,
  };
}
