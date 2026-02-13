'use client';

import Link from 'next/link';
import CommunitySubPageLayout from '@/components/community/CommunitySubPageLayout';
import { motion } from 'framer-motion';
import { 
    UserPlus, 
    MousePointer2, 
    CheckCircle2, 
    Package, 
    PenLine, 
    ArrowRight,
    MessageCircleQuestion
} from 'lucide-react';

export default function GuidePage() {
    const steps = [
        {
            num: "01",
            title: "회원가입 & 프로필 등록",
            desc: "다온뷰의 회원이 되어주세요! 활동하는 SNS 채널을 연결하면 준비 완료.",
            icon: <UserPlus className="w-6 h-6" />,
            color: "bg-blue-500"
        },
        {
            num: "02",
            title: "캠페인 신청",
            desc: "원하는 캠페인을 찾아 신청버튼을 꾹! 기대평을 남기면 선정 확률 UP!",
            icon: <MousePointer2 className="w-6 h-6" />,
            color: "bg-purple-500"
        },
        {
            num: "03",
            title: "체험단 선정",
            desc: "광고주가 리뷰어를 선정합니다. 선정되면 카카오톡 알림톡으로 알려드려요.",
            icon: <CheckCircle2 className="w-6 h-6" />,
            color: "bg-emerald-500"
        },
        {
            num: "04",
            title: "제품/서비스 체험",
            desc: "배송된 제품을 받거나 매장에 방문하여 생생한 체험을 즐겨보세요.",
            icon: <Package className="w-6 h-6" />,
            color: "bg-orange-500"
        },
        {
            num: "05",
            title: "리뷰 작성 & 등록",
            desc: "가이드라인에 맞춰 정성스러운 리뷰를 작성하고 미션을 완료해주세요.",
            icon: <PenLine className="w-6 h-6" />,
            color: "bg-primary"
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                stiffness: 100,
                damping: 15
            }
        }
    };

    return (
        <CommunitySubPageLayout
            title="다온뷰 이용 가이드"
            description="누구나 쉽게 시작하는 인플루언서 라이프, 다온뷰와 함께하세요."
            headerBgColor="bg-slate-50"
            headerBorderColor="border-slate-100"
        >
            <motion.div 
                className="max-w-3xl mx-auto mb-16"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="relative space-y-8 md:space-y-12">
                    {/* Animated vertical line */}
                    <div className="absolute left-6 md:left-8 top-8 bottom-8 w-0.5 bg-slate-100 hidden sm:block" />

                    {steps.map((step, idx) => (
                        <motion.div 
                            key={idx} 
                            className="flex gap-6 items-start relative group"
                            variants={itemVariants}
                        >
                            {/* Step Circle */}
                            <div className={`hidden sm:flex flex-shrink-0 w-12 h-12 rounded-full ${step.color} text-white items-center justify-center font-bold text-lg shadow-lg z-10 transition-transform duration-300 group-hover:scale-110`}>
                                {step.num}
                            </div>

                            {/* Content Card */}
                            <motion.div 
                                className="flex-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-slate-200 transition-all duration-300 cursor-default"
                                whileHover={{ y: -4 }}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="sm:hidden">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${step.color.replace('bg-', 'text-')} ${step.color.replace('500', '50')} border ${step.color.replace('bg-', 'border-').replace('500', '100')}`}>
                                            STEP {step.num}
                                        </span>
                                    </div>
                                    <div className={`p-2 rounded-xl ${step.color.replace('bg-', 'bg-').replace('500', '50')} ${step.color.replace('bg-', 'text-')} transition-colors duration-300 group-hover:${step.color} group-hover:text-white`}>
                                        {step.icon}
                                    </div>
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                                <p className="text-sm md:text-base text-slate-500 leading-relaxed word-keep-all">{step.desc}</p>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* FAQ CTA */}
            <motion.div 
                className="max-w-3xl mx-auto mb-12 bg-slate-50 rounded-3xl p-8 md:p-10 text-center border border-slate-100 relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
            >
                <div className="absolute -right-8 -bottom-8 text-primary opacity-[0.03] rotate-12">
                    <MessageCircleQuestion size={200} />
                </div>
                
                <h2 className="text-xl md:text-2xl font-bold mb-3 text-slate-900">궁금한 점이 있으신가요?</h2>
                <p className="text-slate-500 mb-8 text-sm md:text-base">다온뷰는 인플루언서님의 밝은 앞날을 항상 응원합니다.</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-3 relative z-10">
                    <Link href="/community/faq" className="inline-flex items-center justify-center px-8 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-sm gap-2 group">
                        자주 묻는 질문
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link href="/contact" className="inline-flex items-center justify-center px-8 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm shadow-sm">
                        실시간 1:1 문의
                    </Link>
                </div>
            </motion.div>
        </CommunitySubPageLayout>
    );
}
