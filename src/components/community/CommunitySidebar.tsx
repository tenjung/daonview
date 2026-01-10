'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
    MessageSquare,
    Bell,
    Calendar,
    GraduationCap,
    HelpCircle,
    BookOpen,
    ChevronRight
} from 'lucide-react';

const categories = [
    {
        id: 'notice',
        name: '공지사항',
        icon: <Bell className="w-5 h-5" />,
        href: '/community/notice',
        type: 'NOTICE'
    },
    {
        id: 'free',
        name: '자유게시판',
        icon: <MessageSquare className="w-5 h-5" />,
        href: '/community/free',
        type: 'FREE'
    },
    {
        id: 'event',
        name: '이벤트',
        icon: <Calendar className="w-5 h-5" />,
        href: '/community/event',
        type: 'EVENT'
    },
    {
        id: 'academy',
        name: '아카데미',
        icon: <GraduationCap className="w-5 h-5" />,
        href: '/community/academy',
        type: 'ACADEMY',
        subMenus: [
            { name: '광고주 칼럼', href: '/community/academy/advertiser' },
            { name: '인플루언서 칼럼', href: '/community/academy/influencer' },
        ]
    },
    {
        id: 'faq',
        name: '자주묻는질문',
        icon: <HelpCircle className="w-5 h-5" />,
        href: '/community/faq',
        type: 'FAQ'
    },
    {
        id: 'guide',
        name: '가이드',
        icon: <BookOpen className="w-5 h-5" />,
        href: '/community/guide',
        type: 'GUIDE'
    }
];

export default function CommunitySidebar() {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = useState<string[]>(['academy']); // 기본적으로 아카데미는 열어둠

    const toggleMenu = (id: string) => {
        setOpenMenus(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const isActive = (href: string) => {
        return pathname === href;
    };

    const isParentActive = (item: any) => {
        if (pathname === item.href) return true;
        if (item.subMenus?.some((sub: any) => pathname.startsWith(sub.href))) return true;
        return false;
    };

    return (
        <aside className="w-full lg:w-64 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit sticky top-[100px]">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">💬</span>
                커뮤니티
            </h2>

            <nav className="space-y-1.5">
                {categories.map((category) => {
                    const active = isParentActive(category);
                    const isOpen = openMenus.includes(category.id);
                    const hasSubMenus = category.subMenus && category.subMenus.length > 0;

                    return (
                        <div key={category.id} className="space-y-1">
                            <div className="relative group">
                                <Link
                                    href={category.href}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${active
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={active ? 'text-white' : 'text-gray-400 group-hover:text-primary transition-colors'}>
                                            {category.icon}
                                        </span>
                                        <span className={`text-sm ${active ? 'font-bold' : 'font-semibold'}`}>{category.name}</span>
                                    </div>
                                    {hasSubMenus && (
                                        <div
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleMenu(category.id);
                                            }}
                                            className="p-1 hover:bg-white/20 rounded-md transition-colors"
                                        >
                                            <ChevronRight
                                                className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                                            />
                                        </div>
                                    )}
                                </Link>
                                {!hasSubMenus && (
                                    <ChevronRight
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${active ? 'text-white/50' : 'text-gray-300'}`}
                                    />
                                )}
                            </div>

                            {/* 하위 메뉴 */}
                            {hasSubMenus && isOpen && (
                                <div className="ml-4 pl-5 border-l-2 border-gray-100 space-y-1 py-1 my-1">
                                    {category.subMenus.map((sub) => (
                                        <Link
                                            key={sub.href}
                                            href={sub.href}
                                            className={`block px-4 py-2.5 text-sm rounded-lg transition-all ${isActive(sub.href)
                                                ? 'text-primary font-bold bg-rose-50'
                                                : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                                                }`}
                                        >
                                            {sub.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* 하단 안내 */}
            <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 leading-relaxed">
                    💡 커뮤니티 이용 시 <br />
                    <span className="text-gray-600 font-medium">타인을 존중</span>하고 <br />
                    <span className="text-gray-600 font-medium">건전한 소통</span>을 부탁드립니다.
                </p>
            </div>
        </aside>
    );
}
