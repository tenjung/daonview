import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '이용 가이드',
  description: '다온뷰 체험단 신청부터 리뷰 작성까지, 5단계로 쉽고 빠르게 이용하세요. 회원가입 후 원하는 체험단에 신청하면 설정 완료!',
  keywords: ['체험단 이용방법', '다온뷰 가이드', '체험단 신청', '리뷰어 활동', '인플루언서 등록'],
  openGraph: {
    title: '이용 가이드 | 다온뷰',
    description: '다온뷰 체험단 신청부터 리뷰 작성까지, 5단계로 쉽고 빠르게 이용하세요.',
    url: 'https://daonview.com/guide',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://daonview.com/guide',
  },
};

export default function GuidePage() {
    const steps = [
        {
            num: "01",
            title: "회원가입 & 프로필 등록",
            desc: "다온뷰의 회원이 되어주세요! 활동하는 SNS 채널을 연결하면 준비 완료.",
            icon: "👋"
        },
        {
            num: "02",
            title: "캠페인 신청",
            desc: "원하는 캠페인을 찾아 신청버튼을 꾹! 기대평을 남기면 선정 확률 UP!",
            icon: "👆"
        },
        {
            num: "03",
            title: "체험단 선정",
            desc: "광고주가 리뷰어를 선정합니다. 선정되면 카카오톡 알림톡으로 알려드려요.",
            icon: "🎉"
        },
        {
            num: "04",
            title: "제품/서비스 체험",
            desc: "배송된 제품을 받거나 매장에 방문하여 생생한 체험을 즐겨보세요.",
            icon: "📦"
        },
        {
            num: "05",
            title: "리뷰 작성 & 등록",
            desc: "가이드라인에 맞춰 정성스러운 리뷰를 작성하고 미션을 완료해주세요.",
            icon: "✍️"
        }
    ];

    return (
        <div className="bg-white pb-20">
            {/* Header */}
            <div className="bg-rose-50 py-16 text-center border-b border-rose-100">
                <h1 className="text-4xl font-extrabold text-text-main mb-4">다온뷰 이용 가이드</h1>
                <p className="text-text-secondary">누구나 쉽게 시작하는 인플루언서 라이프, 다온뷰와 함께하세요.</p>
            </div>

            <div className="container max-w-4xl mx-auto px-6 -mt-8">

                {/* Steps */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
                    <div className="grid gap-8">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex gap-6 items-start group">
                                <div className="hidden sm:flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/30 z-10">
                                        {step.num}
                                    </div>
                                    {idx !== steps.length - 1 && (
                                        <div className="w-0.5 h-full bg-slate-100 min-h-[60px] my-2 group-last:hidden" />
                                    )}
                                </div>

                                <div className="flex-1 bg-slate-50 hover:bg-rose-50/50 transition-colors p-6 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-primary sm:hidden mb-2 block">STEP {step.num}</span>
                                        <div className="text-4xl opacity-20 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300">{step.icon}</div>
                                    </div>
                                    <h3 className="text-xl font-bold text-text-main mb-2">{step.title}</h3>
                                    <p className="text-text-secondary leading-relaxed word-keep-all">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ CTA */}
                <div className="mt-16 text-center">
                    <h2 className="text-2xl font-bold mb-6">궁금한 점이 있으신가요?</h2>
                    <div className="flex justify-center gap-4">
                        <Link href="/faq" className="btn btn-primary px-8 py-3 rounded-full text-lg">
                            자주 묻는 질문 보러가기
                        </Link>
                        <Link href="/contact" className="btn btn-outline px-8 py-3 rounded-full text-lg bg-white">
                            1:1 문의하기
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
