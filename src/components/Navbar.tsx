'use client';

import Link from 'next/link';
import { Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial check with getSession (checks local storage first)
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          setProfile(data);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();

    // 2. Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    window.location.reload(); // Force refresh to clear any cached state
  };
  return (
    <nav className="h-[70px] bg-surface border-b border-border sticky top-0 z-[100] flex items-center">
      <div className="flex items-center justify-between w-[90%] max-w-[1200px] mx-auto">
        <Link href="/" className="text-2xl font-bold text-primary tracking-tighter">
          DAONVIEW
        </Link>

        <div className="flex items-center gap-8">
          <Link href="/campaigns" className="font-medium text-text-secondary hover:text-primary transition-colors">캠페인</Link>
          <Link href="/reviews" className="font-medium text-text-secondary hover:text-primary transition-colors">리뷰</Link>
          <Link href="/brand" className="font-medium text-text-secondary hover:text-primary transition-colors">브랜드존</Link>
          <Link href="/community" className="font-medium text-text-secondary hover:text-primary transition-colors">커뮤니티</Link>
          <Link href="/ai-service" className="flex items-center gap-1.5 font-bold text-sm bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full hover:shadow-lg hover:shadow-violet-500/30 transition-all hover:-translate-y-0.5 border-none">
            <Wand2 size={16} className="text-white" />
            <span>부가서비스</span>
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          {loading ? (
            // Skeleton / Loading state
            <div className="w-20 h-8 bg-slate-100 animate-pulse rounded"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                  {profile?.role === 'ADMIN' ? '관리자' : profile?.role === 'ADVERTISER' ? '광고주' : '인플루언서'}
                </span>
                <span className="text-sm font-bold text-text-main">{profile?.nickname || user.email?.split('@')[0]}님</span>
              </div>

              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 hover:underline transition-colors">
                로그아웃
              </button>

              {profile?.role === 'ADMIN' && (
                <Link href="/dashboard/admin" className="btn btn-primary py-2 text-xs">
                  관리페이지
                </Link>
              )}
              {profile?.role === 'ADVERTISER' && (
                <Link href="/dashboard/advertiser" className="btn btn-primary py-2 text-xs">
                  관리페이지
                </Link>
              )}
              {profile?.role === 'INFLUENCER' && (
                <Link href="/dashboard/influencer" className="btn btn-primary py-2 text-xs">
                  마이페이지
                </Link>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline py-2 text-sm">
                로그인
              </Link>
              <Link href="/signup" className="btn btn-primary py-2 text-sm">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
