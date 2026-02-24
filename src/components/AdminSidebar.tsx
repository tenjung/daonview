'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Headset,
  Image,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  PieChart,
  ShieldCheck,
  Ticket,
  Users,
  X,
} from 'lucide-react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { fetchAdminCampaignCounts, type CampaignCounts } from '@/lib/adminUtils';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ADMIN_LINKS, type SidebarLink } from '@/constants/navigation';

interface AdminSidebarProps {
  initialCounts?: CampaignCounts;
}

const iconMap = {
  LayoutDashboard,
  Megaphone,
  ClipboardCheck,
  Users,
  ShieldCheck,
  Image,
  MessageSquare,
  Bell,
  Mail,
  MessageCircle,
  PieChart,
  Headset,
  CreditCard,
  Ticket,
} as const;

function getCampaignTotal(counts: CampaignCounts): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

function AdminSidebarContent({ initialCounts }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin-sidebar-collapsed') === 'true';
  });
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    '/dashboard/admin/notifications': false,
  });
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
    const fetchCounts = async () => {
      try {
        const nextCounts = await fetchAdminCampaignCounts(supabase);
        setCounts(nextCounts);
      } catch (error) {
        console.error('Error fetching campaign counts:', error);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalCampaignCount = useMemo(() => getCampaignTotal(counts), [counts]);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('admin-sidebar-collapsed', String(next));
  };

  const isActive = (link: SidebarLink): boolean => {
    const matchPaths = link.matchPaths?.length ? link.matchPaths : [link.href];
    if (link.exact) {
      return pathname === link.href;
    }
    return matchPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  };

  const isParentActive = (link: SidebarLink): boolean => {
    const self = isActive(link);
    if (self) return true;
    if (!link.subLinks?.length) return false;
    return link.subLinks.some((sub) => isActive(sub));
  };

  const renderIcon = (iconName: SidebarLink['icon'], className?: string) => {
    if (!iconName) return null;
    const Icon = iconMap[iconName as keyof typeof iconMap];
    if (!Icon) return null;
    return <Icon size={20} className={className} />;
  };

  const renderBadge = (link: SidebarLink, active: boolean) => {
    if (link.badgeKey !== 'campaignTotal') return null;
    return (
      <span
        className={cn(
          'px-1.5 py-0.5 rounded-md text-[10px] font-black',
          active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
        )}
      >
        {totalCampaignCount}
      </span>
    );
  };

  const renderCollapsedItem = (link: SidebarLink, active: boolean) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative">{renderIcon(link.icon, active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-900')}</div>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-bold">
        {link.label}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <aside
      className={cn(
        'bg-white border-r border-slate-100 flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-40',
        isCollapsed ? 'w-[56px]' : 'w-[260px]'
      )}
    >
      <button
        onClick={toggleCollapse}
        className={cn(
          "hidden lg:flex absolute -right-3 top-10 w-7 h-7 rounded-full items-center justify-center z-50",
          "bg-white border border-slate-200 text-slate-400 shadow-sm",
          "shadow-[0_0_0_4px_rgba(244,63,94,0.10)]",
          "transition-all duration-200 ease-out",
          "hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 hover:scale-105 hover:shadow-[0_0_0_5px_rgba(244,63,94,0.14)]",
          "active:scale-95"
        )}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={cn('mb-8 pt-6 pb-6 border-b border-slate-50', isCollapsed ? 'px-0 flex justify-center' : 'px-8')}>
        {!isCollapsed ? (
          <>
            <div className="text-[10px] font-black uppercase text-primary/40 tracking-[0.2em] mb-1">SUPER ADMIN</div>
            <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="bg-rose-500 w-1.5 h-6 rounded-full" />
              관리자 <span className="text-slate-400 font-medium text-sm">님</span>
            </div>
          </>
        ) : (
          <span className="bg-rose-500 w-1.5 h-6 rounded-full" />
        )}
      </div>

      <TooltipProvider delayDuration={0}>
        <nav className={cn('flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar', isCollapsed ? 'px-1' : 'px-4')}>
          {ADMIN_LINKS.map((link) => {
            const active = isParentActive(link);
            const hasChildren = !!link.subLinks?.length;
            const isOpen = !!openMenus[link.href];

            if (hasChildren) {
              return (
                <div key={link.href}>
                  <button
                    onClick={() => setOpenMenus((prev) => ({ ...prev, [link.href]: !prev[link.href] }))}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-2 rounded-xl font-bold transition-all group',
                      active ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                      isCollapsed && 'justify-center px-0 h-9 rounded-lg'
                    )}
                  >
                    {isCollapsed ? (
                      renderCollapsedItem(link, active)
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          {renderIcon(link.icon)}
                          <span>{link.label}</span>
                        </div>
                        <ChevronDown size={16} className={cn('transition-transform', isOpen && 'rotate-180')} />
                      </>
                    )}
                  </button>

                  {!isCollapsed && isOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {link.subLinks!.map((sub) => {
                        const subActive = isActive(sub);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all text-sm',
                              subActive ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            )}
                          >
                            {renderIcon(sub.icon, 'w-[18px] h-[18px]')}
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-2 rounded-xl font-bold transition-all group',
                  active ? 'bg-rose-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                  isCollapsed && 'justify-center px-0 h-9 rounded-lg'
                )}
              >
                {isCollapsed ? (
                  renderCollapsedItem(link, active)
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      {renderIcon(link.icon)}
                      <span>{link.label}</span>
                    </div>
                    {renderBadge(link, active)}
                  </>
                )}
              </Link>
            );
          })}

          <div className={cn('mt-6 pt-6 border-t border-slate-50 mb-8', isCollapsed && 'px-0')}>
            <Link
              href="/"
              className={cn(
                'flex items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-400 text-xs font-bold hover:bg-slate-100 transition-colors',
                isCollapsed && 'p-1 h-9 rounded-lg'
              )}
            >
              {isCollapsed ? <X size={16} /> : '홈으로 돌아가기'}
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
