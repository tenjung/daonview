'use client';

// ... imports
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import AdvertiserSidebar from '@/components/AdvertiserSidebar';
import AdvertiserCampaignTable from '@/components/AdvertiserCampaignTable';

function AdvertiserCampaignsContent() {
    const searchParams = useSearchParams();
    const status = searchParams?.get('status');

    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const getPageTitle = () => {
        switch (status) {
            case 'RECRUITING': return '모집/진행 중인 캠페인';
            case 'COMPLETED': return '완료된 캠페인';
            case 'DRAFT': return '임시저장함';
            default: return '전체 캠페인 목록';
        }
    };

    const getPageDescription = () => {
        switch (status) {
            case 'RECRUITING': return '리뷰어 모집 중이거나 진행 중인 캠페인 (승인 대기 포함)';
            case 'COMPLETED': return '모든 과정이 마무리된 캠페인입니다.';
            case 'DRAFT': return '작성 중인 캠페인입니다. 이어서 작성하고 등록하세요.';
            default: return '등록한 모든 캠페인을 관리합니다.';
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [status]);

    const fetchCampaigns = async () => {
        setLoading(true);
        console.log('Fetching campaigns... Status:', status);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error('User not logged in');
            setLoading(false);
            return;
        }

        console.log('User ID:', user.id);

        let query = supabase
            .from('campaigns')
            .select('*, applications(count)')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

        if (status === 'RECRUITING') {
            // [수정 사항 적용]: PENDING도 여기서 같이 보여줌
            query = query.in('status', ['PENDING', 'RECRUITING', 'ONGOING']);
        } else if (status === 'COMPLETED') {
            query = query.eq('status', 'COMPLETED');
        } else if (status === 'DRAFT') {
            query = query.eq('status', 'DRAFT');
        } else {
            // 전체 보기: 필터 없음 (모든 상태 조회)
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching campaigns:', error);
        } else {
            console.log('Campaigns fetched:', data);
            setCampaigns(data || []);
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdvertiserSidebar />

            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
                            <p className="text-gray-500 mt-1">{getPageDescription()}</p>
                        </div>
                        <Link href="/dashboard/campaign/new" className="btn btn-primary text-sm shadow-md hover:shadow-lg transition-all">+ 캠페인 신규 등록</Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-500">데이터를 불러오는 중입니다...</p>
                        </div>
                    ) : (
                        <AdvertiserCampaignTable initialCampaigns={campaigns} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdvertiserCampaignsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdvertiserCampaignsContent />
        </Suspense>
    );
}
