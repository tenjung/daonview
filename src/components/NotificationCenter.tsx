'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, BellRing, Camera, Check, ExternalLink, Info, MessageSquare, TrendingUp, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore, type Notification } from '@/store/notificationStore';
import { formatTimeAgo } from '@/lib/utils';
import Link from 'next/link';

type UserRole = 'ADMIN' | 'ADVERTISER' | 'INFLUENCER';

interface RoleTab {
  key: string;
  label: string;
  match: (notification: Notification) => boolean;
}

const isCampaignNotification = (notification: Notification) =>
  notification.type.startsWith('CAMPAIGN') || notification.entity_type === 'campaign';

const isNoticeNotification = (notification: Notification) =>
  notification.type === 'SYSTEM' ||
  notification.type === 'NOTICE' ||
  notification.entity_type === 'system' ||
  notification.entity_type === 'notice';

const isAdminRiskNotification = (notification: Notification) =>
  ['ADMIN_CAMPAIGN_CRITICAL', 'CAMPAIGN_CRITICAL', 'CAMPAIGN_WARNING', 'CAMPAIGN_DEADLINE'].includes(notification.type);

const isAdvertiserSelectionNotification = (notification: Notification) =>
  ['CAMPAIGN_NEW_APPLICANT', 'CAMPAIGN_SELECTED', 'CAMPAIGN_REJECTED'].includes(notification.type);

const isAdvertiserOperationNotification = (notification: Notification) =>
  ['CAMPAIGN_REVIEW_SUBMITTED', 'CAMPAIGN_REVIEW_RECEIVED', 'CAMPAIGN_SHIPPING', 'CAMPAIGN_MILESTONE', 'CAMPAIGN_DEADLINE'].includes(notification.type);

const isInfluencerSelectionNotification = (notification: Notification) =>
  ['CAMPAIGN_SELECTED', 'CAMPAIGN_APPROVED', 'CAMPAIGN_REJECTED'].includes(notification.type);

const isInfluencerScheduleNotification = (notification: Notification) =>
  ['CAMPAIGN_SHIPPING', 'CAMPAIGN_DEADLINE', 'CAMPAIGN_MILESTONE', 'CAMPAIGN_REVIEW_TODO'].includes(notification.type);

const ROLE_TAB_CONFIG: Record<UserRole, RoleTab[]> = {
  ADMIN: [
    { key: 'all', label: '전체', match: () => true },
    { key: 'risk', label: '리스크', match: isAdminRiskNotification },
    { key: 'campaign', label: '캠페인', match: isCampaignNotification },
    { key: 'notice', label: '공지', match: isNoticeNotification },
  ],
  ADVERTISER: [
    { key: 'all', label: '전체', match: () => true },
    { key: 'selection', label: '신청·선정', match: isAdvertiserSelectionNotification },
    { key: 'operation', label: '리뷰·운영', match: isAdvertiserOperationNotification },
    { key: 'notice', label: '공지', match: isNoticeNotification },
  ],
  INFLUENCER: [
    { key: 'all', label: '전체', match: () => true },
    { key: 'selection', label: '선정', match: isInfluencerSelectionNotification },
    { key: 'schedule', label: '배송·마감', match: isInfluencerScheduleNotification },
    { key: 'notice', label: '공지', match: isNoticeNotification },
  ],
};

