'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function AdminSidebar() {
    const pathname = usePathname();
    const [campaignMenuOpen, setCampaignMenuOpen] = useState(
        pathname.includes('/dashboard/campaign') || pathname.includes('/dashboard/admin/campaigns')
    );

    const isActive = (path: string) => pathname === path;
    const isInCampaignSection = pathname.includes('/dashboard/campaign') || pathname.includes('/dashboard/admin/campaigns');

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
                                href="/dashboard/campaign/new"
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard/campaign/new')
                                    ? 'bg-rose-100 text-primary'
                                    : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                    }`}
                            >
                                신규 캠페인 요청
                            </Link>
                            <Link
                                href="/dashboard/admin/campaigns"
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard/admin/campaigns')
                                    ? 'bg-rose-100 text-primary'
                                    : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                    }`}
                            >
                                진행 중
                            </Link>
                            <div className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">
                                완료
                            </div>
                            <div className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">
                                진행 전
                            </div>
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

                {/* 결제 관리 */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">
                    결제 관리
                </div>
            </nav>
        </aside>
    );
}
