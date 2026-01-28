'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, User, Eye } from 'lucide-react';
import { ReactNode } from 'react';

interface PostDetailLayoutProps {
    backLink: string;
    backLabel?: string;
    typeLabel: string;
    typeColor?: string;
    isPinned?: boolean;
    title: string;
    author?: string;
    createdAt: string;
    viewCount: number;
    children: ReactNode;
    extraHeader?: ReactNode;
}

export default function PostDetailLayout({
    backLink,
    backLabel = '목록으로',
    typeLabel,
    typeColor,
    isPinned,
    title,
    author = '관리자',
    createdAt,
    viewCount,
    children,
    extraHeader
}: PostDetailLayoutProps) {
    return (
        <div className="max-w-5xl pb-10">
            {/* Back Button & Actions */}
            <div className="mb-3 flex items-center justify-between gap-4">
                <Link
                    href={backLink}
                    className="inline-flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors text-sm font-semibold"
                >
                    <ArrowLeft size={16} />
                    {backLabel}
                </Link>
                {extraHeader && <div className="flex-shrink-0">{extraHeader}</div>}
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Section */}
                <div className="px-5 py-5 md:px-7 md:py-6 pb-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-[9px] rounded font-bold border ${typeColor || 'bg-gray-50 text-gray-400 border-gray-100'
                            } uppercase tracking-tight`}>
                            {typeLabel}
                        </span>
                        {isPinned && (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-500 border border-rose-100 rounded text-[9px] font-bold">📌 고정</span>
                        )}
                    </div>

                    <h1 className="text-lg md:text-xl font-black text-gray-900 mb-3 leading-snug">
                        {title}
                    </h1>

                    <div className="flex items-center gap-4 text-[11px] text-gray-400 pb-5 border-b border-gray-50">
                        <div className="flex items-center gap-1.5 font-medium">
                            <User size={12} />
                            <span>{author}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                            <Calendar size={12} />
                            <span>{createdAt}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                            <Eye size={12} />
                            <span>{viewCount}</span>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-5 py-6 md:px-7 md:py-7 pt-4 text-gray-700">
                    {children}
                </div>
            </div>
        </div>
    );
}
