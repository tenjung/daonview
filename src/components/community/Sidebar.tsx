"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Megaphone,
    Gift,
    UserCircle,
    GraduationCap,
    HelpCircle,
    ChevronDown,
    ChevronRight,
    BookOpen
} from "lucide-react";
import { useState } from "react";

const menuItems = [
    {
        title: "공지사항",
        href: "/community/notice",
        icon: Megaphone,
    },
    {
        title: "이벤트",
        href: "/community/event",
        icon: Gift,
    },
    {
        title: "내블로그 소개",
        href: "/community/blog-intro",
        icon: UserCircle,
    },
    {
        title: "아카데미",
        href: "/community/academy",
        icon: GraduationCap,
        subItems: [
            { title: "전체", href: "/community/academy/all" },
            { title: "광고주 칼럼", href: "/community/academy/advertiser" },
            { title: "인플루언서 칼럼", href: "/community/academy/influencer" },
        ],
    },
    {
        title: "자주묻는문의",
        href: "/faq",
        icon: HelpCircle,
    },
    {
        title: "이용가이드",
        href: "/guide",
        icon: BookOpen,
    },
];

export default function CommunitySidebar() {
    const pathname = usePathname();
    const [academyOpen, setAcademyOpen] = useState(true);

    return (
        <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-border p-4 sticky top-24">
                <Link href="/community">
                    <h2 className="text-xl font-bold mb-6 px-2 text-text-main hover:text-primary transition-colors cursor-pointer">커뮤니티</h2>
                </Link>
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.subItems && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        if (item.subItems) {
                            return (
                                <div key={item.href} className="space-y-1">
                                    <button
                                        onClick={() => setAcademyOpen(!academyOpen)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                                            ? "text-primary bg-primary/5"
                                            : "text-text-secondary hover:bg-gray-50 hover:text-text-main"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={18} />
                                            <span>{item.title}</span>
                                        </div>
                                        {academyOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>

                                    {academyOpen && (
                                        <div className="pl-9 space-y-1">
                                            {item.subItems.map((sub) => {
                                                const isSubActive = pathname === sub.href;
                                                return (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isSubActive
                                                            ? "text-primary font-medium bg-primary/5"
                                                            : "text-text-secondary hover:bg-gray-50 hover:text-text-main"
                                                            }`}
                                                    >
                                                        {sub.title}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                                    ? "text-primary bg-primary/5"
                                    : "text-text-secondary hover:bg-gray-50 hover:text-text-main"
                                    }`}
                            >
                                <Icon size={18} />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
