'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
    CreditCard,
    Search,
    Clock,
    RefreshCcw,
    ExternalLink,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { StatusBadgeCell } from '@/components/data-table/cells/StatusBadgeCell';
import {
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_VARIANTS,
    REFUND_REQUEST_STATUS_LABELS,
    REFUND_REQUEST_STATUS_VARIANTS,
} from '@/constants/status';
import type { RefundRequestPresenter, RefundType } from '@/types/paymentRefund';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Payment {
    id: string;
    user_id: string;
    campaign_id: number | null;
    payment_id: string;
    merchant_uid: string | null;
    amount: number;
    method: string;
    status: 'PENDING' | 'PAID' | 'PARTIAL_CANCELLED' | 'CANCELLED' | 'FAILED';
    payment_data: any;
    receipt_url: string | null;
    cancelled_at: string | null;
    cancel_reason: string | null;
    created_at: string;
    profiles: {
        nickname: string;
        email: string;
        company_name?: string;
    } | null;
    campaigns: {
        title: string;
        type: string;
    } | null;
}

type PaymentFilterType =
    | 'ALL'
    | 'PENDING'
    | 'PAID'
    | 'PARTIAL_CANCELLED'
    | 'CANCELLED'
    | 'FAILED';

export default function PaymentManagementClient() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [refundRequests, setRefundRequests] = useState<RefundRequestPresenter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<PaymentFilterType>('ALL');
    const [approveTarget, setApproveTarget] = useState<RefundRequestPresenter | null>(null);
    const [rejectTarget, setRejectTarget] = useState<RefundRequestPresenter | null>(null);
    const [refundType, setRefundType] = useState<RefundType>('FULL');
    const [refundAmount, setRefundAmount] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [rejectNote, setRejectNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        void reloadData();
    }, []);

    const fetchPayments = async () => {
        const { data, error } = await supabase
            .from('payments')
            .select(`
                *,
                profiles:user_id (nickname, email, company_name),
                campaigns:campaign_id (title, type)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        setPayments((data || []) as Payment[]);
    };

    const fetchRefundRequests = async () => {
        const response = await fetch('/api/payments/refund-requests');
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || '환불 요청 목록을 불러오지 못했습니다.');
        }

        setRefundRequests(result.requests || []);
    };

    const reloadData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([fetchPayments(), fetchRefundRequests()]);
        } catch (error: any) {
            toast.error(error.message || '결제 목록을 불러오는 중 오류가 발생했습니다.');
            console.error('[PaymentManagement] Fetch Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const latestRefundRequestByPaymentId = useMemo(() => {
        return refundRequests.reduce<Record<string, RefundRequestPresenter>>((acc, request) => {
            const current = acc[request.payment_id];
            if (!current || new Date(current.requested_at).getTime() < new Date(request.requested_at).getTime()) {
                acc[request.payment_id] = request;
            }
            return acc;
        }, {});
    }, [refundRequests]);

    const filteredPayments = payments.filter((payment) => {
        const matchesSearch =
            payment.payment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.profiles?.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.profiles?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.campaigns?.title?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === 'ALL' ||
            String(payment.status || '').toUpperCase() === String(statusFilter).toUpperCase();

        return matchesSearch && matchesStatus;
    });

    const totalSales = payments
        .filter((payment) => ['PAID', 'PARTIAL_CANCELLED'].includes(String(payment.status || '').toUpperCase()))
        .reduce((sum, payment) => sum + payment.amount, 0);
    const cancelledCount = payments.filter((payment) =>
        ['CANCELLED', 'PARTIAL_CANCELLED'].includes(String(payment.status || '').toUpperCase())
    ).length;
    const todaySales = payments
        .filter((payment) =>
            ['PAID', 'PARTIAL_CANCELLED'].includes(String(payment.status || '').toUpperCase()) &&
            new Date(payment.created_at).toDateString() === new Date().toDateString()
        )
        .reduce((sum, payment) => sum + payment.amount, 0);

    const resetApproveState = () => {
        setApproveTarget(null);
        setRefundType('FULL');
        setRefundAmount('');
        setAdminNote('');
    };

    const resetRejectState = () => {
        setRejectTarget(null);
        setRejectNote('');
    };

    const handleApprove = async () => {
        if (!approveTarget) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/payments/refund-requests/${approveTarget.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refundType,
                    refundAmount: refundType === 'PARTIAL' ? Number(refundAmount) : undefined,
                    adminNote,
                }),
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || '환불 승인 처리에 실패했습니다.');
            }

            toast.success(refundType === 'PARTIAL' ? '부분 환불이 처리되었습니다.' : '전액 환불이 처리되었습니다.');
            resetApproveState();
            await reloadData();
        } catch (error: any) {
            toast.error(error.message || '환불 승인 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/payments/refund-requests/${rejectTarget.id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminNote: rejectNote,
                }),
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || '환불 요청 반려에 실패했습니다.');
            }

            toast.success('환불 요청을 반려했습니다.');
            resetRejectState();
            await reloadData();
        } catch (error: any) {
            toast.error(error.message || '환불 요청 반려 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 max-w-7xl mx-auto space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <CreditCard className="text-blue-500" size={24} />
                        결제 및 매출 관리
                    </h1>
                    <p className="text-slate-500 font-medium mt-0.5 text-xs">결제 내역, 환불 요청, 취소 처리 상태를 함께 관리합니다.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => void reloadData()}
                        className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                    >
                        <RefreshCcw size={20} className={cn(isLoading && 'animate-spin')} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">누적 총 매출</p>
                        <h3 className="text-lg font-black text-slate-900 mt-0.5">{totalSales.toLocaleString()}<span className="text-[10px] font-bold ml-1 text-slate-400">원</span></h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                        <ArrowUpRight size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">금일 결제액</p>
                        <h3 className="text-lg font-black text-slate-900 mt-0.5">{todaySales.toLocaleString()}<span className="text-[10px] font-bold ml-1 text-slate-400">원</span></h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                        <ArrowDownRight size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">취소 건수</p>
                        <h3 className="text-lg font-black text-slate-900 mt-0.5">{cancelledCount}<span className="text-[10px] font-bold ml-1 text-slate-400">건</span></h3>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="결제 ID, 브랜드명, 캠페인명 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50/50 border-2 border-slate-50 rounded-xl py-2.5 pl-11 pr-4 font-bold text-slate-900 outline-none focus:border-blue-200 transition-all placeholder:text-slate-300 text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-2xl border-2 border-slate-50 w-full md:w-auto flex-wrap">
                    {(['ALL', 'PENDING', 'PAID', 'PARTIAL_CANCELLED', 'CANCELLED', 'FAILED'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={cn(
                                'px-4 py-2 rounded-xl text-xs font-black transition-all flex-1 md:flex-none',
                                statusFilter === filter ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            {filter === 'ALL'
                                ? '전체'
                                : PAYMENT_STATUS_LABELS[filter] || filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px]">
                                <th className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest text-center w-32">결제일시</th>
                                <th className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest">광고주 / 브랜드</th>
                                <th className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest">캠페인 정보</th>
                                <th className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest text-right">결제금액</th>
                                <th className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest text-center">상태</th>
                                <th className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest text-center">환불 요청</th>
                                <th className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-8 bg-slate-50/10 h-20"></td>
                                    </tr>
                                ))
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-slate-300 font-bold italic">
                                        결제 내역이 존재하지 않습니다.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => {
                                    const refundRequest = latestRefundRequestByPaymentId[payment.payment_id];

                                    return (
                                        <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-3 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[11px] font-black text-slate-700">
                                                        {format(new Date(payment.created_at), 'yyyy.MM.dd')}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                                        <Clock size={9} />
                                                        {format(new Date(payment.created_at), 'HH:mm')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900">
                                                        {payment.profiles?.company_name || payment.profiles?.nickname || '정보 없음'}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 italic">
                                                        {payment.profiles?.email || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-black text-slate-700 line-clamp-1">
                                                        {payment.campaigns?.title || '시스템/직접 결제'}
                                                    </span>
                                                    <div className="flex gap-1 mt-0.5">
                                                        <span className="text-[8px] px-1 py-0.5 bg-slate-100 text-slate-500 rounded font-black border border-slate-200 uppercase tracking-tighter">
                                                            {payment.method}
                                                        </span>
                                                        <span className="text-[8px] text-slate-300 font-bold truncate max-w-[100px]">
                                                            #{payment.payment_id}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="text-sm font-black text-slate-900 tracking-tighter">
                                                    {payment.amount.toLocaleString()}
                                                    <span className="text-[9px] ml-0.5 text-slate-400">원</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <div className="flex justify-center">
                                                    <StatusBadgeCell
                                                        status={payment.status}
                                                        customLabels={PAYMENT_STATUS_LABELS}
                                                        customVariants={PAYMENT_STATUS_VARIANTS}
                                                        className="text-[11px] font-bold"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    {refundRequest ? (
                                                        <>
                                                            <StatusBadgeCell
                                                                status={refundRequest.status}
                                                                customLabels={REFUND_REQUEST_STATUS_LABELS}
                                                                customVariants={REFUND_REQUEST_STATUS_VARIANTS}
                                                                className="text-[11px] font-bold"
                                                            />
                                                            <span className="max-w-[180px] text-[9px] leading-relaxed font-bold text-slate-400 line-clamp-2">
                                                                {refundRequest.request_reason}
                                                            </span>
                                                            {refundRequest.refund_amount != null && (
                                                                <span className="text-[9px] font-black text-slate-500">
                                                                    환불액 {refundRequest.refund_amount.toLocaleString()}원
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-300">요청 없음</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                                    {payment.receipt_url ? (
                                                        <a
                                                            href={payment.receipt_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 text-slate-400 hover:text-blue-500 bg-slate-50 rounded-lg transition-all"
                                                            title="영수증 보기"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    ) : (
                                                        <div className="w-8 h-8" />
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            toast.info(
                                                                [
                                                                    `결제 ID: ${payment.payment_id}`,
                                                                    `주문 ID: ${payment.merchant_uid || 'N/A'}`,
                                                                    refundRequest ? `환불 요청: ${refundRequest.request_reason}` : '환불 요청 없음',
                                                                    refundRequest?.admin_note ? `관리자 메모: ${refundRequest.admin_note}` : '',
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join('\n')
                                                            );
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-lg transition-all"
                                                        title="세부 정보"
                                                    >
                                                        <Filter size={14} />
                                                    </button>
                                                    {refundRequest?.status === 'REQUESTED' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setApproveTarget(refundRequest);
                                                                    setRefundType('FULL');
                                                                    setRefundAmount('');
                                                                    setAdminNote('');
                                                                }}
                                                                className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 transition-all hover:bg-emerald-100"
                                                            >
                                                                <CheckCircle2 size={12} />
                                                                승인
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setRejectTarget(refundRequest);
                                                                    setRejectNote('');
                                                                }}
                                                                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-black text-rose-700 transition-all hover:bg-rose-100"
                                                            >
                                                                <XCircle size={12} />
                                                                반려
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={!!approveTarget} onOpenChange={(open) => !open && resetApproveState()}>
                <DialogContent className="max-w-xl rounded-3xl border-none bg-white p-0 shadow-2xl">
                    <DialogHeader className="border-b border-slate-100 px-6 py-5">
                        <DialogTitle className="text-xl font-black text-slate-900">환불 승인 처리</DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            요청 사유를 확인한 뒤 전액 또는 부분 환불을 실행합니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 px-6 py-5">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                            <p className="font-black text-slate-900 mb-1">요청 사유</p>
                            <p>{approveTarget?.request_reason || '-'}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-900">환불 유형</label>
                            <Select value={refundType} onValueChange={(value) => setRefundType(value as RefundType)}>
                                <SelectTrigger className="rounded-2xl border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FULL">전액 환불</SelectItem>
                                    <SelectItem value="PARTIAL">부분 환불</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {refundType === 'PARTIAL' && (
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-900">부분 환불 금액</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={refundAmount}
                                    onChange={(event) => setRefundAmount(event.target.value)}
                                    placeholder="환불 금액을 입력하세요."
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-300"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-900">관리자 메모</label>
                            <Textarea
                                value={adminNote}
                                onChange={(event) => setAdminNote(event.target.value)}
                                placeholder="내부 메모를 남길 수 있습니다."
                                className="min-h-[120px] rounded-2xl border-slate-200"
                            />
                        </div>
                    </div>
                    <DialogFooter className="border-t border-slate-100 px-6 py-5">
                        <button
                            type="button"
                            onClick={resetApproveState}
                            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition-all hover:bg-slate-50"
                            disabled={isSubmitting}
                        >
                            닫기
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleApprove()}
                            disabled={isSubmitting || (refundType === 'PARTIAL' && !refundAmount)}
                            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {isSubmitting ? '처리 중...' : '환불 승인 실행'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && resetRejectState()}>
                <DialogContent className="max-w-lg rounded-3xl border-none bg-white p-0 shadow-2xl">
                    <DialogHeader className="border-b border-slate-100 px-6 py-5">
                        <DialogTitle className="text-xl font-black text-slate-900">환불 요청 반려</DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            반려 사유를 남기면 광고주가 요청 상태를 확인할 수 있습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 px-6 py-5">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                            <p className="font-black text-slate-900 mb-1">요청 사유</p>
                            <p>{rejectTarget?.request_reason || '-'}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-900">반려 메모</label>
                            <Textarea
                                value={rejectNote}
                                onChange={(event) => setRejectNote(event.target.value)}
                                placeholder="반려 사유를 입력해 주세요."
                                className="min-h-[140px] rounded-2xl border-slate-200"
                            />
                        </div>
                    </div>
                    <DialogFooter className="border-t border-slate-100 px-6 py-5">
                        <button
                            type="button"
                            onClick={resetRejectState}
                            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition-all hover:bg-slate-50"
                            disabled={isSubmitting}
                        >
                            닫기
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleReject()}
                            disabled={isSubmitting || !rejectNote.trim()}
                            className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white transition-all hover:bg-rose-700 disabled:opacity-60"
                        >
                            {isSubmitting ? '처리 중...' : '반려 확정'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
