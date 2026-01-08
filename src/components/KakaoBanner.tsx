'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ExternalLink } from 'lucide-react';

export default function KakaoBanner() {
    return (
        <section className="w-full bg-[#FEE500] overflow-hidden border-y border-[#E6CF00] relative">
            <div className="max-w-[1200px] mx-auto px-4 md:px-10 min-h-[160px] lg:min-h-[180px] flex flex-col lg:flex-row items-center justify-between relative z-10 gap-6 lg:gap-0 py-8 lg:py-0">

                {/* Left: Brand Identity & Message */}
                <div className="flex flex-col md:flex-row items-center gap-6 lg:gap-12 w-full lg:w-auto">
                    {/* Brand ID */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center lg:items-start shrink-0"
                    >
                        <span className="text-[10px] font-black text-[#3A1D1D]/40 uppercase tracking-[0.2em] mb-1">Brand Identity</span>
                        <div className="flex flex-col leading-none">
                            <span className="text-2xl lg:text-3xl font-black text-[#3A1D1D]">GROW WITH</span>
                            <span className="text-3xl lg:text-5xl font-black text-rose-600">DAONVIEW</span>
                        </div>
                    </motion.div>

                    {/* Divider (Desktop Only) */}
                    <div className="h-14 w-[1px] bg-[#3A1D1D]/10 hidden lg:block"></div>

                    {/* Message */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg lg:text-xl font-bold text-[#3A1D1D] leading-snug text-center lg:text-left whitespace-nowrap"
                    >
                        카톡 친구만 맺어도 쏟아지는<br />
                        <span className="text-rose-600 font-black italic">전용 캠페인</span>과 마케팅 비법!
                    </motion.p>
                </div>

                {/* Right: CTA Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="shrink-0"
                >
                    <motion.a
                        href="http://pf.kakao.com/_xbxhDgn/chat"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-3 bg-[#3A1D1D] text-white px-8 py-4 rounded-full font-black text-base shadow-2xl shadow-[#3A1D1D]/30 transition-all hover:bg-black whitespace-nowrap"
                    >
                        <MessageCircle className="w-5 h-5 fill-current text-[#FEE500]" />
                        다온뷰 채널 추가
                        <ExternalLink className="w-4 h-4 opacity-40" />
                    </motion.a>
                </motion.div>
            </div>

            {/* Background Decorations (High Fidelity Visuals) */}
            <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden select-none">

                {/* Floating Elements - Rose Pink & Brown */}
                <motion.div
                    animate={{ y: [0, -15, 0], x: [0, 10, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 right-[40%] text-3xl blur-[1px] opacity-40"
                >
                    💖
                </motion.div>
                <motion.div
                    animate={{ y: [0, 15, 0], x: [0, -10, 0], rotate: [0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-10 right-[45%] text-2xl blur-[0.5px] opacity-30"
                >
                    ✨
                </motion.div>

                {/* Smartphone Mockup Container */}
                <div className="absolute right-[-20px] lg:right-10 top-1/2 -translate-y-1/2 h-full flex items-center">
                    <motion.div
                        initial={{ opacity: 0, x: 50, rotate: 15 }}
                        whileInView={{ opacity: 1, x: 0, rotate: -8 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative w-[90px] lg:w-[220px] h-[160px] lg:h-[380px] bg-[#3A1D1D] rounded-[1.25rem] lg:rounded-[2.5rem] border-[3px] lg:border-[6px] border-[#3A1D1D] shadow-[0_25px_50px_-12px_rgba(58,29,29,0.5)] overflow-hidden transform perspective-1000 origin-bottom"
                    >
                        {/* Status Bar */}
                        <div className="w-full h-6 bg-[#3A1D1D] flex justify-center items-end pb-1 gap-1">
                            <div className="w-10 h-3 bg-black/20 rounded-full"></div>
                        </div>

                        {/* Screen Content - Kakao Style */}
                        <div className="w-full h-full bg-[#BACEE0] flex flex-col pt-2 px-2 overflow-hidden">
                            {/* Profile Header */}
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2 mb-3 shadow-sm border border-black/5 flex items-center gap-2">
                                <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center font-black text-white text-[10px] shrink-0 shadow-sm shadow-rose-500/30">DV</div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-[#3A1D1D] leading-none mb-0.5">다온뷰</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full flex items-center justify-center shrink-0">
                                            <div className="w-0.5 h-0.5 border-b border-r border-white rotate-45 mb-[0.2px] ml-[0.2px]"></div>
                                        </div>
                                        <span className="text-[6px] text-gray-400 font-bold">채널 구독중</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Bubbles */}
                            <div className="space-y-2">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="bg-white rounded-r-xl rounded-bl-xl p-2 max-w-[85%] shadow-sm relative"
                                >
                                    <span className="text-[7px] font-bold text-[#3A1D1D] leading-tight block">
                                        대표님! 이번 주 <span className="text-rose-500 underline underline-offset-2">신규 캠페인</span> 오픈했습니다 확인 부탁드려요! 🚀
                                    </span>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.2 }}
                                    className="bg-[#FEE500] self-end ml-auto rounded-l-xl rounded-br-xl p-2 max-w-[85%] shadow-sm"
                                >
                                    <span className="text-[7px] font-bold text-[#3A1D1D] leading-tight block">
                                        네! 지금 바로 확인하고 전용 혜택 신청할게요 😍
                                    </span>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.8 }}
                                    className="bg-white/80 rounded-xl p-2 border-2 border-rose-500/20 overflow-hidden"
                                >
                                    <div className="w-full h-12 bg-rose-50 rounded mb-1 animate-pulse flex items-center justify-center">
                                        <span className="text-[6px] text-rose-300 font-bold">PREMIUM LIST OPEN</span>
                                    </div>
                                    <div className="h-1 w-1/2 bg-gray-200 rounded shrink-0"></div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Notification Badge Floating */}
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute top-10 right-0 lg:right-10 z-20 w-12 h-12 bg-[#FEE500] rounded-2xl border-2 border-[#3A1D1D] shadow-xl flex items-center justify-center"
                    >
                        <MessageCircle className="w-7 h-7 text-[#3A1D1D] fill-current" />
                        <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#FEE500]">N</div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
