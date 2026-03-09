'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';
import { ADVERTISER_LINKS } from '@/constants/navigation';
import { UNLIMITED_PLANS } from '@/constants/pricing';
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

const FAQS = [
    {
        q: '캠페인 등록 1건당 과금이 되는 건가요?',
        a: '단일 체험단과 1석 2조 체험단은 캠페인 등록 건당 5,000원 / 9,000원이 부과됩니다. 구독형 결제(무제한 월 이용권) 선택 시에는 건당 과금 없이 자유롭게 등록하실 수 있습니다.',
    },
    {
        q: '1석 2조 체험단은 어떤 서비스인가요?',
        a: '쇼핑몰 리뷰와 SNS 리뷰(블로그·인스타피드·인스타릴스·네이버클립·스레드 중 택1)를 한 번에 진행하는 패키지입니다. 단일 건당보다 10% 저렴하게 두 채널을 동시에 활용할 수 있습니다.',
    },
    {
        q: '무제한 월 이용권 해지/환불은 어떻게 되나요?',
        a: '결제 후 7일 이내 미사용 시 전액 환불됩니다. 단, 유료 기능(캠페인 등록, 모집/선정 등) 사용 시작 후에는 당월 환불이 불가합니다.',
    },
    {
        q: '무제한 월 이용권으로 등록할 수 있는 캠페인 수에 제한이 있나요?',
        a: '단일 체험단과 1석 2조 체험단 모두 무제한으로 등록 및 모집하실 수 있습니다. 단, 동시에 진행 가능한 캠페인은 최대 30개입니다.',
    },
    {
        q: '결제는 어떤 방식으로 이루어지나요?',
        a: '신용카드, 체크카드, 계좌이체로 결제하실 수 있습니다. 구독형 결제인 무제한 월 이용권은 매월 결제되는 플랜입니다. 세금계산서 발행이 필요하신 경우 1:1 문의로 요청해 주세요.',
    },
];

type PaymentMode = 'ONE_TIME' | 'SUBSCRIPTION';

