'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PartnerNavbar from '@/components/PartnerNavbar';
import Footer from '@/components/Footer';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AppShellProps {
  children: React.ReactNode;
  initialUser?: SupabaseUser | null;
  initialProfile?: Profile | null;
}

export default function AppShell({ children, initialUser, initialProfile }: AppShellProps) {
  const pathname = usePathname();
  const isLandingPage = pathname.startsWith('/lp/');
  const isPartnerPage = pathname.startsWith('/partner');

  return (
    <>
      {!isLandingPage && (
        isPartnerPage ? (
          <PartnerNavbar initialUser={initialUser} initialProfile={initialProfile} />
        ) : (
          <Navbar initialUser={initialUser} initialProfile={initialProfile} />
        )
      )}
      <main className="flex-1">
        {children}
      </main>
      {!isLandingPage && <Footer />}
    </>
  );
}
