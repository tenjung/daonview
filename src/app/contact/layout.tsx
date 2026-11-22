import ContactSidebar from '@/components/contact/ContactSidebar';
import { getRequestAuth } from '@/lib/auth/requestAuth';

export default async function ContactLayout({ children }: { children: React.ReactNode }) {
  const { user, role: normalizedRole, profileError } = await getRequestAuth();
  if (profileError) throw new Error(profileError);
  const shouldShowLocalSidebar = !user || (normalizedRole !== 'ADVERTISER' && normalizedRole !== 'INFLUENCER');

  return (
    <div className="container max-w-6xl py-10 md:py-14">
      <div className={`flex flex-col gap-6 ${shouldShowLocalSidebar ? 'md:flex-row md:items-start' : ''}`}>
        {shouldShowLocalSidebar ? <ContactSidebar /> : null}
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
