'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';
import { ADVERTISER_LINKS } from '@/constants/navigation';
import { useAuthStore } from '@/store/authStore';
import {
    Check,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    CreditCard,
    ShoppingBag,
    Newspaper,
    Share2,
    Infinity,
    Zap,
    Star,
    RotateCcw,
    AlertCircle,
    CalendarClock,
    PauseCircle,
    PlayCircle,
    XCircle,
    ArrowRight,
} from 'lucide-react';

// 무제한 이용권 구독 기간 옵션
const UNLIMITED_PLANS = [
    { period: '1개월', pricePerMonth: 250000, total: 250000, discount: null, highlight: false },
    { period: '3개월', pricePerMonth: 219000, total: 657000, discount: 13, highlight: false },
    { period: '6개월', pricePerMonth: 179000, total: 1074000, discount: 29, highlight: false },
    { period: '12개월', pricePerMonth: 139000, total: 1668000, discount: 45, highlight: true },
];

const FAQS = [
    {
        q: '캠페인 등록 1건당 과금이 되는 건가요?',
        a: '단일 체험단과 1석 2조 체험단은 캠페인 등록 건당 5,000원 / 9,000원이 부과됩니다. 무제한 이용권 구독 시에는 건당 과금 없이 자유롭게 등록하실 수 있습니다.',
    },
    {
        q: '1석 2조 체험단은 어떤 서비스인가요?',
        a: '쇼핑몰 리뷰와 SNS 리뷰(블로그·인스타피드·인스타릴스·네이버클립·스레드 중 택1)를 한 번에 진행하는 패키지입니다. 단일 건당보다 10% 저렴하게 두 채널을 동시에 활용할 수 있습니다.',
    },
    {
        q: '무제한 이용권 구독 중 해지하면 어떻게 되나요?',
        a: '구독 기간 내 해지 시 남은 기간에 대해 일할 계산 환불이 가능합니다. 단, 이미 사용된 캠페인 건수에 대한 환불은 불가합니다.',
    },
    {
        q: '무제한 이용권으로 등록할 수 있는 캠페인 수에 제한이 있나요?',
        a: '단일 체험단과 1석 2조 체험단 모두 무제한으로 등록 및 모집하실 수 있습니다. 단, 동시에 진행 가능한 캠페인은 최대 30개입니다.',
    },
    {
        q: '결제는 어떤 방식으로 이루어지나요?',
        a: '신용카드, 체크카드를 통해 결제하실 수 있습니다. 정기구독(무제한 이용권)의 경우 선결제 방식으로 진행됩니다. 세금계산서 발행이 필요하신 경우 1:1 문의로 요청해 주세요.',
    },
];

