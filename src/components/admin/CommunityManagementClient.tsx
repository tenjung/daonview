"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    MessageSquare,
    Filter,
    LayoutGrid,
    Search as SearchIcon,
    Trash2,
    RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { createCommunityColumns, Post } from './community-columns';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface CommunityManagementClientProps {
    initialPosts: Post[];
    initialStats: {
        total: number;
        notice: number;
        free: number;
        event: number;
        academy: number;
    };
}

export default function CommunityManagementClient({ initialPosts, initialStats }: CommunityManagementClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [stats, setStats] = useState(initialStats);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const [postsRes, noticesRes] = await Promise.all([
                supabase
                    .from('posts')
                    .select(`
                        *,
                        profiles (
                            nickname,
                            name,
                            avatar_url
                        )
                    `)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('notices')
                    .select(`
                        *,
                        profiles:profiles!author_id (
                            nickname,
                            name,
                            avatar_url
                        )
                    `)
                    .order('created_at', { ascending: false })
            ]);

            const merged = [
                ...(noticesRes.data || []).map(n => ({ ...n, user_id: n.author_id })),
                ...(postsRes.data || [])
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setPosts(merged as Post[]);
            
            const counts = merged.reduce((acc: any, post: any) => {
                acc.total++;
                const type = post.type.toLowerCase();
                if (type === '공지' || type === 'notice') acc.notice++;
                else if (type === 'free') acc.free++;
                else if (type === '이벤트' || type === 'event') acc.event++;
                else if (type.includes('academy')) acc.academy++;
                else if (type === 'faq') acc.faq++;
                else if (type === 'guide') acc.guide++;
                return acc;
            }, { total: 0, notice: 0, free: 0, event: 0, academy: 0, faq: 0, guide: 0 });
            
            setStats(counts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            toast.error('게시글 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const post = posts.find(p => p.id === id);
        if (!post) return;
        
        if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

        try {
            const isNoticeTable = ['공지', '이벤트', 'NOTICE', 'EVENT'].includes(post.type);
            const tableName = isNoticeTable ? 'notices' : 'posts';

            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('게시글이 삭제되었습니다.');
            fetchPosts();
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('삭제에 실패했습니다.');
        }
    };

    const handleMove = async (id: number, newType: string) => {
        const post = posts.find(p => p.id === id);
        if (!post) return;

        try {
            const currentIsNotice = ['공지', '이벤트', 'NOTICE', 'EVENT'].includes(post.type);
            const newIsNotice = ['공지', '이벤트', 'NOTICE', 'EVENT'].includes(newType);

            // 테이블이 바뀌는 경우 (예: 자유게시판 -> 공지사항)
            if (currentIsNotice !== newIsNotice) {
                toast.error('다른 종류의 게시판 간 이동은 현재 지원되지 않습니다. (테이블 구조 차이)');
                return;
            }

            const tableName = currentIsNotice ? 'notices' : 'posts';
            
            // 타입 변환 (notices 테이블은 한글 타입 사용)
            let finalType = newType;
            if (currentIsNotice) {
                if (newType === 'NOTICE') finalType = '공지';
                if (newType === 'EVENT') finalType = '이벤트';
            }

            const { error } = await supabase
                .from(tableName)
                .update({ type: finalType })
                .eq('id', id);

            if (error) throw error;

            toast.success('게시판이 이동되었습니다.');
            fetchPosts();
        } catch (error) {
            console.error('Error moving post:', error);
            toast.error('이동에 실패했습니다.');
        }
    };

    const filteredPosts = useMemo(() => {
        if (activeTab === 'all') return posts;
        
        return posts.filter(post => {
            const type = post.type.toUpperCase();
            switch (activeTab) {
                case 'notice':
                    return type === 'NOTICE' || type === '공지';
                case 'event':
                    return type === 'EVENT' || type === '이벤트';
                case 'free':
                    return type === 'FREE';
                case 'academy':
                    return type.includes('ACADEMY');
                case 'faq':
                    return type === 'FAQ';
                case 'guide':
                    return type === 'GUIDE';
                default:
                    return type === activeTab.toUpperCase();
            }
        });
    }, [posts, activeTab]);

    const columns = useMemo(() => createCommunityColumns({
        onDelete: handleDelete,
        onMove: handleMove
    }), [posts]);

    const statsCards = [
        { title: "전체 게시글", value: stats.total, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "공지사항", value: stats.notice, icon: RefreshCcw, color: "text-violet-600", bg: "bg-violet-50" },
        { title: "자유게시판", value: stats.free, icon: LayoutGrid, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "이벤트", value: stats.event, icon: RefreshCcw, color: "text-rose-600", bg: "bg-rose-50" },
    ];

    return (
        <div className="flex flex-col gap-8">
            {/* 통계 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((card, i) => (
                    <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-bold text-gray-500">{card.title}</CardTitle>
                            <div className={`${card.bg} ${card.color} p-2 rounded-xl group-hover:scale-110 transition-transform`}>
                                <card.icon size={18} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-gray-900">{card.value}</div>
                            <p className="text-[10px] text-gray-400 mt-1 font-medium italic">Current Statistics</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 필터 및 테이블 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl overflow-x-auto min-w-0 w-full md:w-auto mt-2">
                        {[
                            { id: 'all', label: '전체' },
                            { id: 'notice', label: '공지사항' },
                            { id: 'free', label: '자유게시판' },
                            { id: 'event', label: '이벤트' },
                            { id: 'academy', label: '아카데미' },
                            { id: 'faq', label: 'FAQ' },
                            { id: 'guide', label: '가이드' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? 'bg-white shadow-sm text-primary ring-1 ring-black/5' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <DataTable 
                    columns={columns}
                    data={filteredPosts}
                    searchKey="title"
                    searchPlaceholder="제목으로 검색..."
                    isLoading={loading}
                    enableRowSelection={true}
                />
            </div>
        </div>
    );
}
