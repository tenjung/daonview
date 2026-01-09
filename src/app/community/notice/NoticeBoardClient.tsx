"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Pin, PenSquare } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BoardList from "@/components/board/BoardList";

interface NoticeBoardClientProps {
    initialPosts: any[];
}

export default function NoticeBoardClient({ initialPosts }: NoticeBoardClientProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [isAdmin, setIsAdmin] = useState(false);

    // initialPosts가 변경될 때마다 posts 상태 업데이트
    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            setIsAdmin(profile?.role === 'ADMIN');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="text-primary" size={24} />
                        공지사항
                    </h1>
                    <p className="text-gray-500 mt-1">다온뷰의 새로운 소식과 안내를 확인하세요.</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/community/write?type=NOTICE"
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 gap-2"
                    >
                        <PenSquare size={18} />
                        공지 작성
                    </Link>
                )}
            </div>

            {/* 목록 */}
            <BoardList 
                items={posts} 
                title="공지사항" 
                viewAllHref="/community/notice" 
                isStandalone={true} 
            />
        </div>
    );
}
