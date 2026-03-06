'use client';

import { motion } from 'framer-motion';
import { fadeIn, staggerContainer, slideInLeft, slideInRight, scaleUp } from '@/lib/motion';
import Link from 'next/link';
import { useState } from 'react';
import {
    Zap,
    TrendingUp,
    Shield,
    BarChart3,
    Users,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Target,
    MessageSquare,
    Award,
    Clock,
    Star,
    Quote,
    Package,
    Smartphone,
    ShoppingBag,
    Coffee,
    Laptop,
    Heart,
    Infinity,
    Puzzle,
    Rocket,
    Scale,
    ShoppingCart,
    HelpCircle,
    MousePointerClick,
    Search,
    Eye,
    Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';

export default function IntroClient() {
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        message: '',
        agreed: false
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.agreed) {
            toast.error("개인정보 처리방침에 동의해주세요.");
            return;
        }

        setIsSubmitting(true);
        
        try {
            const { error } = await supabase
                .from('inquiries')
                .insert([
                    {
                        name: formData.name,
                        contact: formData.contact,
                        message: formData.message
                    }
                ]);

            if (error) throw error;

            toast.success("문의가 성공적으로 전달되었습니다. 빠른 시일 내에 연락드리겠습니다!");
            setFormData({ name: '', contact: '', message: '', agreed: false });
        } catch (error: any) {
            console.error('[Intro] Inquiry Error:', error);
            toast.error("전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    return (
        <div className="bg-white">
            {/* 1. Hero Section: 압도적 성과와 신뢰성 */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-pink-900 text-white min-h-[85vh] flex items-center">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                
                <div className="container relative py-20 px-4">
                    <motion.div
                        className="text-center"
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full mb-8 border border-white/20">
                            <Award className="w-5 h-5 text-yellow-300" />
                            <span className="text-sm font-bold tracking-tight">수천 개의 브랜드가 선택한 고성능 리뷰 솔루션</span>
                        </motion.div>

                        <motion.h1 variants={fadeIn} className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.15] tracking-tight text-white">
                            단순한 리뷰를 넘어,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-pink-200">
                                브랜드의 검색 1면을 장악하세요
                            </span>
                        </motion.h1>

                        <motion.p variants={fadeIn} className="text-xl lg:text-2xl mb-12 text-pink-100/90 max-w-3xl mx-auto leading-relaxed">
                            매회 예산 걱정하는 체험단은 그만.<br />
                            효과가 증명된 다온뷰만의 시스템으로 매출의 임계점을 돌파합니다.
                        </motion.p>

                        <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                            <Link
                                href="#contact-form"
                                className="inline-flex items-center justify-center bg-white text-primary hover:bg-pink-50 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] px-10 py-5 text-xl font-black group transition-all rounded-full h-16"
                            >
                                무료 맞춤형 컨설팅 신청
                                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/campaigns"
                                className="inline-flex items-center justify-center border-2 border-white/40 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 px-10 py-5 text-xl font-bold transition-all rounded-full h-16"
                            >
                                진행 사례 보기
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
            </section>

            {/* 2. Problem Section (Pain Point): 광고주의 고민 환기 */}
            <section className="py-24 bg-white relative">
                <div className="container px-4">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="text-center mb-20"
                    >
                        <span className="text-primary font-bold text-lg mb-4 block">WHY DAONVIEW?</span>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                            아직도 돈만 쓰는 마케팅을 하고 계신가요?
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Search,
                                title: "키워드 검색 결과 1면,\n우리 브랜드는 없나요?",
                                desc: "아무리 좋은 상품도 고객의 눈에 띄지 않으면 의미가 없습니다. 타겟 키워드 점유율이 곧 매출 점유율입니다."
                            },
                            {
                                icon: MousePointerClick,
                                title: "방문자는 늘었는데\n구매 전환이 안 되나요?",
                                desc: "고객은 신뢰할 수 있는 '리턴 이미지'와 '포토리뷰'를 보고 결제합니다. 신뢰를 구축하는 고품질 콘텐츠가 부족하기 때문입니다."
                            },
                            {
                                icon: HelpCircle,
                                title: "체험단 관리하느라\n본업을 소홀히 하시나요?",
                                desc: "리뷰어 선정, 가이드 배포, 마감 관리... 복잡한 수동 관리는 마케팅 사고와 스트레스의 주범입니다."
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                variants={fadeIn}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-slate-50 rounded-3xl p-10 border border-slate-100 hover:shadow-xl transition-all"
                            >
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                    <item.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4 whitespace-pre-line leading-tight">
                                    {item.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Solution Section (USP): 다온뷰만의 차별화 솔루션 */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[150px] -z-0"></div>
                <div className="container relative z-10 px-4">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={slideInLeft}
                        >
                            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-light px-4 py-2 rounded-full mb-6 font-bold text-sm">
                                <Sparkles className="w-4 h-4" />
                                1석 2조 리뷰 자동화 시스템
                            </div>
                            <h2 className="text-4xl lg:text-6xl font-black mb-10 leading-[1.2] text-white">
                                리뷰와 SNS의<br />
                                <span className="text-primary-light">강력한 시너지</span>
                            </h2>
                            <p className="text-xl text-slate-300 mb-8 font-bold">
                                통합 마케팅으로 매출을 극대화하세요
                            </p>
                            <div className="space-y-8 text-left">
                                {[
                                    { title: "실구매 데이터 확보", desc: "단순 리뷰를 넘어 실제 구매 기반의 검색량과 판매 지수를 높입니다." },
                                    { title: "검색 결과 지배력", desc: "블로그, 인스타, 유튜브 등 주요 플랫폼을 동시에 공략하여 브랜드 노출을 극대화합니다." },
                                    { title: "체계적 자동화 시스템", desc: "다온뷰만의 런칭 시스템으로 선정부터 결과 분석까지 번거로운 과정이 사라집니다." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-5">
                                        <div className="w-10 h-10 bg-primary/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 className="w-6 h-6 text-primary-light" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2 text-white">{item.title}</h4>
                                            <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={slideInRight}
                            className="relative"
                        >
                             <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-[2.5rem] p-4 shadow-2xl">
                                <div className="bg-white rounded-[2rem] p-8 text-slate-900">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Real-time Performance</span>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="h-4 w-3/4 bg-slate-100 rounded-full animate-pulse"></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-32 bg-pink-50 rounded-3xl flex flex-col items-center justify-center border border-pink-100">
                                                <Eye className="w-8 h-8 text-primary mb-2 opacity-80" />
                                                <span className="text-2xl font-black text-primary">2,500+</span>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase">Daily Reach</span>
                                            </div>
                                            <div className="h-32 bg-blue-50 rounded-3xl flex flex-col items-center justify-center border border-blue-100">
                                                <TrendingUp className="w-8 h-8 text-blue-600 mb-2 opacity-80" />
                                                <span className="text-2xl font-black text-blue-600">350%</span>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase">ROI Growth</span>
                                            </div>
                                        </div>
                                        <div className="h-4 w-1/2 bg-slate-100 rounded-full"></div>
                                        <div className="h-20 bg-slate-50 rounded-2xl p-4 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                                                <Smartphone className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-2 w-full bg-slate-200 rounded-full"></div>
                                                <div className="h-2 w-2/3 bg-slate-200 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. Features: 다온뷰 핵심 경쟁력 */}
            <section className="py-24 lg:py-32">
                <div className="container px-4">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                            전문성이 만드는 한 끗 차이
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            우리는 단순한 실행사가 아닌, 브랜드의 <span className="text-primary font-bold">마케팅 팀</span>으로 움직입니다.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: Target,
                                title: "핵심 키워드 타겟팅",
                                desc: "고객이 검색하는 정확한 '구매 키워드'를 분석하여 노출 경로를 설계합니다."
                            },
                            {
                                icon: Shield,
                                title: "엄격한 리뷰어 필터링",
                                desc: "팔로워 봇, 작업성 계정은 철저히 배제합니다. 진정성 있는 인플루언서만 엄선합니다."
                            },
                            {
                                icon: Award,
                                title: "법적 책임 보호 서비스",
                                desc: "리뷰 미작성, 먹튀 우려 ZERO. 제휴 법무법인을 통해 광고주 권익을 확실히 보호합니다."
                            },
                            {
                                icon: BarChart3,
                                title: "실시간 성과 대시보드",
                                desc: "진행 현황부터 노출 데이터까지, 대시보드에서 한눈에 실적을 확인하세요."
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                variants={fadeIn}
                                whileHover={{ y: -10 }}
                                className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all flex flex-col items-center text-center"
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl flex items-center justify-center mb-8">
                                    <feature.icon className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. Process: 1분 안에 파악하는 진행 단계 */}
            <section className="py-24 bg-slate-50">
                <div className="container px-4">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                            상담부터 런칭까지 단 24시간
                        </h2>
                        <p className="text-lg text-slate-500">
                            효율을 극대화한 다온뷰의 5단계 프로세스
                        </p>
                    </motion.div>

                    <div className="relative">
                        <div className="hidden lg:block absolute top-[60px] left-0 w-full h-0.5 bg-slate-200"></div>

                        <div className="grid lg:grid-cols-5 gap-12 relative z-10">
                            {[
                                { step: "01", title: "무료 상담 신청", desc: "전문 어드바이저와 브랜드 고민을 나눕니다." },
                                { step: "02", title: "맞춤 전략 제안", desc: "키워드 분석 및 최적의 채널을 제안합니다." },
                                { step: "03", title: "캠페인 런칭", desc: "검증된 인플루언서 모집을 시작합니다." },
                                { step: "04", title: "콘텐츠 검수", desc: "품질 높은 리뷰가 업로드됩니다." },
                                { step: "05", title: "최종 성과 보고", desc: "도달률과 전환 데이터를 분석해 보고합니다." }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    variants={fadeIn}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex flex-col items-center text-center group"
                                >
                                    <div className="w-14 h-14 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center mb-6 font-black text-slate-400 group-hover:border-primary group-hover:text-primary transition-all shadow-sm">
                                        {item.step}
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed px-2">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Stats: 데이터로 증명하는 가치 */}
            <section className="py-24 overflow-hidden relative">
                <div className="container px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                        >
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
                                수치로 증명하는<br />다온뷰의 압도적 클래스
                            </h2>
                            <p className="text-xl text-slate-500 mb-12 leading-relaxed text-left">
                                화려한 광고 문구보다 강력한 것은 실제 진행 내역과 성과 지표입니다. 
                                이미 많은 리더들이 다온뷰와 함께 성장하고 있습니다.
                            </p>
                            <div className="grid grid-cols-2 gap-8 text-left">
                                {[
                                    { label: "함께한 브랜드", value: "500+", suffix: "개 브랜드" },
                                    { label: "누적 캠페인", value: "2,000+", suffix: "건 돌파" },
                                    { label: "콘텐츠 제작", value: "15,000+", suffix: "개 포스팅" },
                                    { label: "평균 만족도", value: "98%", suffix: "매우 만족" }
                                ].map((stat, i) => (
                                    <div key={i} className="border-l-4 border-primary pl-6 py-2">
                                        <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                                        <div className="text-sm text-slate-400 font-bold uppercase">{stat.label}</div>
                                        <div className="text-xs text-primary mt-1 font-medium">{stat.suffix}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="bg-gradient-to-br from-primary/5 to-pink-100/30 rounded-[3rem] p-12 lg:p-20 flex items-center justify-center relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
                            <div className="relative text-center">
                                <Rocket className="w-32 h-32 text-primary mb-10 mx-auto opacity-80" />
                                <div className="text-2xl font-bold text-slate-700 italic">"성장의 임계점을 넘기 위해 필요한 것은"</div>
                                <div className="text-4xl font-black text-primary mt-4">확신과 전략입니다.</div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 7. Final Contact Form Section: 최하단 상담 피드 */}
            <section id="contact-form" className="py-24 lg:py-32 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.15),transparent_70%)]"></div>
                
                <div className="container relative z-10 px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                        {/* 좌측: 텍스트 안내 */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={slideInLeft}
                            className="text-white text-left"
                        >
                            <h2 className="text-4xl lg:text-6xl font-black mb-8 leading-tight tracking-tighter">
                                DAONVIEW<br />
                                <span className="text-primary-light font-black italic">광고주세요?</span>
                            </h2>
                            <p className="text-xl lg:text-2xl text-slate-300 leading-relaxed mb-10">
                                전문 마케터가 브랜드 진단부터<br />
                                <span className="text-white font-bold">1:1 맞춤형 컨설팅</span>을 도와드립니다.
                            </p>
                            
                            <div className="space-y-6">
                                {[
                                    { icon: Shield, label: "품질 보장", desc: "검증된 리뷰어만 선정" },
                                    { icon: Clock, label: "24시간 지원", desc: "신속한 응대와 속도감" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                                            <item.icon className="w-6 h-6 text-primary-light" />
                                        </div>
                                        <div>
                                            <div className="font-bold">{item.label}</div>
                                            <div className="text-sm text-slate-400">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* 우측: 상담 신청 폼 */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={slideInRight}
                            className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl relative"
                        >
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-slate-700 font-bold ml-1">성함(회사명) <span className="text-primary text-xs">*</span></Label>
                                    <Input 
                                        id="name" 
                                        placeholder="성함 또는 업체명을 입력해주세요" 
                                        className="h-14 bg-slate-50 border-slate-200 rounded-xl px-5 focus:ring-primary focus:border-primary text-black"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contact" className="text-slate-700 font-bold ml-1">연락처 <span className="text-primary text-xs">*</span></Label>
                                    <Input 
                                        id="contact" 
                                        placeholder="연락받으실 번호를 입력해주세요" 
                                        className="h-14 bg-slate-50 border-slate-200 rounded-xl px-5 focus:ring-primary focus:border-primary text-black"
                                        required
                                        value={formData.contact}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-slate-700 font-bold ml-1">문의내용</Label>
                                    <Textarea 
                                        id="message" 
                                        placeholder="궁금하신 내용을 남겨주시면 자세히 안내해드립니다" 
                                        className="min-h-[140px] bg-slate-50 border-slate-200 rounded-xl p-5 focus:ring-primary focus:border-primary text-black resize-none"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="flex items-center justify-between py-2 border-t border-slate-100 mt-4 pt-6">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="agreed" 
                                            checked={formData.agreed}
                                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreed: !!checked }))}
                                        />
                                        <label
                                            htmlFor="agreed"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-500 cursor-pointer"
                                        >
                                            개인정보 처리방침에 동의합니다.
                                        </label>
                                    </div>

                                    {/* 약관 드로워 */}
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <button type="button" className="text-xs text-slate-400 hover:text-primary underline transition-colors">자세히보기</button>
                                        </SheetTrigger>
                                        <SheetContent side="right" className="top-[70px] h-[calc(100vh-70px)] w-[400px] sm:w-[540px] border-t border-slate-100 shadow-2xl">
                                            <SheetHeader className="pb-6 border-b border-slate-50">
                                                <SheetTitle className="text-2xl font-black text-primary">개인정보 처리방침</SheetTitle>
                                                <SheetDescription className="text-slate-500 font-medium">
                                                    다온뷰 상담 신청을 위한 개인정보 수집 및 이용 안내
                                                </SheetDescription>
                                            </SheetHeader>
                                            <ScrollArea className="h-[calc(100vh-200px)] mt-6 pr-4">
                                                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                    {`회사 (이하 '다온컴퍼니')는 별도의 회원가입 절차 없이 대부분의 신청관련 컨텐츠에 자유롭게 접근할 수 있습니다. 회사는 서비스 이용을 위하여 아래와 같은 개인정보를 수집하고 있습니다.

1) 수집하는 개인정보의 범위
■ 필수항목 - 이름, 연락처

2) 개인정보의 수집목적 및 이용목적
① 회사는 서비스를 제공하기 위하여 다음과 같은 목적으로 개인정보를 수집하고 있습니다. 이름, 연락처는 기본 필수 요소입니다.
연락처 : 공지사항 전달, 본인 의사 확인, 불만 처리 등 원활한 의사소통 경로의 확보, 새로운 서비스의 안내
그 외 선택항목 : 개인맞춤 서비스를 제공하기 위한 자료
② 단, 이용자의 기본적 인권 침해의 우려가 있는 민감한 개인정보는 수집하지 않습니다.

3) 개인정보의 보유기간 및 이용기간
① 귀하의 개인정보는 다음과 같이 개인정보의 수집목적 또는 제공받은 목적이 달성되면 파기됩니다. 단, 관련법령의 규정에 의하여 다음과 같이 권리 의무 관계의 확인 등을 이유로 일정기간 보유하여야 할 필요가 있을 경우에는 일정기간 보유합니다. 
기록 : 1년
② 귀하의 동의를 받아 보유하고 있는 거래정보 등을 귀하께서 열람을 요구하는 경우 은 지체 없이 그 열람, 확인 할 수 있도록 조치합니다.

4) 개인정보 파기절차 및 방법
이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다. 회사의 개인정보 파기절차 및 방법은 다음과 같습니다. 
개인정보는 법률에 의한 경우가 아니고서는 보유되는 이외의 다른 목적으로 이용되지 않습니다. 
종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다. 
전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.`}
                                                </div>
                                            </ScrollArea>
                                        </SheetContent>
                                    </Sheet>
                                </div>

                                <Button 
                                    className="w-full h-16 bg-primary hover:bg-primary-dark text-white rounded-xl text-xl font-black shadow-xl shadow-primary/20 group transition-all"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "전송 중..." : (
                                        <>
                                            상담 신청하기
                                            <Send className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
