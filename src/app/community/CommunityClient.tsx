'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, PenSquare } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import BoardList from '@/components/board/BoardList';

interface CommunityClientProps {
    initialPosts: any[];
    initialType: string;
}

const typeLabels: Record<string, string> = {
    'NOTICE': '공지사항',
    'FREE': '자유게시판',
    'EVENT': '이벤트',
    'ACADEMY': '아카데미',
    'FAQ': '자주묻는질문',
    'GUIDE': '가이드'
};

const typeHrefs: Record<string, string> = {
    'NOTICE': '/community/notice',
    'FREE': '/community/free',
    'EVENT': '/community/event',
    'ACADEMY': '/community/academy',
    'FAQ': '/community/faq',
    'GUIDE': '/community/guide'
};

export default function CommunityClient({ initialPosts, initialType }: CommunityClientProps) {
    const { user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [posts, setPosts] = useState(initialPosts);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentType, setCurrentType] = useState(initialType);

    // Props 동기화
    useEffect(() => {
        setPosts(initialPosts);
        setCurrentType(initialType);
    }, [initialPosts, initialType]);

    const isLoggedIn = !!user;

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.profiles?.nickname || post.profiles?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentLabel = typeLabels[currentType] || '커뮤니티';
    const currentHref = typeHrefs[currentType] || '/community';

    return (
        <div className="min-h-screen bg-gray-50/30 py-8">
            <div className="container max-w-[1400px] mx-auto px-4">
                {/* 페이지 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">커뮤니티</h1>
                    <p className="text-gray-500">다양한 주제로 소통하고 정보를 공유하세요</p>
                </div>

                {/* 컨텐츠 영역 */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    {/* 카테고리 헤더 */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{currentLabel}</h2>
                            <p className="text-gray-500 mt-1 text-sm">
                                {currentType === 'NOTICE' && '중요한 공지사항을 확인하세요'}
                                {currentType === 'FREE' && '자유롭게 이야기를 나누는 공간입니다'}
                                {currentType === 'EVENT' && '진행 중인 이벤트를 확인하세요'}
                                {currentType === 'ACADEMY' && '유용한 정보와 노하우를 공유합니다'}
                                {currentType === 'FAQ' && '자주 묻는 질문과 답변을 확인하세요'}
                                {currentType === 'GUIDE' && '서비스 이용 가이드를 확인하세요'}
                            </p>
                        </div>
                        {isLoggedIn && currentType !== 'NOTICE' && currentType !== 'FAQ' && currentType !== 'GUIDE' && (
                            <Link
                                href={`/community/write?type=${currentType}`}
                                className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 gap-2"
                            >
                                <PenSquare size={18} />
                                글쓰기
                            </Link>
                        )}
                    </div>

                    {/* 검색 */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="제목이나 작성자로 검색"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* 게시글 목록 */}
                    <BoardList
                        items={filteredPosts}
                        title={currentLabel}
                        viewAllHref={currentHref}
                        isStandalone={true}
                    />
                </div>
            </div>
        </div>
    );
}
