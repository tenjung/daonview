'use client';

import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import DashboardPageLayout from '@/components/dashboard/DashboardPageLayout';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useDashboardViewer, type DashboardViewer } from '@/hooks/useDashboardViewer';
import { useRequestGuard } from '@/hooks/useRequestGuard';

import ReviewManagementClient from '@/components/admin/ReviewManagementClient';
import { Loader2, MessageSquare } from 'lucide-react';
import type { ManagedReview } from '@/types/reviewManagement';

export default function AdvertiserReviewsPage({ initialViewer, initialReviews = [] }: { initialViewer?: DashboardViewer; initialReviews?: ManagedReview[] }) {
    const { user, profile, isLoading } = useDashboardViewer(initialViewer);
    const beginRequest = useRequestGuard(user?.id);
    const loadedKey = useRef(initialViewer?.user.id);
    const [reviews, setReviews] = useState<ManagedReview[]>(initialReviews);
    const [loading, setLoading] = useState(!initialViewer);

    const fetchAdvertiserReviews = useCallback(async () => {
        if (!user) return;
        const isCurrent = beginRequest();
        setLoading(true);
        try {
            const response = await fetch('/api/reviews/manage', { cache: 'no-store' });
            const result = await response.json() as { reviews?: ManagedReview[]; error?: string };
            if (!isCurrent()) return;
            if (!response.ok) throw new Error(result.error || '리뷰를 불러오지 못했습니다.');
            setReviews(result.reviews || []);
        } catch (error) {
            console.error('Error fetching advertiser reviews:', error);
        } finally {
            if (isCurrent()) setLoading(false);
        }
    }, [user?.id, beginRequest]);

    useEffect(() => {
        if (!isLoading && user) {
            if (loadedKey.current === user.id) return;
            loadedKey.current = user.id;
            void fetchAdvertiserReviews();
        } else if (!isLoading && !user) {
            setLoading(false);
        }
    }, [fetchAdvertiserReviews, isLoading, user]);

    return (
        <DashboardPageLayout role="ADVERTISER" userName={profile?.company_name || profile?.nickname || '광고주'}>
                <div className="max-w-[1600px] mx-auto">
                    <DashboardPageHeader
                        icon={MessageSquare}
                        title="리뷰 작업 현황"
                        description="선정된 리뷰어들이 작성한 콘텐츠를 확인하고 관리합니다."
                    />

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
        </DashboardPageLayout>
    );
}
