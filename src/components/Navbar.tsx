'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wand2, Menu, X, LayoutDashboard, Settings, LogOut, ShieldCheck, Heart, ChevronUp, ChevronDown, Sparkles, Bell } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import BrandLogo from '@/components/BrandLogo';
import NotificationCenter from '@/components/NotificationCenter';
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

interface NavbarProps {
  initialUser?: SupabaseUser | null;
  initialProfile?: Profile | null;
}

export default function Navbar({ initialUser, initialProfile }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    user: storeUser, 
    profile: storeProfile, 
    isLoading,
    isInitialized,
    signOut: storeSignOut 
  } = useAuthStore();

  // 초기 부팅 전까지만 SSR 초기값을 사용하고, 초기화 이후에는 store를 단일 소스로 사용
  const user = !isInitialized && !storeUser && initialUser ? initialUser : storeUser;
  const profile = !isInitialized && !storeProfile && initialProfile ? initialProfile : storeProfile;

  // 서버에서 세션 체크가 완료되었거나(initialUser가 null이라도 존재), 
  // 클라이언트에서 이미 정보를 불러왔다면 스켈레톤을 보여주지 않음
  const showSkeleton = isLoading && initialUser === undefined && storeUser === null;
  const { items: cartItems, fetchItems, clearCart } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyInfoOpen, setCompanyInfoOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // 유저 로그인 시 관심 캠페인(찜) 동기화
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        fetchItems(user.id);
      } else {
        clearCart();
      }
    }
  }, [user, isLoading, fetchItems, clearCart]);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await storeSignOut();
      setMobileMenuOpen(false);

      toast.success('로그아웃되었습니다', {
        id: 'logout',
        description: '안전하게 로그아웃되었습니다.',
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

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
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
    <nav className="h-[70px] bg-surface border-b border-border sticky top-0 z-[100] flex items-center">
      <div className="flex items-center justify-between w-[90%] max-w-[1200px] mx-auto h-full">
        {/* Logo */}
        <BrandLogo size="lg" />

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8 h-full">
          <Link
            href="/campaigns"
            className={`font-medium transition-colors h-full flex items-center gap-1.5 border-b-[3px] ${isActive('/campaigns')
              ? 'text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-primary'
              }`}
          >
            캠페인
            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-rose-100 text-primary rounded-full border border-rose-200">NEW</span>
          </Link>
          <Link
            href="/reviews"
            className={`font-medium transition-colors h-full flex items-center border-b-[3px] ${isActive('/reviews')
              ? 'text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-primary'
              }`}
          >
            리뷰
          </Link>

          <Link
            href="/community"
            className={`font-medium transition-colors h-full flex items-center border-b-[3px] ${isActive('/community')
              ? 'text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-primary'
              }`}
          >
            커뮤니티
          </Link>
          <Link
            href="/ai-service"
            className={`font-medium transition-all h-full flex items-center border-b-[3px] group ${isActive('/ai-service')
              ? 'border-primary'
              : 'border-transparent'
              }`}
          >
            <span className={`bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent ${!isActive('/ai-service') && 'opacity-80 group-hover:opacity-100 transition-opacity'}`}>
              AI 인텔리전스
            </span>
          </Link>
        </div>

        {/* Desktop User Menu */}
        <div className="hidden lg:flex gap-6 items-center">
          <div className="flex items-center gap-1.5">
            {profile?.role === 'INFLUENCER' ? (
              <div className="flex items-center p-1 bg-white border border-gray-100 rounded-full shadow-sm h-10">
                <Link
                  href="/recommended"
                  className="flex items-center gap-1.5 px-3 py-1 pl-4 rounded-l-full hover:bg-violet-50 text-gray-500 hover:text-violet-600 transition-colors group"
                >
                  <Sparkles size={15} className="group-hover:text-violet-500 transition-colors" />
                  <span className="text-[13px] font-bold">맞춤</span>
                </Link>

                <div className="w-[1px] h-4 bg-gray-200"></div>

                <Link
                  href="/wishlist"
                    className="relative p-2 rounded-full hover:bg-rose-50 transition-all group outline-none"
                  >
                  <Heart 
                    size={20} 
                    className={`transition-all duration-300 group-hover:scale-110 ${cartItems.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400 group-hover:text-rose-500'}`} 
                  />
                  {cartItems.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full shadow-sm ring-2 ring-white" />
                  )}
                </Link>
              </div>
            ) : (
              <Link
                href="/wishlist"
                className="relative p-2 rounded-full hover:bg-rose-50 transition-all group outline-none"
              >
                <Heart 
                  size={20} 
                  className={`transition-all duration-300 group-hover:scale-110 ${cartItems.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400 group-hover:text-rose-500'}`} 
                />
                {cartItems.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full shadow-sm ring-2 ring-white" />
                )}
              </Link>
            )}

            {user && <NotificationCenter />}
          </div>

          {showSkeleton ? (
            <div className="flex gap-2 items-center">
              <div className="w-16 h-8 bg-slate-100 animate-pulse rounded-lg"></div>
              <div className="w-16 h-8 bg-slate-100 animate-pulse rounded-lg"></div>
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="flex items-center gap-3 group">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                      {profile?.nickname || user.email?.split('@')[0]}님
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{getRoleLabel()}</span>
                  </div>
                  <Avatar
                    src={profile?.avatar_url}
                    fallback={(profile?.nickname || user.email)?.[0]}
                    className="ring-2 ring-transparent group-hover:ring-rose-100 transition-all group-hover:scale-105"
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel className="flex flex-col gap-1 py-3 px-4">
                  <span className="text-xs text-gray-400 font-medium">로그인 정보</span>
                  <span className="text-sm font-bold truncate text-text-main">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href={getUserDashboardLink()} className="flex items-center gap-2">
                    <LayoutDashboard size={16} />
                    <span>{profile?.role === 'INFLUENCER' ? '마이페이지' : '관리페이지'}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/profile/edit" className="flex items-center gap-2">
                    <Settings size={16} />
                    <span>내 정보 수정</span>
                  </Link>
                </DropdownMenuItem>

                {profile?.role === 'ADMIN' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-gray-400 py-1">System</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/admin/users" className="flex items-center gap-2 text-violet-600 focus:text-violet-700">
                        <ShieldCheck size={16} />
                        <span>회원 관리</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  disabled={isSigningOut}
                  className="text-red-500 focus:text-red-600 focus:bg-red-50 data-[disabled]:opacity-50"
                >
                  <LogOut size={16} />
                  <span>{isSigningOut ? '로그아웃 중...' : '로그아웃'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          {user && (
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
      <div className={`fixed top-0 right-0 h-screen w-[280px] bg-white shadow-2xl z-[95] transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          {/* User Info Section */}
          {user && (
            <div className="p-6 border-b border-border bg-rose-50 flex items-center gap-4">
              <Avatar
                src={profile?.avatar_url}
                fallback={(profile?.nickname || user.email)?.[0]}
                className="h-12 w-12 ring-2 ring-white shadow-sm"
              />
              <div className="flex-1 min-w-0">
                {profile && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-primary">
                      {getRoleLabel()}
                    </span>
                  </div>
                )}
                <p className="text-sm font-bold text-text-main truncate">
                  {profile?.nickname || user.email?.split('@')[0]}님
                </p>
                <p className="text-[10px] text-gray-400 truncate tracking-tight">{user.email}</p>
              </div>
            </div>
          )}

          {/* Navigation Links - Scrollable Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 flex flex-col gap-2">
              <Link
                href="/campaigns"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 flex items-center justify-between ${isActive('/campaigns')
                  ? 'bg-rose-50 text-primary border-primary'
                  : 'text-text-secondary border-transparent hover:bg-rose-50 hover:text-primary'
                  }`}
              >
                <span>캠페인</span>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-rose-100 text-primary rounded-full border border-rose-200">NEW</span>
              </Link>
              <Link
                href="/reviews"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 ${isActive('/reviews')
                  ? 'bg-rose-50 text-primary border-primary'
                  : 'text-text-secondary border-transparent hover:bg-rose-50 hover:text-primary'
                  }`}
              >
                리뷰
              </Link>
              <Link
                href="/community"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 ${isActive('/community')
                  ? 'bg-rose-50 text-primary border-primary'
                  : 'text-text-secondary border-transparent hover:bg-rose-50 hover:text-primary'
                  }`}
              >
                커뮤니티
              </Link>
              <Link
                href="/ai-service"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 flex items-center gap-2 ${isActive('/ai-service')
                  ? 'bg-rose-50 text-primary border-primary'
                  : 'text-text-secondary border-transparent hover:bg-rose-50 hover:text-primary'
                  }`}
              >
                <Wand2 size={16} />
                <span>부가서비스</span>
              </Link>

              {/* Wishlist & Custom Campaign */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                {profile?.role === 'INFLUENCER' && (
                  <Link
                    href="/recommended"
                    onClick={closeMobileMenu}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 flex items-center gap-2 ${isActive('/recommended')
                      ? 'bg-violet-50 text-violet-600 border-violet-600'
                      : 'text-gray-600 border-transparent hover:bg-violet-50 hover:text-violet-600'
                      }`}
                  >
                    <Sparkles size={16} />
                    <span>맞춤 캠페인</span>
                  </Link>
                )}
                <Link
                  href="/wishlist"
                  onClick={closeMobileMenu}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 flex items-center gap-2 ${isActive('/wishlist')
                    ? 'bg-rose-50 text-rose-600 border-rose-600'
                    : 'text-gray-600 border-transparent hover:bg-rose-50 hover:text-rose-600'
                    }`}
                >
                  <Heart size={16} className={cartItems.length > 0 ? 'fill-rose-500 text-rose-500' : ''} />
                  <span>찜한 캠페인</span>
                  {cartItems.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full">
                      {cartItems.length}
                    </span>
                  )}
                </Link>
                {user && (
                  <div className="px-4 py-3 border-l-4 border-transparent flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                       <Bell size={16} className="text-gray-600" />
                       <span className="text-gray-600 font-medium">알림</span>
                    </div>
                    <NotificationCenter />
                  </div>
                )}
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
                    href="/community/notice"
                    onClick={closeMobileMenu}
                    className="px-4 py-2 text-sm text-text-secondary hover:bg-rose-50 hover:text-primary transition-colors"
                  >
                    공지사항
                  </Link>
                  <Link
                    href="/community/faq"
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
          </div>

          {/* Bottom Actions - Fixed at Bottom */}
          <div className="p-4 border-t border-border bg-white">
            {user ? (
              <button
                onClick={handleLogout}
                disabled={isSigningOut}
                className="w-full px-4 py-3 rounded-lg font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                {isSigningOut ? '로그아웃 중...' : '로그아웃'}
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

          {/* Company Info Section - Accordion */}
          <div className="border-t border-border bg-slate-50">
            <button
              onClick={() => setCompanyInfoOpen(!companyInfoOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-text-main uppercase tracking-wider hover:bg-slate-100 transition-colors"
            >
              <span>사업자 정보</span>
              {companyInfoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {companyInfoOpen && (
              <div className="px-4 pb-4">
                <div className="space-y-1.5 text-[11px] text-text-secondary">
                  <p><strong className="text-text-main">상호명:</strong> 다온컴퍼니</p>
                  <p><strong className="text-text-main">사업자등록번호:</strong> 657-33-01007</p>
                  <p><strong className="text-text-main">대표자:</strong> 신지호</p>
                  <p><strong className="text-text-main">전화:</strong> 050-71395-0204</p>
                  <p><strong className="text-text-main">이메일:</strong> master@daonview.com</p>
                  <p className="pt-1"><strong className="text-text-main">주소:</strong> 경기도 부천시 소사구 양지로 229 골든IT타워 824호</p>
                </div>
                <div className="text-center text-[10px] text-text-secondary mt-3 pt-3 border-t border-border">
                  © 2024 DAONVIEW. All rights reserved.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
