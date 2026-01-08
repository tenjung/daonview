'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wand2, Menu, X, User, LayoutDashboard, Settings, LogOut, ShieldCheck, ShoppingBag, Heart, ChevronUp, ChevronDown } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isLoading, initialize, signOut: storeSignOut } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyInfoOpen, setCompanyInfoOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  const handleLogout = async () => {
    try {
      toast.loading('로그아웃 중...', { id: 'logout' });
      await storeSignOut();
      setMobileMenuOpen(false);

      toast.success('로그아웃되었습니다', {
        id: 'logout',
        description: '안전하게 로그아웃되었습니다.',
      });

      setTimeout(() => {
        window.location.href = '/';
      }, 500);

    } catch (error: any) {
      console.error('Logout Error:', error);
      toast.error('로그아웃 실패', {
        id: 'logout',
        description: error.message || '다시 시도해주세요.',
      });
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
    switch (profile.role) {
      case 'ADMIN': return '/dashboard/admin';
      case 'ADVERTISER': return '/dashboard/advertiser';
      case 'INFLUENCER': return '/dashboard/influencer';
      default: return '/dashboard/influencer';
    }
  };

  const getRoleLabel = () => {
    if (!profile) return '';
    switch (profile.role) {
      case 'ADMIN': return '관리자';
      case 'ADVERTISER': return '광고주';
      case 'INFLUENCER': return '인플루언서';
      default: return '사용자';
    }
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
            className={`font-medium transition-colors h-full flex items-center border-b-[3px] ${isActive('/campaigns')
              ? 'text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-primary'
              }`}
          >
            캠페인
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
          {profile?.role === 'INFLUENCER' && (
            <Link
              href="/recommended"
              className={`font-medium transition-colors h-full flex items-center border-b-[3px] ${isActive('/recommended')
                ? 'text-primary border-primary'
                : 'text-text-secondary border-transparent hover:text-primary'
                }`}
            >
              맞춤 캠페인
            </Link>
          )}
          <Link
            href="/community"
            className={`font-medium transition-colors h-full flex items-center border-b-[3px] ${isActive('/community')
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
        <div className="hidden lg:flex gap-6 items-center">
          {/* Wishlist Capsule Button - Plan A */}
          <Link 
            href="/wishlist" 
            className="group flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-gray-100 bg-white hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all duration-300 shadow-sm hover:shadow-md h-10"
          >
            <Heart 
              size={18} 
              className={`transition-all duration-300 group-hover:scale-110 ${mounted && cartItems.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-gray-400 group-hover:text-rose-500'}`} 
            />
            <span className="text-[13px] font-bold text-gray-600 group-hover:text-rose-600 transition-colors whitespace-nowrap">
              찜한 캠페인
            </span>
            {mounted && cartItems.length > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-sm ring-1 ring-rose-300 transform transition-transform group-hover:scale-110">
                {cartItems.length}
              </span>
            )}
          </Link>

          {(!mounted || isLoading) ? (
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
                      <Link href="/admin/users" className="flex items-center gap-2 text-violet-600 focus:text-violet-700">
                        <ShieldCheck size={16} />
                        <span>회원 관리</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-600 focus:bg-red-50">
                  <LogOut size={16} />
                  <span>로그아웃</span>
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
          {mounted && user && (
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
                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Navigation Links - Scrollable Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 flex flex-col gap-2">
              <Link
                href="/campaigns"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 ${isActive('/campaigns')
                  ? 'bg-rose-50 text-primary border-primary'
                  : 'text-text-secondary border-transparent hover:bg-rose-50 hover:text-primary'
                  }`}
              >
                캠페인
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
              {profile?.role === 'INFLUENCER' && (
                <Link
                  href="/recommended"
                  onClick={closeMobileMenu}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors border-l-4 ${isActive('/recommended')
                    ? 'bg-rose-50 text-primary border-primary'
                    : 'text-text-secondary border-transparent hover:bg-rose-50 hover:text-primary'
                    }`}
                >
                  맞춤 캠페인
                </Link>
              )}
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
                className="flex items-center gap-2 px-4 py-3 rounded-lg font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white hover:shadow-lg transition-all mt-2"
              >
                <Wand2 size={18} />
                <span>부가서비스</span>
              </Link>

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