export default function NotificationCenter() {
  const { user, profile } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [newThreshold] = useState(() => Date.now() - 24 * 60 * 60 * 1000);

  const rawRole = typeof profile?.role === 'string' ? profile.role.toUpperCase() : '';
  const role: UserRole = rawRole === 'ADMIN' || rawRole === 'ADVERTISER' ? rawRole : 'INFLUENCER';
  const roleTabs = ROLE_TAB_CONFIG[role];

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
      
      // 실시간 구독 시작 및 클린업 반환
      const unsubscribe = useNotificationStore.getState().subscribeToNotifications(user.id);
      return () => unsubscribe();
    }
  }, [user, fetchNotifications]);

  const resolvedActiveTab = roleTabs.some((tab) => tab.key === activeTab) ? activeTab : roleTabs[0].key;

  const handleMarkAllAsRead = () => {
    if (user) {
      markAllAsRead(user.id);
    }
  };

  const isNewNotification = (createdAt: string, isRead: boolean) => {
    if (isRead) return false;
    const created = new Date(createdAt).getTime();
    return created >= newThreshold;
  };

  const getPriority = (notification: (typeof notifications)[number]) => {
    if (typeof notification.priority === 'number') return notification.priority;
    if (notification.type === 'ADMIN_CAMPAIGN_CRITICAL' || notification.type === 'CAMPAIGN_CRITICAL') return 2;
    if (notification.type === 'CAMPAIGN_WARNING' || notification.type === 'NOTICE') return 1;
    return 0;
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
    const priorityDiff = getPriority(b) - getPriority(a);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredNotifications = sortedNotifications.filter(n => {
    const currentTab = roleTabs.find((tab) => tab.key === resolvedActiveTab) || roleTabs[0];
    return currentTab.match(n);
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'CAMPAIGN_APPROVED': 
      case 'CAMPAIGN_SELECTED': return <Check className="w-4 h-4 text-green-500" />;
      case 'CAMPAIGN_REJECTED': return <X className="w-4 h-4 text-rose-500" />;
      case 'CAMPAIGN_SHIPPING': return <Info className="w-4 h-4 text-blue-500" />;
      case 'CAMPAIGN_DEADLINE': return <BellRing className="w-4 h-4 text-rose-500" />;
      case 'CAMPAIGN_REVIEW_SUBMITTED': return <Camera className="w-4 h-4 text-violet-500" />;
      case 'CAMPAIGN_REVIEW_TODO': return <Camera className="w-4 h-4 text-amber-500" />;
      case 'CAMPAIGN_NEW_APPLICANT': return <Bell className="w-4 h-4 text-blue-500" />;
      case 'CAMPAIGN_MILESTONE': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'CAMPAIGN_REVIEW_RECEIVED': return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'CAMPAIGN_CRITICAL': 
      case 'ADMIN_CAMPAIGN_CRITICAL': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'CAMPAIGN_WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'MESSAGE': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'NOTICE': return <Bell className="w-4 h-4 text-amber-500" />;
      case 'SYSTEM': return <Info className="w-4 h-4 text-amber-500" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleRead = async (notification: (typeof notifications)[number]) => {
    if (!user) return;
    await markAsRead(notification, user.id);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-slate-50 transition-all group outline-none">
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5 text-rose-500 animate-swing" />
          ) : (
            <Bell className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
          )}
          {unreadCount > 0 && (
            <span className="absolute top-[1.5px] right-[1.5px] flex h-[14px] w-[14px]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-[14px] w-[14px] bg-rose-500 text-[8px] font-bold text-white items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 rounded-3xl shadow-2xl border-none overflow-hidden mt-2 z-[110]">
        <div className="bg-white">
          {/* Header */}
          <div className="p-5 pb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">알림</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors"
              >
                모두 읽음 처리
              </button>
            )}
          </div>

          {/* Simple Tabs */}
          <div className="flex px-5 border-b border-slate-100 gap-6">
            {roleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-[13px] font-black transition-all relative ${
                  resolvedActiveTab === tab.key ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                {resolvedActiveTab === tab.key && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <ScrollArea className="h-[420px]">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map((notification) => (
                  (() => {
                    const isSeenCampaign = notification.entity_type === 'campaign' && !!notification.seen_at;
                    const isNew = isNewNotification(notification.created_at, notification.is_read);
                    const isUrgent = getPriority(notification) >= 2;

                    return (
                  <div 
                    key={notification.id}
                    className={`p-5 hover:bg-slate-50/50 transition-all relative group cursor-pointer ${
                      isNew ? 'bg-rose-50/20' : isSeenCampaign ? 'bg-slate-50/70' : ''
                    }`}
                    onClick={() => handleRead(notification)}
                  >
                    <div className="flex gap-4">
                      <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border ${
                        isNew ? 'bg-white border-rose-100' : 'bg-slate-50 border-slate-100'
                      }`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[13px] leading-snug break-all ${
                            isNew ? 'font-bold text-slate-900' : isSeenCampaign ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'
                          }`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {isUrgent && <Badge className="bg-red-100 text-red-600 border-red-200 hover:bg-red-100 text-[9px] px-1.5 py-0">긴급</Badge>}
                            {isNew && <Badge className="bg-rose-100 text-rose-600 border-rose-200 hover:bg-rose-100 text-[9px] px-1.5 py-0">신규</Badge>}
                            {!notification.is_read && !isNew && (
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shadow-sm shadow-rose-200" />
                            )}
                          </div>
                        </div>
                        <p className={`text-xs line-clamp-2 leading-relaxed font-medium ${isSeenCampaign ? 'text-slate-400' : 'text-slate-500'}`}>
                          {notification.content}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isSeenCampaign ? 'text-slate-300' : 'text-slate-400'}`}>
                            {formatTimeAgo(notification.created_at)}
                          </p>
                          {notification.link && (
                            <Link 
                              href={notification.link}
                              className="text-[11px] font-black text-rose-500 flex items-center gap-0.5 hover:scale-105 transition-transform origin-right"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleRead(notification);
                              }}
                            >
                              이동하기 <ExternalLink size={12} strokeWidth={3} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center p-10 text-center">
                <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-6 rotate-12 group-hover:rotate-0 transition-transform">
                  <Bell className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-base font-black text-slate-900">알림이 비어있어요</p>
                <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                  다온뷰에서 전해드리는<br />중요한 소식들을 여기서 확인하세요!
                </p>
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 bg-slate-50/50 border-t border-slate-100">
            <Link 
              href="/dashboard/notifications" 
              className="w-full h-11 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-[13px] font-black text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
            >
              전체 알림 보기
            </Link>
          </div>
        </div>
      </PopoverContent>
      <style jsx global>{`
        @keyframes swing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
        }
        .animate-swing {
          animation: swing 2s infinite ease-in-out;
          transform-origin: top center;
        }
      `}</style>
    </Popover>
  );
}
