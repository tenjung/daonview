'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, Suspense } from 'react';

function AdvertiserSidebarContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [campaignMenuOpen, setCampaignMenuOpen] = useState(true);

    const isActive = (path: string, status?: string) => {
        if (status) {
            return pathname === path && searchParams.get('status') === status;
        }
        // 기본 상태 (status가 없을 때)
        if (path === '/dashboard/advertiser/campaigns' && !searchParams.get('status')) {
            return pathname === path;
        }
        return pathname === path;
    };

    const isInCampaignSection = pathname.includes('/dashboard/advertiser/campaigns') || pathname.includes('/dashboard/campaign/new');

    return (
        <aside className="w-[260px] bg-white border-r border-border p-8 flex flex-col shrink-0">
            <div className="mb-8 pb-6 border-b border-border">
                <div className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-1">ADVERTISER</div>
                <div className="text-lg font-bold text-text-main">(주)다온컴퍼니</div>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
                {/* 대시보드 */}
                <Link
                    href="/dashboard/advertiser"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${isActive('/dashboard/advertiser')
                        ? 'bg-rose-50 text-primary'
                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                        }`}
                >
                    대시보드
                </Link>

                {/* 캠페인 관리 (접을 수 있는 메뉴) */}
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
                                href="/dashboard/advertiser/campaigns"
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard/advertiser/campaigns') && !searchParams.get('status')
                                    ? 'bg-rose-100 text-primary'
                                    : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                    }`}
                            >
                                전체 보기
                            </Link>
                            <Link
                                href="/dashboard/advertiser/campaigns?status=RECRUITING"
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard/advertiser/campaigns', 'RECRUITING')
                                    ? 'bg-rose-100 text-primary'
                                    : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                    }`}
                            >
                                모집중/진행중
                            </Link>
                            <Link
                                href="/dashboard/advertiser/campaigns?status=COMPLETED"
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard/advertiser/campaigns', 'COMPLETED')
                                    ? 'bg-rose-100 text-primary'
                                    : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                    }`}
                            >
                                완료
                            </Link>
                            <Link
                                href="/dashboard/advertiser/campaigns?status=DRAFT"
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard/advertiser/campaigns', 'DRAFT')
                                    ? 'bg-rose-100 text-primary'
                                    : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                    }`}
                            >
                                임시저장
                            </Link>
                        </div>
                    )}
                </div>

                {/* 신청자 목록 */}
                <Link
                    href="/dashboard/advertiser/applicants"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${isActive('/dashboard/advertiser/applicants')
                        ? 'bg-rose-50 text-primary'
                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                        }`}
                >
                    신청자 목록
                </Link>

                {/* 리뷰 작업 현황 */}
                <Link
                    href="/dashboard/advertiser/reviews"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${isActive('/dashboard/advertiser/reviews')
                        ? 'bg-rose-50 text-primary'
                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                        }`}
                >
                    리뷰 작업 현황
                </Link>

                {/* 결제/포인트 */}
                <Link
                    href="/dashboard/advertiser/payments"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${isActive('/dashboard/advertiser/payments')
                        ? 'bg-rose-50 text-primary'
                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                        }`}
                >
                    결제/포인트
                </Link>

                <div className="my-4 border-t border-border" />

                {/* 계정 설정 */}
                <Link
                    href="/profile/edit"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${pathname === '/profile/edit'
                        ? 'bg-rose-50 text-primary'
                        : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                        }`}
                >
                    <span>계정 설정</span>
                </Link>
            </nav>
        </aside>
    );
}

export default function AdvertiserSidebar() {
    return (
        <Suspense fallback={<aside className="w-[260px] bg-white border-r border-border shrink-0" />}>
            <AdvertiserSidebarContent />
        </Suspense>
    );
}
