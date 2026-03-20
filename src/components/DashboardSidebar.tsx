'use client';

import Link from 'next/link';
import { type ComponentType, useEffect, useState } from 'react';
import {
    Bell,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    CreditCard,
    FileText,
    Globe,
    Headset,
    Heart,
    Image as ImageIcon,
    LayoutDashboard,
    Mail,
    Megaphone,
    MessageCircle,
    MessageSquare,
    PieChart,
    Receipt,
    ShieldCheck,
    Store,
    Tags,
    Ticket,
    Truck,
    User,
    UserCog,
    Users,
    X,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarLink } from '@/constants/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase/client';
import { fetchAdminCampaignCounts, type CampaignCounts } from '@/lib/adminUtils';
import { type DashboardRoleKey } from '@/constants/role';

interface DashboardSidebarProps {
    userType: DashboardRoleKey;
    userName: string;
    links: SidebarLink[];
    initialCounts?: CampaignCounts;
}

const IconMap: Record<string, ComponentType<{ size?: number; className?: string }>> = {
    Bell,
    ClipboardCheck,
    CreditCard,
    FileText,
    Globe,
    Headset,
    Heart,
    Image: ImageIcon,
    LayoutDashboard,
    Mail,
    Megaphone,
    MessageCircle,
    MessageSquare,
    PieChart,
    Receipt,
    ShieldCheck,
    Store,
    Tags,
    Ticket,
    Truck,
    User,
    UserCog,
    Users,
};

