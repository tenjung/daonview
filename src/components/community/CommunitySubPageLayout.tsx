'use client';

import { ReactNode } from 'react';

interface CommunitySubPageLayoutProps {
    title: string;
    description: string;
    children: ReactNode;
    headerBgColor?: string;
    headerBorderColor?: string;
}

export default function CommunitySubPageLayout({
    title,
    description,
    children,
    headerBgColor = "bg-slate-50",
    headerBorderColor = "border-border"
}: CommunitySubPageLayoutProps) {
    return (
        <div className="bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-sm p-0 md:p-6">
            {/* Header section */}
            <div className={`md:rounded-xl border ${headerBorderColor} ${headerBgColor} py-6 md:py-8 mb-4 md:mb-6`}>
                <div className="text-center px-4 md:px-6">
                    <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1 md:mb-2">{title}</h1>
                    <p className="text-gray-500 text-xs md:text-sm">{description}</p>
                </div>
            </div>

            {/* Content area */}
            <div className="px-4 md:px-0">
                {children}
            </div>
        </div>
    );
}
