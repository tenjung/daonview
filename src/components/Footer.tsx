'use client';

import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import CompanyInfo from '@/components/CompanyInfo';
import BrandLogo from '@/components/BrandLogo';

export default function Footer() {
    const [isExpanded, setIsExpanded] = useState(false);

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
        <footer className="relative z-50 bg-white border-t border-border">
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
                            <Link href="/partner/intro" className="text-text-secondary hover:text-primary transition-colors">광고주 파트너십</Link>
                            <Link href="/partner" className="text-text-secondary hover:text-primary transition-colors">숏폼 체험단</Link>
                            <Link href="/partner/brand-video" className="text-text-secondary hover:text-primary transition-colors">브랜드 영상제작</Link>
                            <Link href="/community/notice" className="text-text-secondary hover:text-primary transition-colors">공지사항</Link>
                            <Link href="/terms" className="text-text-secondary hover:text-primary transition-colors">운영정책</Link>
                            <Link href="/privacy" className="text-text-secondary hover:text-primary transition-colors">개인정보처리방침</Link>
                            <Link href="/community/faq" className="text-text-secondary hover:text-primary transition-colors">자주묻는질문</Link>
                            <Link href="/contact" className="text-text-secondary hover:text-primary transition-colors">문의하기</Link>
                        </div>

                        {/* Right: Logo */}
                        <BrandLogo size="md" />
                    </div>

                    {/* Expandable Business Info */}
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[300px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className="pt-4 border-t border-border">
                            <CompanyInfo variant="footer" className="mb-3" showEmail={false} />
                            <div className="text-center text-xs text-text-secondary pt-3 border-t border-border">
                                © 2024 DAONVIEW. All rights reserved.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Footer - Minimal */}
            <div className="lg:hidden py-3 text-center flex flex-col items-center">
                <BrandLogo size="md" className="mb-1" />
                <div className="text-xs text-text-secondary">
                    © 2024 DAONVIEW. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
