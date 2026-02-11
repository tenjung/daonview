'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
    Ticket, 
    Plus, 
    Search, 
    Calendar, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Copy, 
    RefreshCcw,
    Trash2,
    Check
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Coupon {
    id: string;
    code: string;
    benefits: {
        visit_free?: number;
        delivery_free?: number;
        purchase_free?: number;
        is_vip?: boolean;
    };
    status: 'AVAILABLE' | 'USED' | 'EXPIRED';
    expires_at: string;
    used_at: string | null;
    used_by: string | null;
    created_at: string;
    profiles?: {
        nickname: string;
        email: string;
    };
}

export default function CouponManagementClient() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Create Coupon State
    const [newCoupon, setNewCoupon] = useState({
        visit_free: 0,
        delivery_free: 0,
        purchase_free: 0,
        is_vip: false,
        count: 1
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select(`
                    *,
                    profiles:used_by (nickname, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (error: any) {
            toast.error('쿠폰 목록을 불러오는 중 오류가 발생했습니다.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'DAON-';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            if (i < 3) result += '-';
        }
        return result;
    };

    const handleCreateCoupons = async () => {
        try {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const couponsToInsert = Array.from({ length: newCoupon.count }).map(() => ({
                code: generateCode(),
                benefits: {
                    visit_free: newCoupon.visit_free,
                    delivery_free: newCoupon.delivery_free,
                    purchase_free: newCoupon.purchase_free,
                    is_vip: newCoupon.is_vip
                },
                status: 'AVAILABLE',
                expires_at: expiresAt.toISOString()
            }));

            const { error } = await supabase.from('coupons').insert(couponsToInsert);
            if (error) throw error;

            toast.success(`${newCoupon.count}개의 쿠폰이 발행되었습니다.`);
            setShowCreateModal(false);
            fetchCoupons();
            setNewCoupon({
                visit_free: 0,
                delivery_free: 0,
                purchase_free: 0,
                is_vip: false,
                count: 1
            });
        } catch (error: any) {
            toast.error('쿠폰 발행 중 오류가 발생했습니다.');
            console.error(error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('쿠폰 코드가 복사되었습니다.');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold">사용 가능</span>;
            case 'USED':
                return <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-[11px] font-bold">사용 완료</span>;
            case 'EXPIRED':
                return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-[11px] font-bold">만료됨</span>;
            default:
                return null;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Ticket className="text-rose-500" size={32} />
                        쿠폰 및 프로모션 관리
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">제휴 체험단 및 프로모션을 위한 쿠폰 발행 및 대국민 관리 시스템</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    <Plus size={20} />
                    쿠폰 신규 발행
                </button>
            </div>

            {/* Coupons Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <h2 className="font-black text-slate-800">쿠폰 목록 <span className="text-rose-500 ml-1">{coupons.length}</span></h2>
                    <button 
                        onClick={fetchCoupons}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <RefreshCcw size={18} />
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-50">
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">상태</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">쿠폰 코드</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">혜택 구성</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">유효기간</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">사용 정보</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4 bg-slate-50/20 h-16"></td>
                                    </tr>
                                ))
                            ) : coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold">발행된 쿠폰이 없습니다.</td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5 text-center">
                                            {getStatusBadge(coupon.status)}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <code className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-black text-[13px] tracking-tight border border-slate-200">
                                                    {coupon.code}
                                                </code>
                                                <button 
                                                    onClick={() => copyToClipboard(coupon.code)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {coupon.benefits.is_vip ? (
                                                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-black border border-amber-200">VIP 평생무료</span>
                                                ) : (
                                                    <>
                                                        {coupon.benefits.visit_free ? <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-black border border-blue-100">방문 {coupon.benefits.visit_free}회</span> : null}
                                                        {coupon.benefits.delivery_free ? <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-black border border-indigo-100">배송 {coupon.benefits.delivery_free}회</span> : null}
                                                        {coupon.benefits.purchase_free ? <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md text-[10px] font-black border border-violet-100">구매평 {coupon.benefits.purchase_free}건</span> : null}
                                                        {!coupon.benefits.visit_free && !coupon.benefits.delivery_free && !coupon.benefits.purchase_free && <span className="text-slate-300 text-[10px] font-bold">혜택 없음</span>}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[12px] font-black text-slate-600">
                                                    {format(new Date(coupon.expires_at), 'yyyy.MM.dd')}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    ~ {format(new Date(coupon.expires_at), 'HH:mm')} 까지
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {coupon.status === 'USED' ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[12px] font-black text-rose-600">{coupon.profiles?.nickname || '익명회원'}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 italic">
                                                        {format(new Date(coupon.used_at!), 'MM/dd HH:mm')} 사용
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-[11px] font-bold">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    ></div>
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-slate-900">쿠폰 신규 발행</h2>
                                <p className="text-slate-500 font-bold mt-1">혜택과 수량을 설정해 주세요</p>
                            </div>

                            <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                {/* 혜택 선택 */}
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">혜택 항목 설정</label>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        {/* 방문형 */}
                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                            <span className="font-black text-slate-700">방문형 체험단 프리임</span>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setNewCoupon(p => ({ ...p, visit_free: Math.max(0, p.visit_free - 1) }))} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold">-</button>
                                                <span className="w-6 text-center font-black">{newCoupon.visit_free}</span>
                                                <button onClick={() => setNewCoupon(p => ({ ...p, visit_free: p.visit_free + 1 }))} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold">+</button>
                                            </div>
                                        </div>

                                        {/* 배송형 */}
                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                            <span className="font-black text-slate-700">배송형 체험단 프리</span>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setNewCoupon(p => ({ ...p, delivery_free: Math.max(0, p.delivery_free - 1) }))} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold">-</button>
                                                <span className="w-6 text-center font-black">{newCoupon.delivery_free}</span>
                                                <button onClick={() => setNewCoupon(p => ({ ...p, delivery_free: p.delivery_free + 1 }))} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold">+</button>
                                            </div>
                                        </div>

                                        {/* VIP 토글 */}
                                        <button 
                                            onClick={() => setNewCoupon(p => ({ ...p, is_vip: !p.is_vip }))}
                                            className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${newCoupon.is_vip ? 'border-amber-500 bg-amber-50' : 'border-slate-100 bg-white'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${newCoupon.is_vip ? 'bg-amber-500' : 'bg-slate-200'}`}>
                                                    {newCoupon.is_vip && <Check size={12} className="text-white" />}
                                                </div>
                                                <span className={`font-black ${newCoupon.is_vip ? 'text-amber-900' : 'text-slate-700'}`}>VIP 평생 무료 혜택</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* 발행 수량 */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">발행 수량</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        max="100"
                                        value={newCoupon.count}
                                        onChange={(e) => setNewCoupon(p => ({ ...p, count: parseInt(e.target.value) || 1 }))}
                                        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-black focus:border-rose-500 transition-all outline-none"
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold px-1">* 코드 7일 유효기간 자동 설정 (발행 후 재사용 불가)</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    취소
                                </button>
                                <button 
                                    onClick={handleCreateCoupons}
                                    className="flex-2 bg-rose-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/30 active:scale-95"
                                >
                                    지금 발행하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
