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
import { useNotificationStore } from '@/store/notificationStore';
import { formatTimeAgo } from '@/lib/utils';
import Link from 'next/link';

type TabType = 'all' | 'campaign' | 'system';

export default function NotificationCenter() {
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
      
      // 실시간 구독 시작 및 클린업 반환
      const unsubscribe = useNotificationStore.getState().subscribeToNotifications(user.id);
      return () => unsubscribe();
    }
  }, [user, fetchNotifications]);

  const handleMarkAllAsRead = () => {
    if (user) {
      markAllAsRead(user.id);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'campaign') return n.type.startsWith('CAMPAIGN');
    if (activeTab === 'system') return n.type === 'SYSTEM' || n.type === 'NOTICE';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'CAMPAIGN_APPROVED': 
      case 'CAMPAIGN_SELECTED': return <Check className="w-4 h-4 text-green-500" />;
      case 'CAMPAIGN_REJECTED': return <X className="w-4 h-4 text-rose-500" />;
      case 'CAMPAIGN_SHIPPING': return <Info className="w-4 h-4 text-blue-500" />;
      case 'CAMPAIGN_DEADLINE': return <BellRing className="w-4 h-4 text-rose-500" />;
      case 'CAMPAIGN_REVIEW_SUBMITTED': return <Camera className="w-4 h-4 text-violet-500" />;
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
            {(['all', 'campaign', 'system'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-[13px] font-black transition-all relative ${
                  activeTab === tab ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'all' ? '전체' : tab === 'campaign' ? '캠페인' : '공지'}
                {activeTab === tab && (
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
                  <div 
                    key={notification.id}
                    className={`p-5 hover:bg-slate-50/50 transition-all relative group cursor-pointer ${!notification.is_read ? 'bg-rose-50/20' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-4">
                      <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border ${
                        !notification.is_read ? 'bg-white border-rose-100' : 'bg-slate-50 border-slate-100'
                      }`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[13px] leading-snug break-all ${!notification.is_read ? 'font-bold text-slate-900' : 'text-slate-600 font-medium'}`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5 shadow-sm shadow-rose-200" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                          {notification.content}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                          {notification.link && (
                            <Link 
                              href={notification.link}
                              className="text-[11px] font-black text-rose-500 flex items-center gap-0.5 hover:scale-105 transition-transform origin-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              이동하기 <ExternalLink size={12} strokeWidth={3} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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
