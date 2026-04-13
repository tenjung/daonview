'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import BrandLogo from '@/components/BrandLogo';
import { getRoleDashboardPath, getRoleLabel as getRoleLabelByRole } from '@/constants/role';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface PartnerNavbarProps {
  initialUser?: SupabaseUser | null;
  initialProfile?: Profile | null;
}

export default function PartnerNavbar({ initialUser, initialProfile }: PartnerNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    user: storeUser, 
    profile: storeProfile, 
    isLoading,
    isInitialized,
    signOut: storeSignOut 
  } = useAuthStore();

  const user = !isInitialized && !storeUser && initialUser ? initialUser : storeUser;
  const profile = !isInitialized && !storeProfile && initialProfile ? initialProfile : storeProfile;

  const showSkeleton = isLoading && initialUser === undefined && storeUser === null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await storeSignOut();
      setMobileMenuOpen(false);

      toast.success('로그아웃되었습니다', {
        id: 'logout',
      });

      router.replace('/');
      router.refresh();

    } catch (error: unknown) {
      console.error('Logout Error:', error);
      toast.error('로그아웃 알림', {
        id: 'logout',
        description: '로그아웃 처리 중 알림이 발생했으나 세션은 종료되었습니다.',
      });
      router.replace('/');
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const getUserDashboardLink = () => {
    if (!profile) return '/';
    return getRoleDashboardPath(profile.role);
  };

  const getRoleLabel = () => {
    if (!profile) return '';
    return getRoleLabelByRole(profile.role);
  };

  return (
    <nav className="h-[70px] bg-slate-900 border-b border-slate-800 sticky top-0 z-[100] flex items-center shadow-md">
      <div className="flex items-center justify-between w-[90%] max-w-[1200px] mx-auto h-full">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <BrandLogo size="lg" />
          <div className="h-6 w-[1px] bg-white/20 mx-2 hidden lg:block"></div>
          <span className="text-white/80 font-semibold tracking-wider text-sm hidden lg:block">기업 파트너십</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8 h-full">
          <Link
            href="/partner/intro"
            className={`font-medium transition-colors h-full flex items-center border-b-[3px] ${pathname === '/partner/intro'
              ? 'text-white border-primary glow'
              : 'text-white/60 border-transparent hover:text-white'
              }`}
          >
            광고주 파트너십
          </Link>
          <Link
            href="/partner"
            className={`font-medium transition-colors h-full flex items-center border-b-[3px] ${pathname === '/partner'
              ? 'text-white border-primary glow'
              : 'text-white/60 border-transparent hover:text-white'
              }`}
          >
            숏폼 체험단
          </Link>
          <Link
            href="/partner/brand-video"
            className={`font-medium transition-colors h-full flex items-center border-b-[3px] ${pathname === '/partner/brand-video'
              ? 'text-white border-primary glow'
              : 'text-white/60 border-transparent hover:text-white'
              }`}
          >
            브랜드 영상제작
          </Link>
          <Link
            href="/"
            className="text-white/40 hover:text-white/80 text-sm font-medium transition-colors ml-4"
          >
            일반 서비스 홈
          </Link>
        </div>

        {/* Desktop User Menu */}
        <div className="hidden lg:flex gap-6 items-center">
          {showSkeleton ? (
            <div className="flex gap-2 items-center">
              <div className="w-16 h-8 bg-slate-800 animate-pulse rounded-lg"></div>
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="flex items-center gap-3 group">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                      {profile?.nickname || user.email?.split('@')[0]}님
                    </span>
                    <span className="text-[10px] text-white/50 font-medium">{getRoleLabel()}</span>
                  </div>
                  <Avatar
                    src={profile?.avatar_url}
                    fallback={(profile?.nickname || user.email)?.[0]}
                    className="ring-2 ring-white/10 group-hover:ring-rose-500/50 transition-all group-hover:scale-105"
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 bg-slate-900 text-white border-slate-800">
                <DropdownMenuLabel className="flex flex-col gap-1 py-3 px-4">
                  <span className="text-xs text-slate-400 font-medium">로그인 정보</span>
                  <span className="text-sm font-bold truncate text-white">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />

                <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer">
                  <Link href={getUserDashboardLink()} className="flex items-center gap-2">
                    <LayoutDashboard size={16} />
                    <span>{profile?.role === 'INFLUENCER' ? '마이페이지' : '관리페이지'}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer">
                  <Link href="/profile/edit" className="flex items-center gap-2">
                    <Settings size={16} />
                    <span>내 정보 수정</span>
                  </Link>
                </DropdownMenuItem>

                {profile?.role === 'ADMIN' && (
                  <>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500 py-1">System</DropdownMenuLabel>
                    <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer">
                      <Link href="/dashboard/admin/users" className="flex items-center gap-2 text-violet-400 focus:text-violet-300">
                        <ShieldCheck size={16} />
                        <span>회원 관리</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  disabled={isSigningOut}
                  className="text-red-400 focus:text-red-300 focus:bg-red-500/10 data-[disabled]:opacity-50 cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>{isSigningOut ? '로그아웃 중...' : '로그아웃'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow hover:bg-primary-dark transition-colors">
              광고주 로그인
            </Link>
          )}
        </div>

        {/* Mobile: Hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:text-primary transition-colors"
            aria-label="메뉴"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[90] lg:hidden backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-0 right-0 h-screen w-[280px] bg-slate-900 border-l border-slate-800 z-[95] transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* User Info Section */}
          <div className="p-6 border-b border-slate-800 bg-slate-900 flex items-center gap-4">
             {showSkeleton ? (
                 <div className="flex gap-2 items-center">
                    <div className="w-12 h-12 bg-slate-800 animate-pulse rounded-full"></div>
                    <div className="flex flex-col gap-2">
                       <div className="w-20 h-4 bg-slate-800 animate-pulse rounded"></div>
                       <div className="w-24 h-3 bg-slate-800 animate-pulse rounded"></div>
                    </div>
                 </div>
             ) : user ? (
                 <>
                  <Avatar
                    src={profile?.avatar_url}
                    fallback={(profile?.nickname || user.email)?.[0]}
                    className="h-12 w-12 ring-2 ring-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    {profile && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">
                          {getRoleLabel()}
                        </span>
                      </div>
                    )}
                    <p className="text-sm font-bold text-white truncate">
                      {profile?.nickname || user.email?.split('@')[0]}님
                    </p>
                    <p className="text-[10px] text-slate-400 truncate tracking-tight">{user.email}</p>
                  </div>
                </>
             ) : (
                <div className="flex-1">
                    <h3 className="text-white font-bold mb-2">프리미엄 광고주 파트너</h3>
                    <Link href="/login" className="block w-full text-center px-4 py-2 bg-primary text-white font-semibold rounded-lg">
                        로그인
                    </Link>
                </div>
             )}
          </div>

          <div className="p-4 flex flex-col gap-2">
              <Link
                href="/partner/intro"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 ${pathname === '/partner/intro'
                  ? 'bg-slate-800 text-white border-primary'
                  : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-white'
                  }`}
              >
                광고주 파트너십
              </Link>
              <Link
                href="/partner"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 ${pathname === '/partner'
                  ? 'bg-slate-800 text-white border-primary'
                  : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-white'
                  }`}
              >
                숏폼 체험단
              </Link>
              <Link
                href="/partner/brand-video"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 ${pathname === '/partner/brand-video'
                  ? 'bg-slate-800 text-white border-primary'
                  : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-white'
                  }`}
              >
                브랜드 영상제작
              </Link>
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-800">
               <Link href="/" className="block w-full px-4 py-3 rounded-lg font-medium text-slate-400 text-center hover:bg-slate-800 hover:text-white transition-colors">
                   일반 서비스 홈으로 가기
               </Link>
               {user && (
                    <button
                        onClick={handleLogout}
                        disabled={isSigningOut}
                        className="w-full mt-2 px-4 py-3 rounded-lg font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    >
                        {isSigningOut ? '로그아웃 중...' : '로그아웃'}
                    </button>
               )}
          </div>
        </div>
      </div>
    </nav>
  );
}
