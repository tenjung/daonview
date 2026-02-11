'use client';

import React from 'react';
import { CheckCircle2, LayoutDashboard, Home, ArrowRight, ShieldCheck, Clock, Megaphone, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CampaignSuccessProps {
    campaignTitle: string;
    brandName: string;
    totalAmount: number;
    paymentMethod?: 'card' | 'transfer' | 'free' | null;
    isAdmin?: boolean;
}

export default function CampaignSuccess({
    campaignTitle,
    brandName,
    totalAmount,
    paymentMethod = 'card',
    isAdmin = false,
}: CampaignSuccessProps) {
    const router = useRouter();
    const isTransfer = paymentMethod === 'transfer';

    const timelineSteps = isTransfer ? [
        {
            icon: <Clock className="text-amber-500" size={20} />,
            title: "입금 대기",
            desc: "안내된 계좌로 입금해 주시면 확인 절차가 진행됩니다.",
            status: "active"
        },
        {
            icon: <ShieldCheck className="text-gray-400" size={20} />,
            title: "검토 및 승인",
            desc: "입금 확인 후 캠페인 내용을 검토하여 승인합니다.",
            status: "pending"
        },
        {
            icon: <Megaphone className="text-gray-400" size={20} />,
            title: "모집 시작",
            desc: "승인 완료 후 캠페인이 게시됩니다.",
            status: "pending"
        }
    ] : [
        {
            icon: <Clock className="text-amber-500" size={20} />,
            title: "검토 중",
            desc: "24시간 이내에 캠페인 내용을 검토합니다.",
            status: "active"
        },
        {
            icon: <ShieldCheck className="text-gray-400" size={20} />,
            title: "승인 완료",
            desc: "검토 결과에 따라 승인 시 결제가 최종 확정됩니다.",
            status: "pending"
        },
        {
            icon: <Megaphone className="text-gray-400" size={20} />,
            title: "모집 시작",
            desc: "게시판에 노출되어 리뷰어 모집이 시작됩니다.",
            status: "pending"
        }
    ];

    return (
        <div className="w-full max-w-2xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 메인 카드 */}
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-100/50 border border-gray-100 overflow-hidden">
                {/* 상단 섹션: 성공 메시지 */}
                <div className="bg-gradient-to-b from-blue-50/50 to-white p-10 text-center border-b border-gray-50">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce-[duration:2s]">
                        <CheckCircle2 className="text-green-600" size={44} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                        {isTransfer ? '접수 완료 (입금 대기)' : '캠페인 등록 완료!'}
                    </h1>
                    <p className="text-gray-600 text-lg font-medium">
                        {isTransfer 
                            ? '계좌이체 확인 후 캠페인이 최종 등록됩니다.' 
                            : '새로운 캠페인이 성공적으로 접수되었습니다.'}
                    </p>
                </div>

                {/* 계좌 정보 및 캠페인 요약 (계좌이체 전용 - 프리미엄 영수증 스타일) */}
                {isTransfer && (
                    <div className="px-8 pt-8">
                        <div className="relative group">
                            {/* 영수증 상단 장식 */}
                            <div className="absolute -top-2 left-0 right-0 h-4 flex justify-around px-4">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className="w-2 h-4 bg-white rounded-full -mt-2 border-b-2 border-amber-100 shadow-sm" />
                                ))}
                            </div>
                            
                            <div className="bg-amber-50/70 border-x-2 border-amber-100 rounded-b-3xl p-8 shadow-inner overflow-hidden">
                                {/* 배경 장식 */}
                                <div className="absolute -right-8 -bottom-8 opacity-[0.03] rotate-12 pointer-events-none">
                                    <Building2 size={240} />
                                </div>

                                <div className="relative z-10">
                                    {/* 섹션 타이틀 */}
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-amber-200/50 border-dashed">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                            <span className="text-sm font-black text-amber-900 tracking-wider">입금 확인증 (DRAFT)</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-amber-500 bg-white px-2 py-0.5 rounded-full border border-amber-100 shadow-sm">
                                            {new Date().toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* 캠페인 요약 정보 */}
                                    <div className="space-y-2 mb-8">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-amber-700/60 uppercase">Campaign</span>
                                            <span className="text-sm font-black text-gray-900 text-right max-w-[200px] leading-tight">
                                                {campaignTitle}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-amber-700/60 uppercase">Brand</span>
                                            <span className="text-sm font-bold text-gray-700">{brandName}</span>
                                        </div>
                                    </div>

                                    {/* 중앙: 입금 금액 */}
                                    <div className="py-6 mb-8 text-center bg-white rounded-2xl border border-amber-100 shadow-sm">
                                        <p className="text-xs font-bold text-amber-600 mb-1">총 입금하실 금액</p>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
                                            {totalAmount.toLocaleString()}<span className="text-xl ml-0.5">원</span>
                                        </h2>
                                    </div>

                                    {/* 하단: 계좌 정보 */}
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 bg-[#FEE500] text-[#3C1E1E] rounded font-black text-[10px] shadow-sm">카카오뱅크</span>
                                                <span className="text-lg font-black text-gray-900 tracking-tight">3333-36-4120453</span>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText('3333-36-4120453');
                                                        alert('계좌번호가 복사되었습니다.');
                                                    }}
                                                    className="ml-auto text-[10px] font-black text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded transition-colors"
                                                >
                                                    복사
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center px-1">
                                                <p className="text-sm text-gray-600 font-bold">
                                                    예금주: <span className="text-blue-600">신지호(다온컴퍼니)</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-amber-100/50 p-3 rounded-xl border border-amber-200/50">
                                            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                                * 입금자명은 브랜드명 혹은 성함으로 부탁드립니다.<br/>
                                                * 입금 확인 후 캠페인 검토가 시작됩니다.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* 영수증 하단 톱니 */}
                            <div className="h-2 flex justify-around px-1 mt-[-1px]">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className="border-t-[8px] border-t-amber-50/70 border-x-[8px] border-x-transparent" />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 중단 섹션: 요약 */}
                <div className="p-8 space-y-8">
                    {!isTransfer && (
                        <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">캠페인명</span>
                                <span className="text-gray-900 font-bold">{campaignTitle}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">브랜드</span>
                                <span className="text-gray-900 font-bold">{brandName}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-200">
                                <span className="text-gray-700 font-bold text-base">총 결제 금액</span>
                                <span className="text-blue-600 font-black text-xl">
                                    {totalAmount.toLocaleString()}원
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 타임라인 섹션 */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest text-center">
                            향후 진행 단계
                        </h3>
                        <div className="relative">
                            {/* 수직선 */}
                            <div className="absolute left-[26px] top-2 bottom-2 w-0.5 bg-gray-100" />
                            
                            <div className="space-y-8 relative">
                                {timelineSteps.map((step, index) => (
                                    <div key={index} className="flex gap-5 items-start">
                                        <div className={`
                                            relative z-10 w-[52px] h-[52px] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
                                            ${step.status === 'active' ? 'bg-white border-2 border-amber-200 ring-4 ring-amber-50' : 'bg-gray-50 border border-gray-100'}
                                        `}>
                                            {step.icon}
                                        </div>
                                        <div className="pt-1">
                                            <h4 className={`font-bold text-base ${step.status === 'active' ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {step.title}
                                            </h4>
                                            <p className={`text-sm mt-0.5 leading-relaxed ${step.status === 'active' ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단 섹션: 액션 버튼 */}
                <div className="p-8 bg-gray-50/50 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => router.push(isAdmin ? '/dashboard/admin/campaigns' : '/dashboard/advertiser')}
                        className="flex-1 bg-slate-900 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all hover:shadow-lg active:scale-95"
                    >
                        <LayoutDashboard size={20} />
                        내 캠페인 관리
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="flex-1 bg-white text-slate-600 h-14 rounded-2xl font-bold border-2 border-slate-200 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <Home size={20} />
                        홈으로 이동
                    </button>
                </div>
            </div>

            {/* 하단 푸터 안내 */}
            <div className="mt-8 text-center text-gray-400 text-sm font-medium">
                결제 및 등록 관련 문의는 고객센터를 이용해 주세요.
            </div>
        </div>
    );
}
