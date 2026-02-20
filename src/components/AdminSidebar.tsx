'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, LayoutDashboard, Megaphone, Users, CreditCard, Globe, Image, ShieldCheck, ChevronLeft, Headset, BarChart3, ClipboardCheck, MessageSquare, PieChart, Star, LogOut, X, Menu, Bell, Mail, MessageCircle, Ticket } from 'lucide-react';
import { useState, Suspense, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [campaignMenuOpen, setCampaignMenuOpen] = useState(true);
    const [reviewMenuOpen, setReviewMenuOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(true);
    const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
    const [counts, setCounts] = useState<CampaignCounts>(initialCounts || {
        pending: 0,
        upcoming: 0,
        active: 0,
        completed: 0,
        draft: 0
    });

    // 로컬스토리지 상태 로드
    useEffect(() => {
        const savedState = localStorage.getItem('admin-sidebar-collapsed');
        if (savedState !== null) {
            setIsCollapsed(savedState === 'true');
        }
        setIsLoaded(true);

        const fetchCounts = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const [pendingRes, recruitingRes, completedRes, draftRes] = await Promise.all([
                    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
                    supabase.from('campaigns').select('id, recruitment_start_date, created_at, status')
                        .in('status', ['RECRUITING', 'ONGOING']),
                    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
                    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'DRAFT')
                ]);

                const recruitingCampaigns = recruitingRes.data || [];
                let upcomingCount = 0;
                let activeCount = 0;

                recruitingCampaigns.forEach(cam => {
                    if (cam.status === 'ONGOING') {
                        activeCount++;
                        return;
                    }
                    if (cam.status === 'RECRUITING') {
                        const startDateStr = cam.recruitment_start_date || cam.created_at;
                        const startDate = startDateStr.split('T')[0];
                        if (startDate > today) upcomingCount++;
                        else activeCount++;
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
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('admin-sidebar-collapsed', String(newState));
    };

    const isActive = (path: string, type?: string) => {
        if (type) return pathname === path && searchParams.get('type') === type;
        if (path === '/dashboard/admin/campaigns' && !searchParams.get('type')) return pathname === path;
        return pathname === path;
    };

    const isInCampaignSection =
        pathname.includes('/dashboard/admin/campaigns') ||
        pathname.includes('/dashboard/campaign/new') ||
        pathname.match(/\/dashboard\/admin\/campaigns\/\d+/);

    if (!isLoaded) return <aside className="w-[260px] bg-white border-r h-screen" />;

    return (
        <aside className={cn(
            "bg-white border-r border-slate-100 flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-40",
            isCollapsed ? "w-[88px]" : "w-[260px]"
        )}>
            {/* Collapse Toggle Button */}
            <button
                onClick={toggleCollapse}
                className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-primary transition-all z-50 shadow-sm"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className={cn("px-6 mb-8 pt-6 pb-6 border-b border-slate-50", isCollapsed ? "px-0 items-center" : "px-8")}>
                {!isCollapsed ? (
                    <>
                        <div className="text-[10px] font-black uppercase text-primary/40 tracking-[0.2em] mb-1">SUPER ADMIN</div>
                        <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="bg-rose-500 w-1.5 h-6 rounded-full"></span>
                            관리자 <span className="text-slate-400 font-medium text-sm">님</span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <span className="bg-rose-500 w-1.5 h-6 rounded-full"></span>
                    </div>
                )}
            </div>

            <TooltipProvider delayDuration={0}>
                <nav className="flex flex-col gap-1 flex-1 overflow-y-auto px-4 custom-scrollbar">
                    {/* 대시보드 */}
                    <Link
                        href="/dashboard/admin"
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all group",
                            isActive('/dashboard/admin') ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <LayoutDashboard size={20} className={isActive('/dashboard/admin') ? "text-primary" : "text-slate-400 group-hover:text-slate-900"} />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-bold">인사이트</TooltipContent>
                            </Tooltip>
                        ) : (
                            <>
                                <LayoutDashboard size={20} />
                                <span>인사이트</span>
                            </>
                        )}
                    </Link>

                    {/* 캠페인 관리 */}
                    <Link
                        href="/dashboard/admin/campaigns"
                        className={cn(
                            "flex items-center justify-between px-4 py-2 rounded-xl font-bold transition-all group",
                            isInCampaignSection ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="relative">
                                        <Megaphone size={20} className={isInCampaignSection ? "text-primary" : "text-slate-400 group-hover:text-slate-900"} />
                                        <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[9px] px-1 rounded-full min-w-[14px] text-center">
                                            {Object.values(counts).reduce((a, b) => a + b, 0)}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-bold">캠페인 관리</TooltipContent>
                            </Tooltip>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <Megaphone size={20} />
                                    <span>캠페인 관리</span>
                                </div>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                                    isInCampaignSection ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                                )}>
                                    {Object.values(counts).reduce((a, b) => a + b, 0)}
                                </span>
                            </>
                        )}
                    </Link>

                    {/* 리뷰 관리 */}
                    <Link
                        href="/dashboard/admin/reviews"
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all group",
                            pathname.includes('/dashboard/admin/reviews') ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ClipboardCheck size={20} className={pathname.includes('/dashboard/admin/reviews') ? "text-primary" : "text-slate-400 group-hover:text-slate-900"} />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-bold">리뷰 관리</TooltipContent>
                            </Tooltip>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <ClipboardCheck size={20} />
                                    <span>리뷰 관리</span>
                                </div>
                            </>
                        )}
                    </Link>

                    {/* 회원 관리 */}
                    <Link
                        href="/dashboard/admin/users"
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all group",
                            pathname.includes('/dashboard/admin/users') ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Users size={20} className={pathname.includes('/dashboard/admin/users') ? "text-primary" : "text-slate-400 group-hover:text-slate-900"} />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-bold">회원 관리</TooltipContent>
                            </Tooltip>
                        ) : (
                            <>
                                <Users size={20} />
                                <span>회원 관리</span>
                            </>
                        )}
                    </Link>

                    {/* 사업자 인증 관리 */}
                    <Link
                        href="/dashboard/admin/verifications"
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all group",
                            pathname.includes('/dashboard/admin/verifications') ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ShieldCheck size={20} className={pathname.includes('/dashboard/admin/verifications') ? "text-primary" : "text-slate-400 group-hover:text-slate-900"} />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-bold">사업자 인증</TooltipContent>
                            </Tooltip>
                        ) : (
                            <>
                                <ShieldCheck size={20} />
                                <span>사업자 인증</span>
                            </>
                        )}
                    </Link>

                    {/* 배너 관리 */}
                    <Link
                        href="/dashboard/admin/banners"
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all group",
                            isActive('/dashboard/admin/banners') ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Image size={20} className={isActive('/dashboard/admin/banners') ? "text-primary" : "text-slate-400 group-hover:text-slate-900"} />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-bold">배너 관리</TooltipContent>
                            </Tooltip>
                        ) : (
                            <>
                                <Image size={20} />
                                <span>배너 관리</span>
                            </>
                        )}
                    </Link>

                    {/* 커뮤니티 관리 */}
                    <Link
                        href="/dashboard/admin/community"
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all group",
                            pathname.includes('/dashboard/admin/community') ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <MessageSquare size={20} className={pathname.includes('/dashboard/admin/community') ? "text-primary" : "text-slate-400 group-hover:text-slate-900"} />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-bold">커뮤니티 관리</TooltipContent>
                            </Tooltip>
                        ) : (
                            <>
                                <MessageSquare size={20} />
                                <span>커뮤니티 관리</span>
                            </>
                        )}
                    </Link>

                    {/* 알림 전송 관리 */}
                    <div>
                        <button
                            onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-2 rounded-xl font-bold transition-all group",
                                pathname.includes('/dashboard/admin/notifications') ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                                isCollapsed && "justify-center px-0"
                            )}
                        >
                            {isCollapsed ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Bell size={20} className={pathname.includes('/dashboard/admin/notifications') ? "text-primary" : "text-slate-400 group-hover:text-slate-900"} />
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="font-bold">알림 전송 관리</TooltipContent>
                                </Tooltip>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <Bell size={20} />
                                        <span>알림 전송 관리</span>
                                    </div>
                                    <ChevronDown size={16} className={cn("transition-transform", notificationMenuOpen && "rotate-180")} />
                                </>
                            )}
                        </button>

                        {/* 알림 전송 하위 메뉴 */}
                        {!isCollapsed && notificationMenuOpen && (
                            <div className="ml-4 mt-1 space-y-1">
                                <Link
                                    href="/dashboard/admin/notifications/email"
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all text-sm",
                                        pathname === '/dashboard/admin/notifications/email'
                                            ? 'bg-rose-50 text-primary'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <Mail size={18} />
                                    <span>이메일 전송</span>
                                </Link>
                                <Link
                                    href="/dashboard/admin/notifications/kakao"
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all text-sm",
                                        pathname === '/dashboard/admin/notifications/kakao'
                                            ? 'bg-rose-50 text-primary'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <MessageCircle size={18} />
                                    <span>카카오톡 전송</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* 통계 */}
                    <Link
                        href="/dashboard/admin/stats"
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all group",
                            isActive('/dashboard/admin/stats') ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PieChart size={20} className={isActive('/dashboard/admin/stats') ? "text-primary" : "text-slate-400 group-hover:text-slate-900"} />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-bold">통계</TooltipContent>
                            </Tooltip>
                        ) : (
                            <>
                                <PieChart size={20} />
                                <span>통계</span>
                            </>
                        )}
                    </Link>

                    {/* 고객센터 관리 */}
                    <Link
                        href="/dashboard/admin/contact"
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all group",
                            pathname.includes('/dashboard/admin/contact') ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Headset size={20} className={pathname.includes('/dashboard/admin/contact') ? "text-primary" : "text-slate-400 group-hover:text-slate-900"} />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-bold">고객센터</TooltipContent>
                            </Tooltip>
                        ) : (
                            <>
                                <Headset size={20} />
                                <span>고객센터</span>
                            </>
                        )}
                    </Link>
                    {/* 결제 관리 */}
                    <Link
                        href="/dashboard/admin/payments"
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all group",
                            pathname.includes('/dashboard/admin/payments') ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <CreditCard size={20} className={pathname.includes('/dashboard/admin/payments') ? "text-primary" : "text-slate-400 group-hover:text-slate-900"} />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-bold">결제 관리</TooltipContent>
                            </Tooltip>
                        ) : (
                            <>
                                <CreditCard size={20} />
                                <span>결제 관리</span>
                            </>
                        )}
                    </Link>

                    {/* 쿠폰 관리 */}
                    <Link
                        href="/dashboard/admin/coupons"
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all group",
                            pathname.includes('/dashboard/admin/coupons') ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Ticket size={20} className={pathname.includes('/dashboard/admin/coupons') ? "text-primary" : "text-slate-400 group-hover:text-slate-900"} />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-bold">쿠폰 관리</TooltipContent>
                            </Tooltip>
                        ) : (
                            <>
                                <Ticket size={20} />
                                <span>쿠폰 관리</span>
                            </>
                        )}
                    </Link>

                    {/* 홈으로 돌아가기 버튼을 메뉴 리스트 바로 아래로 이동 */}
                    <div className={cn("mt-6 pt-6 border-t border-slate-50 mb-8", isCollapsed && "px-0")}>
                        <Link
                            href="/"
                            className={cn(
                                "flex items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-400 text-xs font-bold hover:bg-slate-100 transition-colors",
                                isCollapsed && "p-2"
                            )}
                        >
                            {isCollapsed ? <X size={16} /> : "홈으로 돌아가기"}
                        </Link>
                    </div>
                </nav>
            </TooltipProvider>
        </aside>
    );
}

export default function AdminSidebar({ initialCounts }: AdminSidebarProps) {
    return (
        <Suspense fallback={<aside className="w-[260px] bg-white border-r border-slate-50 shrink-0 h-screen" />}>
            <AdminSidebarContent initialCounts={initialCounts} />
        </Suspense>
    );
}


