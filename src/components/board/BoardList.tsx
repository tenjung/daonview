'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BoardItem {
    id: string;
    type: string;
    title: string;
    created_at: string;
    author?: string;
    profiles?: {
        nickname?: string;
        name?: string;
    };
    view_count?: number;
}

interface BoardListProps {
    title: string;
    icon?: string;
    items: BoardItem[];
    viewAllHref: string;
    isStandalone?: boolean;
}

export default function BoardList({ title, icon, items, viewAllHref, isStandalone = false }: BoardListProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr)
            .toLocaleDateString('ko-KR')
            .replace(/\. /g, '.')
            .replace(/\.$/, '');
    };

    const containerStyles = isStandalone 
        ? "py-0 bg-transparent" 
        : "py-10 md:py-20 bg-gradient-to-b from-white to-rose-50/30";

    return (
        <section className={containerStyles}>
            <div className={isStandalone ? "w-full" : "container max-w-[1200px] mx-auto px-0 sm:px-4 md:px-10"}>
                <div className={`${isStandalone ? "bg-transparent sm:bg-white" : "bg-white sm:rounded-2xl sm:border sm:border-border sm:p-10 sm:shadow-sm"} p-4`}>
                    {/* Header */}
                    {!isStandalone && (
                        <div className="flex justify-between items-center mb-6 sm:mb-8 border-b border-gray-100 pb-4 sm:pb-6 px-4 sm:px-0">
                            <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                                {title} {icon && <span className="text-primary">{icon}</span>}
                            </h2>
                            <Link 
                                href={viewAllHref} 
                                className="text-sm font-bold text-gray-400 hover:text-primary transition-colors flex items-center"
                            >
                                전체보기 <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}

                    {/* List */}
                    {items.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            등록된 게시물이 없습니다.
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {items.map((item) => (
                                <Link key={item.id} href={`${viewAllHref}/${item.id}`}>
                                    <li className="flex items-center gap-3 sm:gap-4 py-4 px-4 sm:px-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
                                                <div className={`px-2 py-0.5 text-[10px] sm:text-xs rounded-lg font-bold flex-shrink-0 ${item.type === '이벤트' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {item.type === 'NOTICE' ? '공지' : item.type === 'EVENT' ? '이벤트' : item.type === 'FREE' ? '자유' : '정보'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
                                                    <span>{formatDate(item.created_at)}</span>
                                                    {(item.profiles?.nickname || item.profiles?.name || item.author) && (
                                                        <>
                                                            <span className="text-[10px] opacity-30">•</span>
                                                            <span className="truncate max-w-[80px] sm:max-w-[120px]">{item.profiles?.nickname || item.profiles?.name || item.author}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-base sm:text-lg font-bold text-text-main group-hover:text-primary transition-colors truncate">
                                                {item.title}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-xs text-slate-300">
                                            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-primary transition-colors" />
                                            {item.view_count !== undefined && (
                                                <span className="text-[10px] sm:text-xs">👁️ {item.view_count}</span>
                                            )}
                                        </div>
                                    </li>
                                </Link>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}
