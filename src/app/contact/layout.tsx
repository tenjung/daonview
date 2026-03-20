import ContactSidebar from '@/components/contact/ContactSidebar';
import { coerceDashboardRole } from '@/constants/role';
import { createClient } from '@/lib/supabase/server';

export default async function ContactLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let shouldShowLocalSidebar = true;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const normalizedRole = coerceDashboardRole(profile?.role || user.user_metadata?.role);
    shouldShowLocalSidebar = normalizedRole !== 'ADVERTISER' && normalizedRole !== 'INFLUENCER';
  }

  return (
    <div className="container max-w-6xl py-10 md:py-14">
      <div className={`flex flex-col gap-6 ${shouldShowLocalSidebar ? 'md:flex-row md:items-start' : ''}`}>
        {shouldShowLocalSidebar ? <ContactSidebar /> : null}
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
