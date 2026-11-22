'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PartnerNavbar from '@/components/PartnerNavbar';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AppShellProps {
  children: React.ReactNode;
  initialUser?: SupabaseUser | null;
  initialProfile?: Profile | null;
}

export default function AppShell({ children, initialUser, initialProfile }: AppShellProps) {
  const pathname = usePathname();
  const profileError = useAuthStore((state) => state.profileError);
  const isSigningOut = useAuthStore((state) => state.isSigningOut);
  const isLandingPage = pathname.startsWith('/lp/');
  const needsDashboardLogin = useAuthStore(
    (state) => pathname.startsWith('/dashboard/') &&
      state.isInitialized && !state.user && !state.isSigningOut,
  );

  useEffect(() => {
    if (!needsDashboardLogin) return;

    const returnTo = pathname === '/dashboard/influencer' || pathname === '/dashboard/influencer/reviews'
      ? `/login?returnTo=${encodeURIComponent(pathname)}`
      : '/login';
    window.location.replace(returnTo);
  }, [needsDashboardLogin, pathname]);

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
      <main className="flex-1" inert={isSigningOut}>
        {profileError && <div role="alert" className="mx-auto max-w-6xl p-4 text-sm text-red-700">
          {profileError}
          <button className="ml-3 underline" onClick={() => {
            const { user, fetchProfile } = useAuthStore.getState();
            if (user) void fetchProfile(user.id);
          }}>다시 시도</button>
        </div>}
        {!needsDashboardLogin && children}
      </main>
      {!isLandingPage && <Footer />}
    </>
  );
}
