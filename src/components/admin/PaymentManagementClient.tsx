'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
    CreditCard, 
    Search, 
    Calendar, 
    Clock,
    RefreshCcw,
    ExternalLink,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { StatusBadgeCell } from '@/components/data-table/cells/StatusBadgeCell';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_VARIANTS } from '@/constants/status';

interface Payment {
    id: string;
    user_id: string;
    campaign_id: number | null;
    payment_id: string;
    merchant_uid: string | null;
    amount: number;
    method: string;
    status: 'PAID' | 'CANCELLED' | 'FAILED';
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

export default function PaymentManagementClient() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'CANCELLED' | 'FAILED'>('ALL');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    profiles:user_id (nickname, email, company_name),
                    campaigns:campaign_id (title, type)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayments(data || []);
        } catch (error: any) {
            toast.error('결제 목록을 불러오는 중 오류가 발생했습니다.');
            console.error('[PaymentManagement] Fetch Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPayments = payments.filter(payment => {
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

    // Summary Statistics
    const totalSales = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
    const cancelledCount = payments.filter(p => p.status === 'CANCELLED').length;
    const todaySales = payments
        .filter(p => p.status === 'PAID' && new Date(p.created_at).toDateString() === new Date().toDateString())
        .reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="p-4 max-w-7xl mx-auto space-y-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <CreditCard className="text-blue-500" size={24} />
                        결제 및 매출 관리
                    </h1>
                    <p className="text-slate-500 font-medium mt-0.5 text-xs">캠페인 등록 시 발생한 모든 결제 내역과 정산 현황을 관리합니다.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={fetchPayments}
                        className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                    >
                        <RefreshCcw size={20} className={cn(isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
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

            {/* Search & Filter */}
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
                <div className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-2xl border-2 border-slate-50 w-full md:w-auto">
                    {(['ALL', 'PAID', 'CANCELLED', 'FAILED'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-black transition-all flex-1 md:flex-none",
                                statusFilter === filter 
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {filter === 'ALL' ? '전체' : 
                             filter === 'PAID' ? '결제완료' : 
                             filter === 'CANCELLED' ? '취소됨' : '실패'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Payments Table */}
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
                                <th className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8 bg-slate-50/10 h-20"></td>
                                    </tr>
                                ))
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-300 font-bold italic">
                                        결제 내역이 존재하지 않습니다.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
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
                                                    <span className="text-[8px] px-1 py-0.2 bg-slate-100 text-slate-500 rounded font-black border border-slate-200 uppercase tracking-tighter">
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
                                            <div className="flex items-center justify-center gap-2">
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
                                                        toast.info(`결제 ID: ${payment.payment_id}\n주문 ID: ${payment.merchant_uid || 'N/A'}`);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-lg transition-all"
                                                    title="세부 정보"
                                                >
                                                    <Filter size={14} />
                                                </button>
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
    );
}