export default function PricingPage() {
    const { profile } = useAuthStore();
    const searchParams = useSearchParams();
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('ONE_TIME');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'subscription') {
            setPaymentMode('SUBSCRIPTION');
        }
    }, [searchParams]);

    const displayName = profile?.company_name || profile?.nickname || '광고주';
    const isVerified = profile?.biz_verification_status === 'APPROVED';
    const monthlyPlan = UNLIMITED_PLANS[0];

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="ADVERTISER"
                userName={displayName}
                links={ADVERTISER_LINKS.map((link) => ({
                    ...link,
                    active: link.href === '/dashboard/advertiser/pricing',
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
                                이용요금 안내는 <strong className="text-gray-700">사업자 인증이 완료된 광고주</strong>에게만 제공됩니다.
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
                        </div>
                    )}

                    {isVerified && (
                        <>
                            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                                <div>
                                    <div className="mb-2 flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                            <Star className="h-5 w-5 text-primary" />
                                        </div>
                                        <h1 className="text-3xl font-black tracking-tight text-gray-900">이용요금 안내</h1>
                                    </div>
                                    <p className="ml-[52px] mt-1 text-gray-500">결제 방식을 먼저 고른 뒤, 해당 요금제를 선택하세요.</p>
                                </div>
                                <Link
                                    href="/dashboard/advertiser/billing"
                                    className="ml-[52px] inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 shadow-sm transition-all hover:bg-gray-50 md:ml-0"
                                >
                                    결제관리 대시보드
                                    <ArrowRight size={14} />
                                </Link>
                            </div>

                            <div className="mb-6 flex items-center rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMode('ONE_TIME')}
                                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black transition-all ${
                                        paymentMode === 'ONE_TIME' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    단일 결제
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMode('SUBSCRIPTION')}
                                    className={`relative flex-1 rounded-xl px-4 py-2.5 text-sm font-black transition-all ${
                                        paymentMode === 'SUBSCRIPTION' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    구독형 결제
                                    <span className="absolute -top-2.5 -right-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-white shadow-sm shadow-primary/30">
                                        인기
                                    </span>
                                </button>
                            </div>

                            {paymentMode === 'ONE_TIME' && (
                                <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
                                    <div className="flex h-full flex-col rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                                        <div className="mb-6 min-h-[92px]">
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                                                    <ShoppingBag className="h-4 w-4 text-blue-500" />
                                                </div>
                                                <h2 className="text-xl font-black text-gray-900">배송체험단</h2>
                                            </div>
                                            <p className="text-sm leading-relaxed text-gray-500">부담 없는 비용으로, 꼭 필요한 채널의 리뷰부터 빠르게 채우세요.</p>
                                        </div>
                                        <div className="mb-8 min-h-[118px] border-y border-gray-100 py-6">
                                            <div className="flex items-end gap-1">
                                                <span className="text-4xl font-black text-gray-900">5,000</span>
                                                <span className="text-xl font-black text-gray-900">원</span>
                                                <span className="mb-0.5 ml-1 text-sm font-medium text-gray-400">/ 건당</span>
                                            </div>
                                        </div>
                                        <Link
                                            href="/dashboard/campaign/new"
                                            className="mb-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-center text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                                        >
                                            캠페인 등록하기
                                            <ArrowRight size={15} />
                                        </Link>
                                        <ul className="flex flex-1 flex-col gap-5">
                                            <li className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                                                    <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-800">쇼핑몰 리뷰</p>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                                                    <Newspaper className="h-3.5 w-3.5 text-violet-600" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-800">원고료형 기자단</p>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                                                    <Share2 className="h-3.5 w-3.5 text-rose-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">SNS 리뷰</p>
                                                    <p className="mt-0.5 text-xs leading-relaxed text-gray-400">블로그 · 인스타피드 · 인스타릴스 · 네이버클립 · 스레드</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="flex h-full flex-col rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                                        <div className="mb-6 min-h-[92px]">
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
                                                    <Zap className="h-4 w-4 text-primary" />
                                                </div>
                                                <h2 className="text-xl font-black text-gray-900">1석 2조 체험단</h2>
                                            </div>
                                            <p className="text-sm leading-relaxed text-gray-500">쇼핑몰 + SNS 리뷰를 한 번에, 할인된 가격으로 해결하세요.</p>
                                        </div>
                                        <div className="mb-8 min-h-[118px] border-y border-gray-100 py-6">
                                            <span className="mb-1 inline-block rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-black text-gray-600">10% 할인</span>
                                            <div className="flex items-end gap-1">
                                                <span className="text-4xl font-black text-gray-900">9,000</span>
                                                <span className="text-xl font-black text-gray-900">원</span>
                                                <span className="mb-0.5 ml-1 text-sm font-medium text-gray-400">/ 건당</span>
                                            </div>
                                        </div>
                                        <Link
                                            href="/dashboard/campaign/new"
                                            className="mb-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-center text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                                        >
                                            캠페인 등록하기
                                            <ArrowRight size={15} />
                                        </Link>
                                        <ul className="flex flex-1 flex-col gap-5">
                                            <li className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                                                    <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-800">쇼핑몰 리뷰</p>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                                                    <Share2 className="h-3.5 w-3.5 text-rose-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">SNS 리뷰 <span className="text-xs font-normal text-gray-400">택1</span></p>
                                                    <p className="mt-0.5 text-xs leading-relaxed text-gray-400">블로그 · 인스타피드 · 인스타릴스 · 네이버클립 · 스레드</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="flex h-full flex-col rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                                        <div className="mb-6 min-h-[92px]">
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                                                    <Newspaper className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <h2 className="text-xl font-black text-gray-900">방문체험단</h2>
                                            </div>
                                            <p className="text-sm leading-relaxed text-gray-500">매장 방문 기반 후기로 오프라인 유입과 지역 키워드 노출을 동시에 확보하세요.</p>
                                        </div>
                                        <div className="mb-8 min-h-[118px] border-y border-gray-100 py-6">
                                            <div className="flex items-end gap-1">
                                                <span className="text-4xl font-black text-gray-900">10,000</span>
                                                <span className="text-xl font-black text-gray-900">원</span>
                                                <span className="mb-0.5 ml-1 text-sm font-medium text-gray-400">/ 건당</span>
                                            </div>
                                        </div>
                                        <Link
                                            href="/dashboard/campaign/new"
                                            className="mb-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-center text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                                        >
                                            캠페인 등록하기
                                            <ArrowRight size={15} />
                                        </Link>
                                        <ul className="flex flex-1 flex-col gap-5">
                                            <li className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                                                    <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-800">방문 리뷰</p>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50">
                                                    <Newspaper className="h-3.5 w-3.5 text-cyan-600" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-800">지역 키워드 노출</p>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                                                    <Share2 className="h-3.5 w-3.5 text-rose-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">SNS 리뷰 연계</p>
                                                    <p className="mt-0.5 text-xs leading-relaxed text-gray-400">블로그 · 인스타피드 · 인스타릴스</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {paymentMode === 'SUBSCRIPTION' && (
                                <div className="mb-12 mx-auto max-w-[560px]">
                                    <div className="relative flex h-full flex-col rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                                        <div className="mb-6">
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
                                                    <Infinity className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <h2 className="text-xl font-black text-gray-900">무제한 월 이용권</h2>
                                            </div>
                                            <p className="text-sm leading-relaxed text-gray-500">리뷰가 많이 필요한 광고주라면, 다온뷰의 모든 체험단을 제한 없이 이용해 보세요.</p>
                                        </div>
                                        
                                        <div className="mb-8 relative rounded-2xl border-2 border-primary bg-primary/5 p-5 text-left transition-all">
                                            <span className="absolute -right-2 -top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-white">BEST</span>
                                            <p className="mb-1 text-xs font-black text-gray-500">{monthlyPlan.period}</p>
                                            <p className="text-3xl font-black text-primary">
                                                {monthlyPlan.pricePerMonth.toLocaleString()}
                                                <span className="ml-1 text-base font-bold text-gray-400">원/월</span>
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">총 {monthlyPlan.total.toLocaleString()}원</p>
                                            <span className="mt-2 inline-block rounded-md bg-gray-200 px-2 py-0.5 text-xs font-black text-gray-600">
                                                매월 자동 결제
                                            </span>
                                        </div>
                                        <Link
                                            href="/dashboard/advertiser/billing/unlimited?plan=0"
                                            className="mb-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-center text-sm font-bold text-white transition-all hover:bg-black"
                                        >
                                            결제 페이지로 이동
                                            <ArrowRight size={15} />
                                        </Link>
                                        <ul className="flex flex-col gap-3">
                                            <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-primary" /><span className="text-sm text-gray-700">단일 체험단 이용 <strong className="text-primary">무제한</strong></span></li>
                                            <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-primary" /><span className="text-sm text-gray-700">1석 2조 체험단 이용 <strong className="text-primary">무제한</strong></span></li>
                                            <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-primary" /><span className="text-sm text-gray-700">동시 진행 최대 30개</span></li>
                                            <li className="flex items-center gap-2"><Star className="h-4 w-4 shrink-0 text-amber-500" /><span className="text-sm text-gray-700">우선 노출 혜택 제공</span></li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div className="mb-12">
                                <h2 className="mb-6 text-xl font-black text-gray-900">자주 묻는 질문</h2>
                                <div className="flex flex-col gap-3">
                                    {FAQS.map((faq, i) => (
                                        <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                                            <button
                                                className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-gray-50"
                                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                            >
                                                <span className="pr-4 text-sm font-bold text-gray-800">{faq.q}</span>
                                                {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />}
                                            </button>
                                            {openFaq === i && <div className="border-t border-gray-100 px-6 pb-5 pt-4 text-sm leading-relaxed text-gray-500">{faq.a}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-10">
                                <div className="mb-5 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50"><RotateCcw className="h-4 w-4 text-amber-600" /></div>
                                    <h2 className="text-xl font-black text-gray-900">환불 규정</h2>
                                </div>
                                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                        <div className="mb-3 flex items-center gap-2"><ShoppingBag className="h-4 w-4 shrink-0 text-blue-500" /><p className="text-sm font-black text-gray-800">단일 체험단 &amp; 1석 2조 체험단</p></div>
                                        <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /><p className="text-sm leading-relaxed text-gray-600">마음에 드는 인플루언서가 없어 선정을 안 하시거나, 모집 인원이 미달된 수량에 대해 <strong className="text-gray-900">100% 환불</strong>이 가능합니다.</p></div>
                                    </div>
                                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                        <div className="mb-3 flex items-center gap-2"><Infinity className="h-4 w-4 shrink-0 text-purple-500" /><p className="text-sm font-black text-gray-800">무제한 월 이용권</p></div>
                                        <ul className="flex flex-col gap-2.5">
                                            <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /><p className="text-sm leading-relaxed text-gray-600"><strong className="text-gray-900">결제 후 7일 이내 + 미사용</strong> 상태면 전액 환불됩니다.</p></li>
                                            <li className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><p className="text-sm leading-relaxed text-gray-600">결제 후 유료 기능(캠페인 등록, 모집/선정 등) 사용 시작 후에는 당월 환불이 불가합니다.</p></li>
                                            <li className="flex items-start gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" /><p className="text-sm leading-relaxed text-gray-600">환불이 완료되면 무제한 월 이용권 혜택 즉시 종료 처리됩니다.</p></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-12">
                                <div className="mb-5 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50"><CalendarClock className="h-4 w-4 text-purple-600" /></div>
                                    <h2 className="text-xl font-black text-gray-900">무제한 월 이용권 적용 규정</h2>
                                </div>
                                <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white shadow-sm">
                                    <div className="flex items-start gap-4 px-6 py-4"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" /><p className="text-sm leading-relaxed text-gray-600">무제한 월 이용권의 적용 기간은 <strong className="text-gray-900">결제가 확인된 날짜</strong>부터 시작됩니다. 결제가 늦어지는 경우 적용 시작일이 변경될 수 있습니다.</p></div>
                                    <div className="flex items-start gap-4 px-6 py-4"><PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" /><p className="text-sm leading-relaxed text-gray-600">이용 기간이 종료되면, <strong className="text-gray-900">쇼핑몰 단일 캠페인</strong>은 자동으로 모집이 중단됩니다.</p></div>
                                    <div className="flex items-start gap-4 px-6 py-4"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /><p className="text-sm leading-relaxed text-gray-600">이용 기간이 종료되면, <strong className="text-gray-900">선정형 캠페인</strong>의 경우 모집은 계속되지만 <span className="font-bold text-rose-500">선정이 불가</span>합니다.</p></div>
                                    <div className="flex items-start gap-4 px-6 py-4"><PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /><p className="text-sm leading-relaxed text-gray-600">무제한 월 이용권을 재이용 시, 이용 기간 종료로 <strong className="text-gray-900">일시 정지된 캠페인을 그대로 이어서</strong> 이용할 수 있습니다.</p></div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-rose-50 to-orange-50 p-10 text-center">
                                <p className="mb-2 text-2xl font-black text-gray-900">더 궁금한 점이 있으신가요?</p>
                                <p className="mb-6 text-sm text-gray-500">담당자가 직접 안내드립니다. 부담 없이 문의해 주세요.</p>
                                <Link href="/contact" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
                                    <MessageSquare size={16} />
                                    1:1 문의하기
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
