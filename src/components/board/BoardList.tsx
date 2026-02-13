'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BoardItem {
    id: string;
    type: string;
    title: string;
    content?: string;
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
    itemHrefPrefix?: string;
    showThumbnails?: boolean;
    hideBadge?: boolean;
    className?: string;
}

export default function BoardList({
    title,
    icon,
    items,
    viewAllHref,
    isStandalone = false,
    itemHrefPrefix,
    showThumbnails = false,
    hideBadge = false,
    className
}: BoardListProps) {
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
        <section className={`${containerStyles} ${className || ''}`}>
            <div className={isStandalone ? "w-full" : "container max-w-[1240px] mx-auto px-0 md:px-6"}>
                <div className={`${isStandalone ? "bg-transparent sm:bg-white" : "bg-white sm:rounded-2xl sm:border sm:border-border sm:p-10 sm:shadow-sm"} p-0 md:p-4`}>
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
                            {items.map((item) => {
                                const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
                                const thumbnail = imgMatch ? imgMatch[1] : null;

                                return (
                                    <Link key={item.id} href={`${itemHrefPrefix || viewAllHref}/${item.id}`}>
                                         <li className={`flex gap-3 md:gap-4 group transition-all cursor-pointer ${showThumbnails ? 'py-4 md:py-5 px-3 md:px-4 items-start gap-4 md:gap-6 hover:bg-slate-50/50' : 'py-3 md:py-3.5 px-3 md:px-4 items-center hover:bg-slate-50'}`}>

                                             {/* 썸네일 영역 (컬럼 전용) */}
                                             {showThumbnails && (
                                                 <div className="hidden sm:block w-24 h-18 md:w-40 md:h-28 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm transition-shadow group-hover:shadow-md">
                                                     {thumbnail ? (
                                                         <img
                                                             src={thumbnail}
                                                             alt={item.title}
                                                             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                         />
                                                     ) : (
                                                         <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-1">
                                                             <div className="text-[10px] font-bold">DAONVIEW</div>
                                                         </div>
                                                     )}
                                                 </div>
                                             )}

                                             <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-1.5 md:gap-6">
                                                 <div className="flex-1 min-w-0">
                                                     <div className="flex items-center gap-2 mb-0.5 overflow-hidden">
                                                         {!hideBadge && (
                                                             <div className={`px-1.5 py-0.5 text-[9px] md:text-[10px] rounded-md md:rounded-lg font-bold flex-shrink-0 ${
                                                                 (item.type?.toUpperCase() === 'EVENT' || item.type === '이벤트')
                                                                     ? 'bg-orange-100 text-orange-600'
                                                                     : (item.type?.toUpperCase() === 'NOTICE' || item.type === '공지' || item.type === '업데이트')
                                                                         ? 'bg-blue-100 text-blue-600'
                                                                         : (item.type?.toUpperCase() === 'ACADEMY_ADVERTISER')
                                                                             ? 'bg-blue-100 text-blue-600'
                                                                             : (item.type?.toUpperCase() === 'ACADEMY_INFLUENCER')
                                                                                 ? 'bg-rose-100 text-rose-600'
                                                                                 : 'bg-slate-100 text-slate-500'
                                                                 }`}>
                                                                 {item.type?.toUpperCase() === 'NOTICE' || item.type === '공지' ? '공지' :
                                                                     item.type?.toUpperCase() === 'EVENT' || item.type === '이벤트' ? '이벤트' :
                                                                         item.type?.toUpperCase() === 'FREE' ? '자유' :
                                                                             item.type === '업데이트' ? '소식' :
                                                                                 item.type?.toUpperCase() === 'ACADEMY_ADVERTISER' ? '광고주' :
                                                                                     item.type?.toUpperCase() === 'ACADEMY_INFLUENCER' ? '인플루언서' :
                                                                                         item.type?.toUpperCase()?.includes('ACADEMY') ? '정보' : '정보'}
                                                             </div>
                                                         )}
                                                         {!showThumbnails && (
                                                             <div className="text-[15px] md:text-[17px] font-medium md:font-semibold text-text-main group-hover:text-primary transition-colors truncate">
                                                                 {item.title}
                                                             </div>
                                                         )}
                                                     </div>

                                                     {showThumbnails && (
                                                         <>
                                                             <div className="text-[15px] md:text-lg font-medium md:font-semibold text-text-main group-hover:text-primary transition-colors truncate mb-1">
                                                                 {item.title}
                                                             </div>
                                                             <div
                                                                 className="text-[11px] md:text-sm text-slate-400 md:text-slate-500 line-clamp-1 md:line-clamp-2 leading-relaxed"
                                                                 dangerouslySetInnerHTML={{
                                                                     __html: item.content?.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'
                                                                 }}
                                                             />
                                                         </>
                                                     )}
                                                 </div>

                                                 {/* 메타 정보 (작성자, 날짜, 조회수) */}
                                                 <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 text-[11px] md:text-[13px] text-slate-300 md:text-slate-400 whitespace-nowrap">
                                                     <div className="flex items-center gap-2 md:gap-3">
                                                         <span className="inline text-slate-300">{formatDate(item.created_at)}</span>
                                                         <span className="w-px h-2 bg-slate-100 md:hidden" />
                                                         {(item.profiles?.nickname || item.profiles?.name || item.author) && (
                                                             <span className="truncate max-w-[80px] md:max-w-[100px] font-medium text-slate-400 md:text-slate-500">
                                                                 {item.profiles?.nickname || item.profiles?.name || item.author}
                                                             </span>
                                                         )}
                                                         <span className="w-px h-2 bg-slate-100 md:hidden" />
                                                         <span className="text-[10px] md:text-xs">👁️ {item.view_count || 0}</span>
                                                     </div>
                                                     <ChevronRight className={`hidden md:block w-4 h-4 text-slate-200 group-hover:text-primary transition-colors ${showThumbnails ? 'hidden sm:block' : ''}`} />
                                                 </div>
                                             </div>
                                         </li>
                                     </Link>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}
