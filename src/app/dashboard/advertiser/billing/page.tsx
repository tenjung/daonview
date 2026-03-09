'use client';

import { useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';
import { ADVERTISER_LINKS } from '@/constants/navigation';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
    AlertTriangle,
    ArrowRight,
    CreditCard,
    ExternalLink,
    Infinity,
    RotateCcw,
    Star,
    Zap,
} from 'lucide-react';

export default function BillingPage() {
    const { profile, user } = useAuthStore();
    const { subscription, isUnlimited, isCancelled, refetch } = useSubscription();

    const [payments, setPayments] = useState<any[]>([]);
    const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchPayments = useCallback(async () => {
        if (!user) return;

        setIsPaymentsLoading(true);
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    campaigns:campaign_id (title, type)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayments(data || []);
        } catch (error: any) {
            console.error('[BillingHistory] Fetch Error:', error);
        } finally {
            setIsPaymentsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handleCancelSubscription = async () => {
        if (!user) return;
        setIsCancelling(true);
        try {
            const res = await fetch('/api/payments/subscription/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('구독이 해지되었습니다. 구독 기간까지 계속 이용하실 수 있습니다.');
                setShowCancelModal(false);
                refetch();
            } else {
                toast.error(data.message || '해지 처리에 실패했습니다.');
            }
        } catch {
            toast.error('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsCancelling(false);
        }
    };

    const displayName = profile?.company_name || profile?.nickname || '광고주';
    const isVerified = profile?.biz_verification_status === 'APPROVED';

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="ADVERTISER"
                userName={displayName}
                links={ADVERTISER_LINKS.map((link) => ({
                    ...link,
                    active: link.href === '/dashboard/advertiser/billing',
                }))}
            />

            <main className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
                <div className="mx-auto max-w-[1200px]">
                    {!isVerified && (
                        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100">
                                <CreditCard className="h-9 w-9 text-gray-300" />
                            </div>
                            <h2 className="mb-3 text-2xl font-black text-gray-900">사업자 인증이 필요합니다</h2>
                            <p className="mb-8 max-w-sm text-sm leading-relaxed text-gray-500">
                                결제 관리는 <strong className="text-gray-700">사업자 인증이 완료된 광고주</strong>에게만 제공됩니다.
                                <br />
                                먼저 사업자 인증을 완료해 주세요.
                            </p>
                            <Link
                                href="/dashboard/advertiser/verification"
                                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                            >
                                사업자 인증 하러 가기
                                <ArrowRight size={16} />
                            </Link>
                            {profile?.biz_verification_status === 'PENDING' && (
                                <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-600">
                                    ⏳ 현재 심사가 진행 중입니다. 승인 완료 후 이용 가능합니다.
                                </p>
                            )}
                        </div>
                    )}

                    {isVerified && (
                        <>
                            <div className="mb-8">
                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                                    <div>
                                        <div className="mb-2 flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                                <CreditCard className="h-5 w-5 text-primary" />
                                            </div>
                                            <h1 className="text-3xl font-black tracking-tight text-gray-900">결제 관리</h1>
                                        </div>
                                        <p className="ml-[52px] mt-1 text-gray-500">이용 중인 플랜과 결제 내역을 확인하고 관리하세요.</p>
                                    </div>

                                    <Link
                                        href="/dashboard/advertiser/pricing"
                                        className="ml-[52px] inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-white px-5 py-3 text-sm font-black text-primary shadow-sm transition-all hover:bg-primary/5 md:ml-0"
                                    >
                                        이용요금 안내 보기
                                        <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>

                            <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                    <div className="relative flex flex-col items-center gap-8 overflow-hidden rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm md:flex-row lg:col-span-2">
                                        <div className="absolute right-0 top-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

                                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10">
                                            {isUnlimited ? (
                                                <Infinity className="h-10 w-10 text-primary" />
                                            ) : (
                                                <Zap className="h-10 w-10 text-primary" />
                                            )}
                                        </div>

                                        <div className="flex-1 text-center md:text-left">
                                            <div className="mb-1 flex items-center justify-center gap-2 md:justify-start">
                                                <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                                                    Current Plan
                                                </span>
                                                {isCancelled && (
                                                    <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-500 border border-rose-100">
                                                        해지됨
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="mb-2 text-2xl font-black text-gray-900">
                                                {isUnlimited ? '무제한 이용권 정기구독' : '건당 결제 (Basic)'}
                                            </h2>
                                            <p className="text-sm font-medium text-gray-500">
                                                {isCancelled
                                                    ? `${format(new Date(subscription!.expires_at), 'yyyy년 MM월 dd일')}까지 이용 가능합니다. 이후 자동 갱신되지 않습니다.`
                                                    : isUnlimited
                                                        ? '매월 제한 없이 캠페인을 등록할 수 있는 멤버십입니다.'
                                                        : '필요한 만큼만 결제하여 이용하는 기본 요금제입니다.'}
                                            </p>
                                        </div>

                                        {/* 구독 중 - 날짜 + 해지 버튼 */}
                                        {isUnlimited && subscription && !isCancelled && (
                                            <div className="flex w-full shrink-0 flex-col items-center gap-3 md:w-auto">
                                                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-6">
                                                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Expiration Date</p>
                                                    <p className="text-xl font-black text-gray-900">{format(new Date(subscription.expires_at), 'yyyy.MM.dd')}</p>
                                                    <div className="mt-2 rounded-full border border-primary/10 bg-white px-3 py-1 text-xs font-black text-primary shadow-sm">
                                                        D-{Math.ceil((new Date(subscription.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일 남음
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setShowCancelModal(true)}
                                                    className="w-full rounded-xl border border-rose-100 bg-rose-50 px-4 py-2 text-xs font-black text-rose-500 transition-all hover:bg-rose-100"
                                                >
                                                    구독 해지
                                                </button>
                                            </div>
                                        )}

                                        {/* 해지됨 - 만료일까지 이용 중 */}
                                        {isUnlimited && subscription && isCancelled && (
                                            <div className="flex w-full shrink-0 flex-col items-center gap-3 md:w-auto">
                                                <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/50 p-6">
                                                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-rose-400">이용 종료일</p>
                                                    <p className="text-xl font-black text-gray-900">{format(new Date(subscription.expires_at), 'yyyy.MM.dd')}</p>
                                                    <div className="mt-2 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-black text-rose-400 shadow-sm">
                                                        D-{Math.ceil((new Date(subscription.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일 후 종료
                                                    </div>
                                                </div>
                                                <Link
                                                    href="/dashboard/advertiser/pricing?tab=subscription"
                                                    className="w-full rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-center text-xs font-black text-primary transition-all hover:bg-primary/10"
                                                >
                                                    재구독 하기
                                                </Link>
                                            </div>
                                        )}

                                        {/* 미구독 */}
                                        {!isUnlimited && (
                                            <Link
                                                href="/dashboard/advertiser/pricing?tab=subscription"
                                                className="w-full rounded-2xl bg-gray-900 px-8 py-4 text-center text-sm font-black text-white shadow-xl shadow-gray-200 transition-all hover:bg-black md:w-auto"
                                            >
                                                프리미엄 구독하기
                                            </Link>
                                        )}
                                    </div>

                                    <div className="flex flex-col justify-between rounded-[32px] bg-primary p-8 text-white shadow-xl shadow-primary/20">
                                        <div>
                                            <Star className="mb-4 h-8 w-8 text-white/50" />
                                            <h3 className="mb-1 text-lg font-bold opacity-80">누적 지출액</h3>
                                            <p className="text-3xl font-black">
                                                {payments
                                                    .reduce((sum, p) => (p.status === 'PAID' ? sum + p.amount : sum), 0)
                                                    .toLocaleString()}
                                                <span className="ml-1 text-sm font-bold">원</span>
                                            </p>
                                        </div>
                                        <div className="mt-6 flex items-end justify-between border-t border-white/20 pt-6">
                                            <div>
                                                <p className="text-xs font-bold opacity-70">총 결제 건수</p>
                                                <p className="text-xl font-black">{payments.length}건</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold opacity-70">등록한 캠페인</p>
                                                <p className="text-xl font-black">{payments.filter((p) => !!p.campaign_id).length}개</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-sm">
                                    <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/50 px-8 py-6">
                                        <h3 className="text-lg font-black text-gray-900">최근 결제 내역</h3>
                                        <button onClick={fetchPayments} className="p-2 text-gray-400 transition-colors hover:text-gray-900">
                                            <RotateCcw size={18} className={isPaymentsLoading ? 'animate-spin' : ''} />
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-gray-50 bg-gray-50/30 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    <th className="px-8 py-4 text-center">날짜</th>
                                                    <th className="px-8 py-4">항목</th>
                                                    <th className="px-8 py-4 text-right">금액</th>
                                                    <th className="px-8 py-4 text-center">상태</th>
                                                    <th className="px-8 py-4 text-center">증빙</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {isPaymentsLoading ? (
                                                    Array.from({ length: 3 }).map((_, i) => (
                                                        <tr key={i} className="animate-pulse">
                                                            <td colSpan={5} className="h-20 bg-gray-50/20" />
                                                        </tr>
                                                    ))
                                                ) : payments.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="py-20 text-center font-bold italic text-gray-300">
                                                            결제 내역이 존재하지 않습니다.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    payments.map((p) => (
                                                        <tr key={p.id} className="group transition-colors hover:bg-gray-50/50">
                                                            <td className="px-8 py-5 text-center">
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-sm font-black text-gray-700">{format(new Date(p.created_at), 'yyyy.MM.dd')}</span>
                                                                    <span className="text-[10px] font-bold text-gray-400">{format(new Date(p.created_at), 'HH:mm')}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex flex-col">
                                                                    <span className="line-clamp-1 text-sm font-black text-gray-900">
                                                                        {p.campaigns?.title || (p.amount > 100000 ? '무제한 이용권 정기결제' : '시스템 이용료')}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold uppercase text-gray-400">
                                                                        {p.method} • {p.payment_id.slice(0, 8)}...
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-right font-black text-gray-900">{p.amount.toLocaleString()}원</td>
                                                            <td className="px-8 py-5 text-center">
                                                                <div className="flex justify-center">
                                                                    {p.status === 'PAID' ? (
                                                                        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-600">결제완료</span>
                                                                    ) : p.status === 'CANCELLED' ? (
                                                                        <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[10px] font-black text-rose-600">취소됨</span>
                                                                    ) : (
                                                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black text-gray-400">실패</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-center">
                                                                <div className="flex justify-center">
                                                                    {p.receipt_url ? (
                                                                        <a
                                                                            href={p.receipt_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="rounded-xl border border-transparent bg-gray-50 p-2 text-gray-400 transition-all hover:border-primary/20 hover:text-primary"
                                                                            title="영수증 보기"
                                                                        >
                                                                            <ExternalLink size={16} />
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-gray-300">-</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* 구독 해지 확인 모달 */}
            {showCancelModal && subscription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="mx-4 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
                            <AlertTriangle className="h-7 w-7 text-rose-500" />
                        </div>
                        <h3 className="mb-2 text-xl font-black text-gray-900">구독을 해지하시겠어요?</h3>
                        <p className="mb-1 text-sm text-gray-500">
                            해지 후에도 <strong className="text-gray-800">{format(new Date(subscription.expires_at), 'yyyy년 MM월 dd일')}</strong>까지는 무제한 이용권을 계속 사용할 수 있습니다.
                        </p>
                        <p className="mb-8 text-sm text-gray-400">
                            이후에는 자동 갱신이 중단되며, 건당 결제 방식으로 전환됩니다.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 rounded-2xl border border-gray-200 py-3.5 text-sm font-black text-gray-600 transition-all hover:bg-gray-50"
                                disabled={isCancelling}
                            >
                                돌아가기
                            </button>
                            <button
                                onClick={handleCancelSubscription}
                                disabled={isCancelling}
                                className="flex-1 rounded-2xl bg-rose-500 py-3.5 text-sm font-black text-white shadow-lg shadow-rose-200 transition-all hover:bg-rose-600 disabled:opacity-60"
                            >
                                {isCancelling ? '처리 중...' : '구독 해지'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