function getCampaignTotal(counts: CampaignCounts): number {
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

function isLinkActive(link: SidebarLink, pathname: string, searchParamsString: string): boolean {
    const matchPaths = link.matchPaths?.length ? link.matchPaths : [link.href];

    return matchPaths.some((path) => {
        const url = new URL(path, 'http://localhost');
        const pathMatches = link.exact
            ? pathname === url.pathname
            : pathname === url.pathname || pathname.startsWith(`${url.pathname}/`);

        if (!pathMatches) return false;
        if (!url.search) return true;

        return url.searchParams.toString() === searchParamsString;
    });
}

function hasActiveDescendant(link: SidebarLink, pathname: string, searchParamsString: string): boolean {
    if (!link.subLinks?.length) return false;

    return link.subLinks.some((subLink) =>
        isLinkActive(subLink, pathname, searchParamsString) ||
        hasActiveDescendant(subLink, pathname, searchParamsString)
    );
}

export default function DashboardSidebar({
    userType,
    userName,
    links,
    initialCounts,
}: DashboardSidebarProps) {
    const { user } = useAuthStore();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchParamsString, setSearchParamsString] = useState('');
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
    const [reviewPendingCount, setReviewPendingCount] = useState(0);
    const [counts, setCounts] = useState<CampaignCounts>(
        initialCounts || {
            pending: 0,
            upcoming: 0,
            active: 0,
            completed: 0,
            draft: 0,
        }
    );

    useEffect(() => {
        const savedState = localStorage.getItem(`sidebar-collapsed:${userType.toLowerCase()}`);
        if (savedState !== null) {
            setIsCollapsed(savedState === 'true');
        }

        const params = window.location.search.replace(/^\?/, '');
        setSearchParamsString(params);
        setIsLoaded(true);
    }, [userType]);

    useEffect(() => {
        const initialExpanded: Record<string, boolean> = {};

        links.forEach((link) => {
            const currentActive =
                isLinkActive(link, pathname, searchParamsString) ||
                hasActiveDescendant(link, pathname, searchParamsString);

            if (currentActive) {
                initialExpanded[link.label] = true;
            }
        });

        setExpandedMenus((prev) => ({ ...prev, ...initialExpanded }));
    }, [links, pathname, searchParamsString]);

    useEffect(() => {
        if (userType !== 'ADMIN') return;

        const fetchCounts = async () => {
            try {
                const nextCounts = await fetchAdminCampaignCounts(supabase);
                setCounts(nextCounts);
            } catch (error) {
                console.error('Failed to fetch admin sidebar counts:', error);
            }
        };

        void fetchCounts();
        const interval = setInterval(() => {
            void fetchCounts();
        }, 30000);

        return () => clearInterval(interval);
    }, [userType]);

    useEffect(() => {
        const fetchReviewPendingCount = async () => {
            if (userType !== 'INFLUENCER' || !user?.id) {
                setReviewPendingCount(0);
                return;
            }

            const { count, error } = await supabase
                .from('applications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .in('status', ['SELECTED', 'APPROVED'])
                .or('review_submitted.is.null,review_submitted.eq.false');

            if (error) {
                console.error('Failed to fetch pending review count:', error);
                setReviewPendingCount(0);
                return;
            }

            setReviewPendingCount(count || 0);
        };

        void fetchReviewPendingCount();
    }, [userType, user?.id]);

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem(`sidebar-collapsed:${userType.toLowerCase()}`, String(nextState));
    };

    const toggleMenu = (label: string) => {
        if (isCollapsed) {
            setIsCollapsed(false);
            localStorage.setItem(`sidebar-collapsed:${userType.toLowerCase()}`, 'false');
        }

        setExpandedMenus((prev) => ({
            ...prev,
            [label]: !prev[label],
        }));
    };

    if (!isLoaded) {
        return <div className="fixed h-screen w-[260px] bg-white lg:static" />;
    }

    return (
        <>
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_24px_rgba(244,63,94,0.3)] transition-all active:scale-95 hover:bg-rose-600 lg:hidden"
                aria-label={`${userType} 대시보드 메뉴`}
            >
                {mobileMenuOpen ? <X size={24} /> : <LayoutDashboard size={24} />}
            </button>

            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <aside
                className={cn(
                    'fixed top-0 left-0 z-40 flex h-screen shrink-0 flex-col border-r border-slate-100 bg-white shadow-xl transition-all duration-300 ease-in-out lg:static lg:shadow-none',
                    isCollapsed ? 'w-[88px]' : 'w-[260px]',
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                <button
                    onClick={toggleCollapse}
                    className="absolute -right-3 top-10 z-50 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:text-primary lg:flex"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div className={cn('mb-10 pt-8', isCollapsed ? 'px-2' : 'pl-6 pr-2')}>
                    {!isCollapsed ? (
                        <>
                            <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">
                                {userType}
                            </div>
                            <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
                                <span className="h-6 w-1.5 rounded-full bg-rose-500" />
                                <span className="truncate" title={userName}>
                                    {userName}
                                </span>
                                <span className="font-medium text-slate-400">님</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-center">
                            <span className="h-6 w-1.5 rounded-full bg-rose-500" />
                        </div>
                    )}
                </div>

                <TooltipProvider delayDuration={0}>
                    <nav className="custom-scrollbar flex flex-1 flex-col gap-1.5 overflow-y-auto px-3">
                        {links.map((link) => {
                            const Icon = link.icon ? IconMap[link.icon] : null;
                            const hasSubLinks = Boolean(link.subLinks?.length);
                            const isAnySubActive = hasActiveDescendant(link, pathname, searchParamsString);
                            const isActive = isLinkActive(link, pathname, searchParamsString) || isAnySubActive;
                            const isExpanded = expandedMenus[link.label];
                            const badgeCount =
                                link.badgeKey === 'reviewPending'
                                    ? reviewPendingCount
                                    : link.badgeKey === 'campaignTotal'
                                        ? getCampaignTotal(counts)
                                        : 0;

                            const item = (
                                <div key={link.label} className="flex flex-col gap-1">
                                    {hasSubLinks ? (
                                        <button
                                            onClick={() => toggleMenu(link.label)}
                                            className={cn(
                                                'flex items-center rounded-xl px-4 py-3 font-bold transition-all group',
                                                isActive ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                                                isCollapsed && 'justify-center px-0'
                                            )}
                                        >
                                            <div className={cn('flex items-center gap-3', isCollapsed && 'gap-0')}>
                                                {Icon ? (
                                                    <Icon
                                                        size={20}
                                                        className={cn(
                                                            isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-900'
                                                        )}
                                                    />
                                                ) : null}
                                                {!isCollapsed && (
                                                    <>
                                                        <span>{link.label}</span>
                                                        {link.tag ? (
                                                            <span className="rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-black italic tracking-tighter text-white shadow-sm">
                                                                {link.tag}
                                                            </span>
                                                        ) : null}
                                                        {badgeCount > 0 ? (
                                                            <span className="min-w-[18px] rounded-full bg-amber-500 px-1.5 py-0.5 text-center text-[10px] font-black leading-none text-white">
                                                                {badgeCount > 99 ? '99+' : badgeCount}
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </div>
                                            {!isCollapsed &&
                                                (isExpanded ? (
                                                    <ChevronDown size={14} className="ml-auto" />
                                                ) : (
                                                    <ChevronRight size={14} className="ml-auto" />
                                                ))}
                                        </button>
                                    ) : (
                                        <Link
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={cn(
                                                'flex items-center rounded-xl px-4 py-3 font-bold transition-all group',
                                                isActive ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                                                isCollapsed && 'justify-center px-0'
                                            )}
                                        >
                                            <div className={cn('flex items-center gap-3', isCollapsed && 'gap-0')}>
                                                {Icon ? (
                                                    <Icon
                                                        size={20}
                                                        className={cn(
                                                            isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-900'
                                                        )}
                                                    />
                                                ) : null}
                                                {!isCollapsed && (
                                                    <>
                                                        <span>{link.label}</span>
                                                        {link.tag ? (
                                                            <span className="rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-black italic tracking-tighter text-white shadow-sm">
                                                                {link.tag}
                                                            </span>
                                                        ) : null}
                                                        {badgeCount > 0 ? (
                                                            <span className="min-w-[18px] rounded-full bg-amber-500 px-1.5 py-0.5 text-center text-[10px] font-black leading-none text-white">
                                                                {badgeCount > 99 ? '99+' : badgeCount}
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </div>
                                        </Link>
                                    )}

                                    {hasSubLinks && isExpanded && !isCollapsed ? (
                                        <div className="mt-1 mb-2 ml-6 flex flex-col gap-1 border-l border-slate-100 pl-4 animate-in slide-in-from-top-2 duration-300">
                                            {link.subLinks?.map((subLink) => {
                                                const isSubActive =
                                                    isLinkActive(subLink, pathname, searchParamsString) ||
                                                    hasActiveDescendant(subLink, pathname, searchParamsString);
                                                const subHasChildren = Boolean(subLink.subLinks?.length);

                                                if (!subHasChildren) {
                                                    return (
                                                        <Link
                                                            key={subLink.href}
                                                            href={subLink.href}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className={cn(
                                                                'rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                                                                isSubActive
                                                                    ? 'text-primary'
                                                                    : 'text-slate-400 hover:bg-slate-50/50 hover:text-slate-700'
                                                            )}
                                                        >
                                                            {subLink.label}
                                                        </Link>
                                                    );
                                                }

                                                return (
                                                    <div key={subLink.href} className="flex flex-col gap-1">
                                                        <div
                                                            className={cn(
                                                                'rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                                                                isSubActive ? 'text-primary' : 'text-slate-500'
                                                            )}
                                                        >
                                                            {subLink.label}
                                                        </div>
                                                        <div className="ml-3 flex flex-col gap-1 border-l border-slate-100 pl-3">
                                                            {subLink.subLinks?.map((nestedLink) => {
                                                                const isNestedActive = isLinkActive(
                                                                    nestedLink,
                                                                    pathname,
                                                                    searchParamsString
                                                                );

                                                                return (
                                                                    <Link
                                                                        key={nestedLink.href}
                                                                        href={nestedLink.href}
                                                                        onClick={() => setMobileMenuOpen(false)}
                                                                        className={cn(
                                                                            'rounded-lg px-3 py-2 text-sm font-medium transition-all',
                                                                            isNestedActive
                                                                                ? 'text-primary'
                                                                                : 'text-slate-400 hover:bg-slate-50/50 hover:text-slate-700'
                                                                        )}
                                                                    >
                                                                        {nestedLink.label}
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : null}
                                </div>
                            );

                            if (!isCollapsed) return item;

                            return (
                                <Tooltip key={link.label}>
                                    <TooltipTrigger asChild>{item}</TooltipTrigger>
                                    <TooltipContent side="right" className="font-bold">
                                        {link.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </nav>
                </TooltipProvider>

                <div className={cn('mt-auto border-t border-slate-50 px-4 pt-6 pb-8', isCollapsed && 'px-2')}>
                    <Link
                        href="/"
                        className={cn(
                            'flex items-center justify-center rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-100',
                            isCollapsed && 'p-2'
                        )}
                    >
                        {isCollapsed ? <X size={16} /> : '홈으로 돌아가기'}
                    </Link>
                </div>
            </aside>
        </>
    );
}
