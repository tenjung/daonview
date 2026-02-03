'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { SidebarLink } from '@/constants/navigation';

interface DashboardSidebarProps {
    userType: 'INFLUENCER' | 'ADVERTISER' | 'ADMIN';
    userName: string;
    links: SidebarLink[];
}

export default function DashboardSidebar({ userType, userName, links }: DashboardSidebarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

    // 초기 상태에서 현재 활성화된 메뉴의 부모를 펼침
    useEffect(() => {
        const initialExpanded: Record<string, boolean> = {};
        links.forEach(link => {
            const isAnySubActive = link.subLinks?.some(sub => {
                // 서브링크 URL 파싱
                const subUrl = new URL(sub.href, 'http://localhost');
                const isPathMatch = pathname === subUrl.pathname;

                // 쿼리 파라미터가 있는 경우 쿼리까지 비교, 없는 경우 경로만 비교
                if (subUrl.search) {
                    const subParams = subUrl.searchParams.toString();
                    const currentParams = searchParams.toString();
                    return isPathMatch && currentParams.includes(subParams);
                }

                return isPathMatch;
            });

            if (isAnySubActive || link.active) {
                initialExpanded[link.label] = true;
            }
        });
        setExpandedMenus(prev => ({ ...prev, ...initialExpanded }));
    }, [links, pathname, searchParams]);

    const toggleMenu = (label: string) => {
        setExpandedMenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const userTypeLabel = {
        INFLUENCER: 'INFLUENCER',
        ADVERTISER: 'ADVERTISER',
        ADMIN: 'ADMIN'
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-primary text-white rounded-full shadow-2xl hover:bg-rose-600 transition-all active:scale-95"
                aria-label="메뉴"
            >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        w-[280px] bg-white border-r border-slate-100 p-6 flex flex-col shrink-0
        fixed lg:static top-0 left-0 h-screen z-40
        transform transition-transform duration-500 ease-out shadow-xl lg:shadow-none
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="mb-10 pl-2">
                    <div className="text-[10px] font-black uppercase text-primary/40 tracking-[0.2em] mb-1">
                        {userTypeLabel[userType]}
                    </div>
                    <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span className="bg-rose-500 w-1.5 h-6 rounded-full"></span>
                        {userName} <span className="text-slate-400 font-medium">님</span>
                    </div>
                </div>

                <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {links.map((link) => {
                        const hasSubLinks = link.subLinks && link.subLinks.length > 0;
                        const isExpanded = expandedMenus[link.label];

                        // 부모 메뉴 활성화 여부: 본인 active거나 하위 메뉴 중 활성화된 게 있을 때
                        const isAnySubActive = link.subLinks?.some(sub => {
                            const subUrl = new URL(sub.href, 'http://localhost');
                            const isPathMatch = pathname === subUrl.pathname;
                            if (subUrl.search) {
                                return isPathMatch && searchParams.toString().includes(subUrl.searchParams.toString());
                            }
                            return isPathMatch;
                        });
                        const isActive = link.active || isAnySubActive;

                        return (
                            <div key={link.label} className="flex flex-col gap-1">
                                {hasSubLinks ? (
                                    <button
                                        onClick={() => toggleMenu(link.label)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${isActive
                                            ? 'bg-rose-50 text-primary'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {link.label}
                                            {link.tag && (
                                                <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-md italic tracking-tighter shadow-sm animate-pulse">
                                                    {link.tag}
                                                </span>
                                            )}
                                        </div>
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                ) : (
                                    <Link
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${link.active
                                            ? 'bg-rose-50 text-primary'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {link.label}
                                            {link.tag && (
                                                <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-md italic tracking-tighter shadow-sm">
                                                    {link.tag}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                )}

                                {/* Sub Links */}
                                {hasSubLinks && isExpanded && (
                                    <div className="flex flex-col gap-1 ml-4 pl-4 border-l-2 border-slate-50 mt-1 mb-2 animate-in slide-in-from-top-2 duration-300">
                                        {link.subLinks?.map((sub) => {
                                            const subHrefUrl = new URL(sub.href, 'http://localhost');
                                            const currentSearch = searchParams.toString();
                                            const isParamMatch = subHrefUrl.searchParams.toString() === currentSearch;
                                            const isSubActive = sub.active || (pathname === subHrefUrl.pathname && (!subHrefUrl.search || isParamMatch));

                                            return (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isSubActive
                                                        ? 'text-primary'
                                                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50/50'
                                                        }`}
                                                >
                                                    {sub.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-50">
                    <Link
                        href="/"
                        className="flex items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-400 text-xs font-bold hover:bg-slate-100 transition-colors"
                    >
                        홈으로 돌아가기
                    </Link>
                </div>
            </aside>
        </>
    );
}
