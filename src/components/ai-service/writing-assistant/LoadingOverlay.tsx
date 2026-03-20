"use client";

import { Sparkles } from "lucide-react";

interface LoadingOverlayProps {
    isLoading: boolean;
    loadingMsg: string;
}

export default function LoadingOverlay({ isLoading, loadingMsg }: LoadingOverlayProps) {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with Glassmorphism */}
            <div className="absolute inset-0 bg-white/20 backdrop-blur-xl animate-in fade-in duration-500" />

            {/* Animated Gradient Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] [animation-delay:1s] animate-pulse" />

            {/* Loading Card */}
            <div className="relative bg-white/80 backdrop-blur-2xl p-12 rounded-[3.5rem] border border-white/50 shadow-[0_40px_100px_-20px_rgba(225,29,72,0.15)] flex flex-col items-center justify-center gap-8 max-w-md w-full text-center animate-in zoom-in-95 duration-500 transition-all overflow-hidden">
                {/* Top Shine Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                <div className="relative select-none">
                    {/* Multi-layered Orbital Rings with Gradients */}
                    <div className="absolute inset-0 -m-6 rounded-full border-2 border-primary/10 animate-[spin_4s_linear_infinite]" />
                    <div className="absolute inset-0 -m-10 rounded-full border border-indigo-200/30 animate-[spin_8s_linear_infinite_reverse]" />

                    {/* Main Gradient Spinner */}
                    <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-primary via-rose-400 to-indigo-500 animate-spin shadow-lg">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner">
                            <Sparkles className="text-primary animate-pulse" size={44} />
                        </div>
                    </div>

                    {/* Floating Particles (Decor) */}
                    <div className="absolute -top-2 -right-2 w-3 h-3 bg-primary rounded-full animate-ping" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.5s]" />
                </div>

                <div className="space-y-5 relative z-10">
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-main to-indigo-900 tracking-tight">AI가 열심히 분석 중입니다</h3>
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-text-secondary font-semibold text-sm leading-relaxed whitespace-pre-line">{loadingMsg}</p>

                        {/* Progressive Dots */}
                        <div className="flex gap-2.5 mt-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                        </div>
                    </div>
                </div>

                {/* Bottom Blur Decor */}
                <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            </div>
        </div>
    );
}
