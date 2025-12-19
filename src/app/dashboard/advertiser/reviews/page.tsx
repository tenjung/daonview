'use client';

import AdvertiserSidebar from '@/components/AdvertiserSidebar';

export default function AdvertiserReviewsPage() {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdvertiserSidebar />
            <div className="flex-1 bg-gray-50 p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">리뷰 작업 현황</h1>
                    <p className="text-gray-500 mb-8">선정된 리뷰어들이 작성한 콘텐츠를 확인하고 관리합니다.</p>
                    
                    <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">아직 등록된 리뷰가 없습니다</h3>
                        <p className="text-gray-500">리뷰어가 콘텐츠를 등록하면 이곳에서 확인할 수 있습니다.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
