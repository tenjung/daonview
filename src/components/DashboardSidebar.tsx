'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface SidebarLink {
    href: string;
    label: string;
    active?: boolean;
}

interface DashboardSidebarProps {
    userType: 'INFLUENCER' | 'ADVERTISER' | 'ADMIN';
    userName: string;
    links: SidebarLink[];
}

export default function DashboardSidebar({ userType, userName, links }: DashboardSidebarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const userTypeLabel = {
        INFLUENCER: 'INFLUENCER',
        ADVERTISER: 'ADVERTISER',
        ADMIN: 'ADMIN'
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden fixed top-[80px] left-4 z-50 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors"
                aria-label="메뉴"
            >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        w-[260px] bg-white border-r border-border p-8 flex flex-col shrink-0
        fixed lg:static top-0 left-0 h-screen z-40
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="mb-8 pb-6 border-b border-border">
                    <div className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-1">
                        {userTypeLabel[userType]}
                    </div>
                    <div className="text-lg font-bold text-text-main">{userName} 님</div>
                </div>
                <nav className="flex flex-col gap-2 flex-1">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${link.active
                                    ? 'bg-rose-50 text-primary'
                                    : 'text-gray-500 hover:bg-rose-50 hover:text-primary'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </aside>
        </>
    );
}
