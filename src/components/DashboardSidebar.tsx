'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
    Menu, X, ChevronDown, ChevronRight, 
    LayoutDashboard, Megaphone, Globe, Heart, UserCog, User, 
    Truck, Tags, MessageSquare, Users, ClipboardCheck, 
    ShieldCheck, Store, BarChart3, Image as ImageIcon, PieChart, 
    Headset, ChevronLeft, PanelLeftClose, PanelLeftOpen,
    CreditCard, Receipt
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarLink } from '@/constants/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DashboardSidebarProps {
    userType: 'INFLUENCER' | 'ADVERTISER' | 'ADMIN';
    userName: string;
    links: SidebarLink[];
}

const IconMap: Record<string, any> = {
    LayoutDashboard, Megaphone, Globe, Heart, UserCog, User,
    Truck, Tags, MessageSquare, Users, ClipboardCheck,
    ShieldCheck, Store, BarChart3, Image: ImageIcon, PieChart,
    Headset, CreditCard, Receipt
};

export default function DashboardSidebar({ userType, userName, links }: DashboardSidebarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const pathname = usePathname();
    const [searchParamsString, setSearchParamsString] = useState('');
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

    // 초기 설정 및 로컬스토리지 상태 로드
    useEffect(() => {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState !== null) {
            setIsCollapsed(savedState === 'true');
        }
        setIsLoaded(true);
        setSearchParamsString(window.location.search.replace(/^\?/, ''));

        const initialExpanded: Record<string, boolean> = {};
        links.forEach(link => {
            const isAnySubActive = link.subLinks?.some(sub => {
                const subUrl = new URL(sub.href, 'http://localhost');
                const isPathMatch = pathname === subUrl.pathname;
                if (subUrl.search) {
                    return isPathMatch && searchParamsString.includes(subUrl.searchParams.toString());
                }
                return isPathMatch;
            });

            if (isAnySubActive || link.active) {
                initialExpanded[link.label] = true;
            }
        });
        setExpandedMenus(prev => ({ ...prev, ...initialExpanded }));
    }, [links, pathname, searchParamsString]);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    const toggleMenu = (label: string) => {
        if (isCollapsed) {
            setIsCollapsed(false);
            localStorage.setItem('sidebar-collapsed', 'false');
        }
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

    if (!isLoaded) return <div className="w-[280px] lg:static fixed h-screen bg-white" />;

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
            <aside className={cn(
                "bg-white border-r border-slate-100 flex flex-col shrink-0 fixed lg:static top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none",
                isCollapsed ? "w-[88px]" : "w-[260px]",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Collapse Toggle Button (Desktop) */}
                <button
                    onClick={toggleCollapse}
                    className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-primary transition-all z-50 shadow-sm"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div className={cn("mb-10 pl-2 pr-2 pt-8", isCollapsed ? "items-center" : "pl-6")}>
                    {!isCollapsed ? (
                        <>
                            <div className="text-[10px] font-black uppercase text-primary/40 tracking-[0.2em] mb-1">
                                {userTypeLabel[userType]}
                            </div>
                            <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <span className="bg-rose-500 w-1.5 h-6 rounded-full"></span>
                                {userName} <span className="text-slate-400 font-medium">님</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-2 pt-2">
                            <span className="bg-rose-500 w-1.5 h-6 rounded-full"></span>
                        </div>
                    )}
                </div>

                <TooltipProvider delayDuration={0}>
                    <nav className={cn("flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar px-3")}>
                        {links.map((link) => {
                            const Icon = link.icon ? IconMap[link.icon] : null;
                            const hasSubLinks = link.subLinks && link.subLinks.length > 0;
                            const isExpanded = expandedMenus[link.label];
                            const isAnySubActive = link.subLinks?.some(sub => {
                                const subUrl = new URL(sub.href, 'http://localhost');
                                return pathname === subUrl.pathname;
                            });
                            const isActive = link.active || isAnySubActive;

                            const content = (
                                <div key={link.label} className="flex flex-col gap-1">
                                    {hasSubLinks ? (
                                        <button
                                            onClick={() => toggleMenu(link.label)}
                                            className={cn(
                                                "flex items-center px-4 py-3 rounded-xl font-bold transition-all group",
                                                isActive ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                                                isCollapsed && "justify-center px-0"
                                            )}
                                        >
                                            <div className={cn("flex items-center gap-3", isCollapsed && "gap-0")}>
                                                {Icon && <Icon size={20} className={cn(isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-900")} />}
                                                {!isCollapsed && (
                                                    <>
                                                        {link.label}
                                                        {link.tag && (
                                                            <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-md italic tracking-tighter shadow-sm">
                                                                {link.tag}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            {!isCollapsed && (isExpanded ? <ChevronDown size={14} className="ml-auto" /> : <ChevronRight size={14} className="ml-auto" />)}
                                        </button>
                                    ) : (
                                        <Link
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center px-4 py-3 rounded-xl font-bold transition-all group",
                                                link.active ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                                                isCollapsed && "justify-center px-0"
                                            )}
                                        >
                                            <div className={cn("flex items-center gap-3", isCollapsed && "gap-0")}>
                                                {Icon && <Icon size={20} className={cn(link.active ? "text-primary" : "text-slate-400 group-hover:text-slate-900")} />}
                                                {!isCollapsed && (
                                                    <>
                                                        {link.label}
                                                        {link.tag && (
                                                            <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-md italic tracking-tighter shadow-sm">
                                                                {link.tag}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </Link>
                                    )}

                                    {/* Sub Links */}
                                    {hasSubLinks && isExpanded && !isCollapsed && (
                                        <div className="flex flex-col gap-1 ml-6 pl-4 border-l border-slate-100 mt-1 mb-2 animate-in slide-in-from-top-2 duration-300">
                                            {link.subLinks?.map((sub) => {
                                                const subHrefUrl = new URL(sub.href, 'http://localhost');
                                                const isParamMatch = subHrefUrl.searchParams.toString() === searchParamsString;
                                                const isSubActive = sub.active || (pathname === subHrefUrl.pathname && (!subHrefUrl.search || isParamMatch));

                                                return (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className={cn(
                                                            "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                                            isSubActive ? 'text-primary' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50/50'
                                                        )}
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );

                            return isCollapsed ? (
                                <Tooltip key={link.label}>
                                    <TooltipTrigger asChild>
                                        {content}
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="font-bold">
                                        {link.label}
                                    </TooltipContent>
                                </Tooltip>
                            ) : content;
                        })}
                    </nav>
                </TooltipProvider>

                <div className={cn("mt-auto pt-6 border-t border-slate-50 pb-8 px-4", isCollapsed && "px-2 items-center")}>
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
            </aside>
        </>
    );
}
