import { createServerClient } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Eye } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = createServerClient();

    // Fetch post data from posts table
    const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !post) {
        console.error('Post not found or error:', error);
        return notFound();
    }

    // Increment view count
    await supabase
        .from('posts')
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq('id', id);

    // Determine back link based on post type
    const getBackLink = () => {
        switch (post.type) {
            case 'FREE': return '/community/free';
            case 'BLOG_INTRO': return '/community/blog-intro';
            case 'ACADEMY_ADVERTISER': return '/community/academy/advertiser';
            case 'ACADEMY_INFLUENCER': return '/community/academy/influencer';
            default: return '/community';
        }
    };

    const getPostTypeLabel = () => {
        switch (post.type) {
            case 'FREE': return '자유게시판';
            case 'BLOG_INTRO': return '내 블로그 소개';
            case 'ACADEMY_ADVERTISER': return '광고주 칼럼';
            case 'ACADEMY_INFLUENCER': return '인플루언서 칼럼';
            default: return '게시글';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 md:py-12">
            <div className="container max-w-4xl mx-auto px-0 md:px-4">
                {/* Back Button */}
                <Link 
                    href={getBackLink()} 
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors py-4 px-6 md:px-0 md:mb-8 font-medium"
                >
                    <ArrowLeft size={18} />
                    목록으로 돌아가기
                </Link>

                {/* Post Content */}
                <div className="bg-white sm:rounded-2xl sm:border border-gray-100 md:border-gray-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-gray-100 md:border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 text-xs rounded-lg font-bold bg-slate-100 text-slate-600">
                                {getPostTypeLabel()}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 leading-tight">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <User size={16} />
                                <span>관리자</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>
                                    {new Date(post.created_at).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Eye size={16} />
                                <span>{(post.view_count || 0) + 1}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8 bg-white">
                        <div 
                            className="prose prose-lg max-w-none
                                prose-headings:font-bold prose-headings:text-gray-900
                                prose-p:text-gray-700 prose-p:leading-relaxed
                                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-gray-900 prose-strong:font-bold
                                prose-ul:list-disc prose-ol:list-decimal
                                prose-li:text-gray-700
                                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                                prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                                prose-pre:bg-gray-900 prose-pre:text-gray-100
                                prose-img:rounded-xl prose-img:shadow-md"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="mt-8 flex justify-center">
                    <Link 
                        href={getBackLink()}
                        className="btn btn-primary px-8 py-3"
                    >
                        목록으로
                    </Link>
                </div>
            </div>
        </div>
    );
}
