'use client';

import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Footer() {
    const [isExpanded, setIsExpanded] = useState(false);
    const footerRef = useRef<HTMLElement>(null);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);

        // When expanding, scroll to bottom after a short delay to allow animation
        if (!isExpanded) {
            setTimeout(() => {
                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    };

    return (
        <footer className="bg-surface border-t border-border mt-16">
            {/* Desktop Footer - Single Line */}
            <div className="hidden lg:block">
                <div className="w-[90%] max-w-[1200px] mx-auto py-2.5">
                    <div className="flex items-center justify-between">
                        {/* Left: Toggle Button */}
                        <button
                            onClick={handleToggle}
                            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors"
                        >
                            <span><strong>다온컴퍼니</strong> 사업자 정보</span>
                            {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                            )}
                        </button>

                        {/* Center: Links */}
                        <div className="flex items-center gap-5 text-xs">
                            <Link href="/intro" className="text-text-secondary hover:text-primary transition-colors">서비스소개</Link>
                            <Link href="/notice" className="text-text-secondary hover:text-primary transition-colors">공지사항</Link>
                            <Link href="/terms" className="text-text-secondary hover:text-primary transition-colors">운영정책</Link>
                            <Link href="/privacy" className="text-text-secondary hover:text-primary transition-colors">개인정보처리방침</Link>
                            <Link href="/faq" className="text-text-secondary hover:text-primary transition-colors">자주묻는질문</Link>
                            <Link href="/contact" className="text-text-secondary hover:text-primary transition-colors">문의하기</Link>
                        </div>

                        {/* Right: Logo */}
                        <div className="font-bold text-base text-primary">DAONVIEW</div>
                    </div>

                    {/* Expandable Business Info */}
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[300px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className="pt-4 border-t border-border">
                            <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mb-3">
                                <div className="flex gap-2">
                                    <span className="font-medium text-text-main min-w-[70px]">상호명</span>
                                    <span><strong>다온컴퍼니</strong></span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-medium text-text-main min-w-[70px]">대표자명</span>
                                    <span>신지호</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-medium text-text-main min-w-[70px]">전화번호</span>
                                    <span>050-71395-0204</span>
                                </div>
                                <div className="flex gap-2 col-span-2">
                                    <span className="font-medium text-text-main min-w-[70px]">주소</span>
                                    <span>경기도 부천시 소사구 양지로 229 골든IT타워 824호</span>
                                </div>
                            </div>
                            <div className="text-center text-xs text-text-secondary pt-3 border-t border-border">
                                © 2024 DAONVIEW. All rights reserved.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Footer - Minimal */}
            <div className="lg:hidden py-3 text-center">
                <div className="font-bold text-base text-primary mb-1">DAONVIEW</div>
                <div className="text-xs text-text-secondary">
                    © 2024 DAONVIEW. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
