'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, LayoutDashboard, Megaphone, Users, CreditCard } from 'lucide-react';
import { useState, Suspense } from 'react';

function AdminSidebarContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [campaignMenuOpen, setCampaignMenuOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(true);

    const isActive = (path: string, type?: string) => {
        if (type) {
            return pathname === path && searchParams.get('type') === type;
        }
        // type이 없는 경우 (진행 중의 기본 상태 등)
        if (path === '/dashboard/admin/campaigns' && !searchParams.get('type')) {
            return pathname === path;
        }
        return pathname === path;
    };

    const isInCampaignSection = pathname.includes('/dashboard/admin/campaigns') || pathname.includes('/dashboard/campaign/new');

    return (
        <aside className="w-[260px] bg-white border-r border-border p-8 flex flex-col shrink-0">
            <div className="mb-8 pb-6 border-b border-border">
                <div className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-1">SUPER ADMIN</div>
                <div className="text-lg font-bold text-text-main">관리자</div>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
                {/* 대시보드 */}
                <Link
                    href="/dashboard/admin"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${isActive('/dashboard/admin')
                        ? 'bg-rose-50 text-primary'
                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                        }`}
                >
                    대시보드
                </Link>

                {/* 캠페인 승인/관리 (접을 수 있는 메뉴) */}
                <div>
                    <button
                        onClick={() => setCampaignMenuOpen(!campaignMenuOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${isInCampaignSection
                            ? 'bg-rose-50 text-primary'
                            : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                            }`}
                    >
                        <span>캠페인 관리</span>
                        {campaignMenuOpen ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>

                    {/* 하위 메뉴 */}
                    {campaignMenuOpen && (
                        <div className="ml-4 mt-2 space-y-1 border-l-2 border-rose-100 pl-4">
                            <Link
                                href="/dashboard/admin/campaigns?type=pending"
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard/admin/campaigns', 'pending')
                                    ? 'bg-rose-100 text-primary'
                                    : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                    }`}
                            >
                                요청중인 캠페인
                            </Link>
                            <Link
                                href="/dashboard/admin/campaigns?type=upcoming"
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard/admin/campaigns', 'upcoming')
                                    ? 'bg-rose-100 text-primary'
                                    : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                    }`}
                            >
                                진행 전
                            </Link>
                            <Link
                                href="/dashboard/admin/campaigns?type=active"
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard/admin/campaigns', 'active')
                                    ? 'bg-rose-100 text-primary'
                                    : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                    }`}
                            >
                                진행 중
                            </Link>
                            <Link
                                href="/dashboard/admin/campaigns?type=completed"
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard/admin/campaigns', 'completed')
                                    ? 'bg-rose-100 text-primary'
                                    : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                    }`}
                            >
                                완료
                            </Link>
                            <Link
                                href="/dashboard/campaign/drafts"
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard/campaign/drafts')
                                    ? 'bg-rose-100 text-primary'
                                    : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                    }`}
                            >
                                임시저장
                            </Link>
                        </div>
                    )}
                </div>

                {/* 회원 관리 */}
                <Link
                    href="/admin/users"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${pathname.startsWith('/admin/users') || pathname.includes('/dashboard/admin/users')
                        ? 'bg-rose-50 text-primary'
                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                        }`}
                >
                    <Users className="w-5 h-5" />
                    <span>회원 관리</span>
                </Link>

                {/* 배너 관리 */}
                <Link
                    href="/dashboard/admin/banners"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${isActive('/dashboard/admin/banners')
                        ? 'bg-rose-50 text-primary'
                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                        }`}
                >
                    배너 관리
                </Link>

                {/* 결제 관리 */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">
                    결제 관리
                </div>
            </nav>
        </aside>
    );
}

export default function AdminSidebar() {
    return (
        <Suspense fallback={<aside className="w-[260px] bg-white border-r border-border shrink-0" />}>
            <AdminSidebarContent />
        </Suspense>
    );
}

