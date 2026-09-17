'use client';

import { useCallback, useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuthStore } from '@/store/authStore';
import { ADVERTISER_LINKS } from '@/constants/navigation';
import ReviewManagementClient from '@/components/admin/ReviewManagementClient';
import { Loader2, MessageSquare } from 'lucide-react';
import type { ManagedReview } from '@/types/reviewManagement';

export default function AdvertiserReviewsPage() {
    const { user, profile, isLoading } = useAuthStore();
    const [reviews, setReviews] = useState<ManagedReview[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAdvertiserReviews = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await fetch('/api/reviews/manage', { cache: 'no-store' });
            const result = await response.json() as { reviews?: ManagedReview[]; error?: string };
            if (!response.ok) throw new Error(result.error || '리뷰를 불러오지 못했습니다.');
            setReviews(result.reviews || []);
        } catch (error) {
            console.error('Error fetching advertiser reviews:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!isLoading && user) {
            void fetchAdvertiserReviews();
        } else if (!isLoading && !user) {
            setLoading(false);
        }
    }, [fetchAdvertiserReviews, isLoading, user]);

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="ADVERTISER"
                userName={profile?.company_name || profile?.nickname || '광고주'}
                links={ADVERTISER_LINKS}
            />
            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <MessageSquare className="w-8 h-8 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">리뷰 작업 현황</h1>
                            <p className="text-gray-500">선정된 리뷰어들이 작성한 콘텐츠를 확인하고 관리합니다.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-100 text-center shadow-sm">
                            <div className="text-6xl mb-6">📝</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">아직 등록된 리뷰가 없습니다</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                캠페인에 선정된 리뷰어가 리뷰를 등록하면 이곳에서 확인하실 수 있습니다.
                            </p>
                        </div>
                    ) : (
                        <ReviewManagementClient initialReviews={reviews} />
                    )}
                </div>
            </div>
        </div>
    );
}
