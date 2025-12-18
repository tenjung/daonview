"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, PenSquare } from "lucide-react";
import { supabase } from "@/lib/supabaseClient"

interface EventBoardClientProps {
    initialPosts: any[];
}

export default function EventBoardClient({ initialPosts }: EventBoardClientProps) {
    const [isAdmin, setIsAdmin] = useState(false);

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
                        <Gift className="text-primary" size={24} />
                        이벤트
                    </h1>
                    <p className="text-gray-500 mt-1">다온뷰 인플루언서들을 위한 특별한 소식!</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/community/write?type=EVENT"
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 gap-2"
                    >
                        <PenSquare size={18} />
                        이벤트 작성
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {initialPosts.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-2xl border border-gray-100 text-center text-gray-400">
                        <Gift size={48} className="mx-auto text-gray-100 mb-4" />
                        진행 중인 이벤트가 없습니다.
                    </div>
                ) : (
                    initialPosts.map((post) => (
                        <Link
                            key={post.id}
                            href={`/community/${post.id}`}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase">
                                        Active
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-2">
                                    {post.title}
                                </h3>
                                <div
                                    className="text-gray-500 text-sm line-clamp-2"
                                    dangerouslySetInnerHTML={{ __html: post.content.replace(/<[^>]*>?/gm, '') }}
                                />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
