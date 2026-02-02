'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, LayoutDashboard, Megaphone, Users, CreditCard, Globe, Image } from 'lucide-react';
import { useState, Suspense, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface CampaignCounts {
    pending: number;
    upcoming: number;
    active: number;
    completed: number;
    draft: number;
}

interface AdminSidebarProps {
    initialCounts?: CampaignCounts;
}

function AdminSidebarContent({ initialCounts }: AdminSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [campaignMenuOpen, setCampaignMenuOpen] = useState(true);
    const [reviewMenuOpen, setReviewMenuOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(true);
    const [counts, setCounts] = useState<CampaignCounts>(initialCounts || {
        pending: 0,
        upcoming: 0,
        active: 0,
        completed: 0,
        draft: 0
    });

    // 캠페인 개수 가져오기
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

                // 병렬로 모든 데이터 가져오기
                const [pendingRes, recruitingRes, completedRes, draftRes] = await Promise.all([
                    // 요청중 (PENDING)
                    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),

                    // RECRUITING 상태 모두 가져오기 (날짜 필터링은 클라이언트에서)
                    supabase.from('campaigns').select('id, recruitment_start_date, created_at, status')
                        .in('status', ['RECRUITING', 'ONGOING']),

                    // 완료 (COMPLETED)
                    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),

                    // 임시저장 (DRAFT)
                    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'DRAFT')
                ]);

                // RECRUITING 데이터를 날짜 기준으로 분리
                const recruitingCampaigns = recruitingRes.data || [];

                let upcomingCount = 0;
                let activeCount = 0;

                recruitingCampaigns.forEach(cam => {
                    // ONGOING은 무조건 진행중
                    if (cam.status === 'ONGOING') {
                        activeCount++;
                        return;
                    }

                    // RECRUITING은 날짜 체크
                    if (cam.status === 'RECRUITING') {
                        const startDateStr = cam.recruitment_start_date || cam.created_at;
                        const startDate = startDateStr.split('T')[0];

                        if (startDate > today) {
                            upcomingCount++; // 진행 전
                        } else {
                            activeCount++; // 진행 중
                        }
                    }
                });

                setCounts({
                    pending: pendingRes.count || 0,
                    upcoming: upcomingCount,
                    active: activeCount,
                    completed: completedRes.count || 0,
                    draft: draftRes.count || 0
                });
            } catch (error) {
                console.error('Error fetching campaign counts:', error);
            }
        };

        fetchCounts();

        // 30초마다 갱신
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

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

    const isInCampaignSection =
        pathname.includes('/dashboard/admin/campaigns') ||
        pathname.includes('/dashboard/campaign/new') ||
        pathname.match(/\/dashboard\/admin\/campaigns\/\d+/);

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
                    <LayoutDashboard className="w-5 h-5" />
                    <span>대시보드</span>
                </Link>

                {/* 캠페인 관리 통합 메뉴 */}
                <Link
                    href="/dashboard/admin/campaigns"
                    className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${isInCampaignSection
                        ? 'bg-rose-50 text-primary'
                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <Megaphone className="w-5 h-5" />
                        <span>캠페인 관리</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isInCampaignSection
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700'
                        }`}>
                        {Object.values(counts).reduce((a, b) => a + b, 0)}
                    </span>
                </Link>

                {/* 리뷰 관리 (접을 수 있는 메뉴) */}
                <div>
                    <button
                        onClick={() => setReviewMenuOpen(!reviewMenuOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
                            pathname.includes('/dashboard/admin/reviews')
                                ? 'bg-rose-50 text-primary'
                                : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>리뷰 관리</span>
                        </div>
                        {reviewMenuOpen ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>

                    {/* 하위 메뉴 */}
                    {reviewMenuOpen && (
                        <div className="ml-4 mt-2 space-y-1 border-l-2 border-rose-100 pl-4">
                            <Link
                                href="/dashboard/admin/reviews/update"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    isActive('/dashboard/admin/reviews/update')
                                        ? 'bg-rose-100 text-primary'
                                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                }`}
                            >
                                <span>🔄</span>
                                <span>리뷰 업데이트</span>
                            </Link>
                            <Link
                                href="/dashboard/admin/reviews/cleanup"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    isActive('/dashboard/admin/reviews/cleanup')
                                        ? 'bg-rose-100 text-primary'
                                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                }`}
                            >
                                <span>🗑️</span>
                                <span>중복 정리</span>
                            </Link>
                            <Link
                                href="/dashboard/admin/reviews/manage"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    isActive('/dashboard/admin/reviews/manage')
                                        ? 'bg-rose-100 text-primary'
                                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                }`}
                            >
                                <span>⚙️</span>
                                <span>리뷰 관리</span>
                            </Link>
                            <Link
                                href="/dashboard/admin/reviews/new"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    isActive('/dashboard/admin/reviews/new')
                                        ? 'bg-rose-100 text-primary'
                                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                }`}
                            >
                                <span>✨</span>
                                <span>리뷰 등록</span>
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
                    <Image className="w-5 h-5" />
                    <span>배너 관리</span>
                </Link>

                {/* 사이트 관리 */}
                <Link
                    href="/dashboard/admin/settings/brand"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${pathname.includes('/dashboard/admin/settings')
                        ? 'bg-rose-50 text-primary'
                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                        }`}
                >
                    <Globe className="w-5 h-5" />
                    <span>사이트 관리</span>
                </Link>

                {/* 결제 관리 */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">
                    <CreditCard className="w-5 h-5" />
                    <span>결제 관리</span>
                </div>
            </nav>
        </aside>
    );
}

export default function AdminSidebar({ initialCounts }: AdminSidebarProps) {
    return (
        <Suspense fallback={<aside className="w-[260px] bg-white border-r border-border shrink-0" />}>
            <AdminSidebarContent initialCounts={initialCounts} />
        </Suspense>
    );
}

