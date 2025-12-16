'use client';

import Link from 'next/link';
import { Wand2, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
    router.push('/');
    window.location.reload(); // Force refresh to clear any cached state
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Helper function to check if link is active
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="h-[70px] bg-surface border-b border-border sticky top-0 z-[100] flex items-center">
      <div className="flex items-center justify-between w-[90%] max-w-[1200px] mx-auto h-full">
        {/* Logo */}
        <Link href="/" className="text-xl md:text-2xl font-bold text-primary tracking-tighter">
          DAONVIEW
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8 h-full">
          <Link 
            href="/campaigns" 
            className={`font-medium transition-colors h-full flex items-center border-b-[3px] ${
              isActive('/campaigns') 
                ? 'text-primary border-primary' 
                : 'text-text-secondary border-transparent hover:text-primary'
            }`}
          >
            캠페인
          </Link>
          <Link 
            href="/reviews" 
            className={`font-medium transition-colors h-full flex items-center border-b-[3px] ${
              isActive('/reviews') 
                ? 'text-primary border-primary' 
                : 'text-text-secondary border-transparent hover:text-primary'
            }`}
          >
            리뷰
          </Link>
          <Link 
            href="/brand" 
            className={`font-medium transition-colors h-full flex items-center border-b-[3px] ${
              isActive('/brand') 
                ? 'text-primary border-primary' 
                : 'text-text-secondary border-transparent hover:text-primary'
            }`}
          >
            브랜드존
          </Link>
          <Link 
            href="/community" 
            className={`font-medium transition-colors h-full flex items-center border-b-[3px] ${
              isActive('/community') 
                ? 'text-primary border-primary' 
                : 'text-text-secondary border-transparent hover:text-primary'
            }`}
          >
            커뮤니티
          </Link>
          <Link href="/ai-service" className="flex items-center gap-1.5 font-bold text-sm bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full hover:shadow-lg hover:shadow-violet-500/30 transition-all hover:-translate-y-0.5 border-none">
            <Wand2 size={16} className="text-white" />
            <span>부가서비스</span>
          </Link>
        </div>

        {/* Desktop User Menu */}
        <div className="hidden lg:flex gap-4 items-center">
          {loading ? (
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

        {/* Mobile: User Info + Hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          {/* Mobile User Info */}
          {!loading && user && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-main truncate max-w-[80px]">
                {profile?.nickname || user.email?.split('@')[0]}님
              </span>
            </div>
          )}

          {/* Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-text-main hover:text-primary transition-colors"
            aria-label="메뉴"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-[70px] right-0 h-[calc(100vh-70px)] w-[280px] bg-white shadow-2xl z-[95] transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          {/* User Info Section */}
          {user && (
            <div className="p-6 border-b border-border bg-rose-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded text-xs font-bold bg-white text-primary">
                  {profile?.role === 'ADMIN' ? '관리자' : profile?.role === 'ADVERTISER' ? '광고주' : '인플루언서'}
                </span>
              </div>
              <p className="text-sm font-bold text-text-main">
                {profile?.nickname || user.email?.split('@')[0]}님
              </p>
              <p className="text-xs text-gray-500 mt-1">{user.email}</p>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-2">
              <Link
                href="/campaigns"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 ${
                  isActive('/campaigns')
                    ? 'bg-rose-50 text-primary border-primary'
                    : 'text-text-secondary border-transparent hover:bg-rose-50 hover:text-primary'
                }`}
              >
                캠페인
              </Link>
              <Link
                href="/reviews"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 ${
                  isActive('/reviews')
                    ? 'bg-rose-50 text-primary border-primary'
                    : 'text-text-secondary border-transparent hover:bg-rose-50 hover:text-primary'
                }`}
              >
                리뷰
              </Link>
              <Link
                href="/brand"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 ${
                  isActive('/brand')
                    ? 'bg-rose-50 text-primary border-primary'
                    : 'text-text-secondary border-transparent hover:bg-rose-50 hover:text-primary'
                }`}
              >
                브랜드존
              </Link>
              <Link
                href="/community"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 ${
                  isActive('/community')
                    ? 'bg-rose-50 text-primary border-primary'
                    : 'text-text-secondary border-transparent hover:bg-rose-50 hover:text-primary'
                }`}
              >
                커뮤니티
              </Link>
              <Link
                href="/ai-service"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 px-4 py-3 rounded-lg font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white hover:shadow-lg transition-all mt-2"
              >
                <Wand2 size={18} />
                <span>부가서비스</span>
              </Link>
            </div>

            {/* Dashboard Links */}
            {user && (
              <div className="mt-6 pt-6 border-t border-border">
                {profile?.role === 'ADMIN' && (
                  <Link
                    href="/dashboard/admin"
                    onClick={closeMobileMenu}
                    className="block px-4 py-3 rounded-lg font-medium bg-primary text-white text-center hover:bg-primary-dark transition-colors"
                  >
                    관리페이지
                  </Link>
                )}
                {profile?.role === 'ADVERTISER' && (
                  <Link
                    href="/dashboard/advertiser"
                    onClick={closeMobileMenu}
                    className="block px-4 py-3 rounded-lg font-medium bg-primary text-white text-center hover:bg-primary-dark transition-colors"
                  >
                    관리페이지
                  </Link>
                )}
                {profile?.role === 'INFLUENCER' && (
                  <Link
                    href="/dashboard/influencer"
                    onClick={closeMobileMenu}
                    className="block px-4 py-3 rounded-lg font-medium bg-primary text-white text-center hover:bg-primary-dark transition-colors"
                  >
                    마이페이지
                  </Link>
                )}
              </div>
            )}

            {/* Footer Links Section in Mobile Menu */}
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="px-4 text-xs font-bold text-text-main mb-3 uppercase tracking-wider">바로가기</h4>
              <div className="flex flex-col gap-1">
                <Link
                  href="/notice"
                  onClick={closeMobileMenu}
                  className="px-4 py-2 text-sm text-text-secondary hover:bg-rose-50 hover:text-primary transition-colors"
                >
                  공지사항
                </Link>
                <Link
                  href="/faq"
                  onClick={closeMobileMenu}
                  className="px-4 py-2 text-sm text-text-secondary hover:bg-rose-50 hover:text-primary transition-colors"
                >
                  자주묻는질문
                </Link>
                <Link
                  href="/contact"
                  onClick={closeMobileMenu}
                  className="px-4 py-2 text-sm text-text-secondary hover:bg-rose-50 hover:text-primary transition-colors"
                >
                  문의하기
                </Link>
                <Link
                  href="/terms"
                  onClick={closeMobileMenu}
                  className="px-4 py-2 text-sm text-text-secondary hover:bg-rose-50 hover:text-primary transition-colors"
                >
                  운영정책
                </Link>
                <Link
                  href="/privacy"
                  onClick={closeMobileMenu}
                  className="px-4 py-2 text-sm text-text-secondary hover:bg-rose-50 hover:text-primary transition-colors"
                >
                  개인정보처리방침
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-border">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-lg font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                로그아웃
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="btn btn-outline py-3 text-center"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  onClick={closeMobileMenu}
                  className="btn btn-primary py-3 text-center"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