export default function BillingPage() {
    const { profile } = useAuthStore();
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [selectedUnlimited, setSelectedUnlimited] = useState<number | null>(null);

    const displayName = profile?.company_name || profile?.nickname || '광고주';
    const isVerified = profile?.biz_verification_status === 'APPROVED';

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="ADVERTISER"
                userName={displayName}
                links={ADVERTISER_LINKS.map(link => ({
                    ...link,
                    active: link.href === '/dashboard/advertiser/billing',
                }))}
            />

            <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                <div className="max-w-[1200px] mx-auto">

                    {/* 사업자 미인증 시 잠금 화면 */}
                    {!isVerified && (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-6">
                                <CreditCard className="w-9 h-9 text-gray-300" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-3">사업자 인증이 필요합니다</h2>
                            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm">
                                이용요금 안내는 <strong className="text-gray-700">사업자 인증이 완료된 광고주</strong>에게만 제공됩니다.<br />
                                먼저 사업자 인증을 완료해 주세요.
                            </p>
                            <Link
                                href="/dashboard/advertiser/verification"
                                className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm"
                            >
                                사업자 인증 하러 가기
                                <ArrowRight size={16} />
                            </Link>
                            {profile?.biz_verification_status === 'PENDING' && (
                                <p className="mt-4 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl font-medium">
                                    ⏳ 현재 심사가 진행 중입니다. 승인 완료 후 이용 가능합니다.
                                </p>
                            )}
                        </div>
                    )}

                    {/* 인증 완료 시 콘텐츠 */}
                    {isVerified && (<>

                    {/* Header */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">이용요금 안내</h1>
                        </div>
                        <p className="text-gray-500 mt-1 ml-[52px]">
                            필요한 채널과 규모에 맞는 상품을 선택하세요.
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">

                        {/* ── 1. 단일 체험단 ── */}
                        <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 flex flex-col h-full shadow-sm hover:shadow-xl transition-all">
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <ShoppingBag className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900">단일 체험단</h2>
                                </div>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    부담 없는 비용으로, 꼭 필요한 채널의 리뷰부터 빠르게 채우세요.
                                </p>
                            </div>

                            {/* Price */}
                            <div className="mb-8 py-6 border-y border-gray-100">
                                <div className="flex items-end gap-1">
                                    <span className="text-4xl font-black text-gray-900">5,000</span>
                                    <span className="text-xl font-black text-gray-900">원</span>
                                    <span className="text-gray-400 text-sm font-medium ml-1 mb-0.5">/ 건당</span>
                                </div>
                            </div>

                            {/* CTA */}
                            <Link
                                href="/contact"
                                className="w-full py-3 rounded-2xl font-bold text-center text-sm transition-all mb-8 block bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                문의하기
                            </Link>

                            {/* Features */}
                            <ul className="flex flex-col gap-5 flex-1">
                                <li className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">쇼핑몰 리뷰</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <Newspaper className="w-3.5 h-3.5 text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">원고료형 기자단</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <Share2 className="w-3.5 h-3.5 text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">SNS 리뷰</p>
                                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">블로그 · 인스타피드 · 인스타릴스 · 네이버클립 · 스레드</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* ── 2. 1석 2조 체험단 (추천) ── */}
                        <div className="relative bg-white rounded-3xl border-2 border-primary p-8 flex flex-col h-full shadow-xl shadow-primary/10 scale-[1.02]">
                            {/* Tag */}
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black tracking-wide bg-primary text-white">
                                추천
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-primary" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900">1석 2조 체험단</h2>
                                </div>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    쇼핑몰 + SNS 리뷰를 한 번에,<br />
                                    할인된 가격으로 해결하세요.
                                </p>
                            </div>

                            {/* Price */}
                            <div className="mb-8 py-6 border-y border-gray-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-black rounded-lg">10% 할인</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="text-4xl font-black text-gray-900">9,000</span>
                                    <span className="text-xl font-black text-gray-900">원</span>
                                    <span className="text-gray-400 text-sm font-medium ml-1 mb-0.5">/ 건당</span>
                                </div>
                            </div>

                            {/* CTA */}
                            <Link
                                href="/contact"
                                className="w-full py-3 rounded-2xl font-bold text-center text-sm transition-all mb-8 block bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                            >
                                문의하기
                            </Link>

                            {/* Features */}
                            <ul className="flex flex-col gap-5 flex-1">
                                <li className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">쇼핑몰 리뷰</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <Share2 className="w-3.5 h-3.5 text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">SNS 리뷰 <span className="text-gray-400 font-normal text-xs">택1</span></p>
                                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">블로그 · 인스타피드 · 인스타릴스 · 네이버클립 · 스레드</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* ── 3. 무제한 이용권 (인기) ── */}
                        <div className="relative bg-white rounded-3xl border-2 border-gray-200 p-8 flex flex-col h-full shadow-sm hover:shadow-xl transition-all">
                            {/* Tag */}
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black tracking-wide bg-gray-900 text-white">
                                인기
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                                        <Infinity className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900">무제한 이용권</h2>
                                </div>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    리뷰가 많이 필요한 광고주라면,<br />
                                    다온뷰의 모든 체험단을 제한 없이 이용해 보세요.
                                </p>
                            </div>

                            {/* Period Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-8">
                                {UNLIMITED_PLANS.map((plan, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedUnlimited(selectedUnlimited === i ? null : i)}
                                        className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                                            selectedUnlimited === i
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                        }`}
                                    >
                                        {plan.highlight && (
                                            <span className="absolute -top-2 right-2 text-[9px] font-black px-1.5 py-0.5 bg-primary text-white rounded-full">BEST</span>
                                        )}
                                        <p className="text-[10px] font-bold text-gray-400 mb-1">{plan.period}</p>
                                        <p className={`text-xl font-black ${plan.highlight ? 'text-primary' : 'text-gray-900'}`}>
                                            {plan.pricePerMonth.toLocaleString()}
                                            <span className="text-xs font-bold text-gray-400 ml-0.5">원/월</span>
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">총 {plan.total.toLocaleString()}원</p>
                                        {plan.discount && (
                                            <span className="inline-block mt-1 text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                                                {plan.discount}% 할인
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* CTA */}
                            <Link
                                href="/contact"
                                className="w-full py-3 rounded-2xl font-bold text-center text-sm transition-all mb-8 block bg-gray-900 text-white hover:bg-black"
                            >
                                구독 문의하기
                            </Link>

                            {/* Included */}
                            <ul className="flex flex-col gap-3">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-primary shrink-0" />
                                    <span className="text-sm text-gray-700">단일 체험단 이용 <strong className="text-primary">무제한</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-primary shrink-0" />
                                    <span className="text-sm text-gray-700">1석 2조 체험단 이용 <strong className="text-primary">무제한</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-primary shrink-0" />
                                    <span className="text-sm text-gray-700">동시 진행 최대 30개</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span className="text-sm text-gray-700">우선 노출 혜택 제공</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="mb-12">
                        <h2 className="text-xl font-black text-gray-900 mb-6">자주 묻는 질문</h2>
                        <div className="flex flex-col gap-3">
                            {FAQS.map((faq, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <button
                                        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    >
                                        <span className="font-bold text-gray-800 text-sm pr-4">{faq.q}</span>
                                        {openFaq === i
                                            ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                                            : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                        }
                                    </button>
                                    {openFaq === i && (
                                        <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 환불규정 */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                                <RotateCcw className="w-4 h-4 text-amber-600" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">환불 규정</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* 단일 / 1석2조 */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShoppingBag className="w-4 h-4 text-blue-500 shrink-0" />
                                    <p className="font-black text-gray-800 text-sm">단일 체험단 &amp; 1석 2조 체험단</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        마음에 드는 인플루언서가 없어 선정을 안 하시거나,
                                        모집 인원이 미달된 수량에 대해 <strong className="text-gray-900">100% 환불</strong>이 가능합니다.
                                    </p>
                                </div>
                            </div>

                            {/* 무제한 이용권 */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Infinity className="w-4 h-4 text-purple-500 shrink-0" />
                                    <p className="font-black text-gray-800 text-sm">무제한 이용권</p>
                                </div>
                                <ul className="flex flex-col gap-2.5">
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            진행 수량이 전혀 없는 경우 <strong className="text-gray-900">100% 환불</strong> 가능합니다.
                                        </p>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            진행 수량이 있는 경우, <strong className="text-gray-900">1개월권 정가 기준</strong>으로
                                            사용한 일수를 일할 계산하여 차감 후 나머지 금액을 환불합니다.
                                        </p>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            정가 기준 사용 금액이 결제 금액 이상이면 환불 금액이 없을 수 있습니다.
                                        </p>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* 환불 예시 박스 */}
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-5">
                            <p className="text-xs font-black text-amber-700 uppercase tracking-wide mb-2">💡 환불 예시</p>
                            <p className="text-sm text-amber-800 leading-relaxed">
                                3개월권 구매 후 <strong>1개월 5일</strong> 사용 시 →
                                1개월권 정가(250,000원) + 5일 일할 계산(41,700원) = <strong>291,700원</strong> 차감 후 나머지 환불<br />
                                <span className="text-xs text-amber-600 mt-1 block">※ 3개월권 구매 후 2개월 18일 이상 사용한 경우 환불 가능 금액이 없을 수 있습니다.</span>
                            </p>
                        </div>
                    </div>

                    {/* 무제한 이용권 적용 규정 */}
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                                <CalendarClock className="w-4 h-4 text-purple-600" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">무제한 이용권 적용 규정</h2>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                            <div className="flex items-start gap-4 px-6 py-4">
                                <CalendarClock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    무제한 이용권의 적용 기간은 <strong className="text-gray-900">결제가 확인된 날짜</strong>부터 시작됩니다.
                                    결제가 늦어지는 경우 적용 시작일이 변경될 수 있습니다.
                                </p>
                            </div>
                            <div className="flex items-start gap-4 px-6 py-4">
                                <PauseCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    이용 기간이 종료되면, <strong className="text-gray-900">쇼핑몰 단일 캠페인</strong>은 자동으로 모집이 중단됩니다.
                                </p>
                            </div>
                            <div className="flex items-start gap-4 px-6 py-4">
                                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    이용 기간이 종료되면, <strong className="text-gray-900">선정형 캠페인</strong>의 경우 모집은 계속되지만 <span className="text-rose-500 font-bold">선정이 불가</span>합니다.
                                </p>
                            </div>
                            <div className="flex items-start gap-4 px-6 py-4">
                                <PlayCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    무제한 이용권을 재이용 시, 이용 기간 종료로 <strong className="text-gray-900">일시 정지된 캠페인을 그대로 이어서</strong> 이용할 수 있습니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact CTA */}
                    <div className="bg-gradient-to-br from-primary/5 via-rose-50 to-orange-50 border border-primary/10 rounded-3xl p-10 text-center">
                        <p className="text-2xl font-black text-gray-900 mb-2">더 궁금한 점이 있으신가요?</p>
                        <p className="text-gray-500 mb-6 text-sm">담당자가 직접 안내드립니다. 부담 없이 문의해 주세요.</p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm"
                        >
                            <MessageSquare size={16} />
                            1:1 문의하기
                        </Link>
                    </div>

                    </>)}

                </div>
            </main>
        </div>
    );
}
