import { supabase } from '@/lib/supabaseClient';
import AdvertiserSidebar from '@/components/AdvertiserSidebar';
import { UnifiedAdvertiserCampaigns } from '@/components/admin/UnifiedAdvertiserCampaigns';
import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import UnifiedAdvertiserPage from './UnifiedAdvertiserPage';

// Next.js 캐싱 비활성화
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdvertiserCampaignsPage() {
    // 세션 정보 대신 쿠키나 다른 방식으로 사용자 ID를 가져와야 할 수도 있습니다. 
    // 여기서는 기존 서버 컴포넌트 패턴을 따릅니다.
    // 하지만 현재 user 정보를 가져오는 것은 클라이언트 사이드 authStore에 의존하고 있어
    // 데이터 페칭을 클라이언트 컴포넌트로 넘기는 것이 안전할 수 있습니다.
    
    // 하지만 일관성을 위해 클라이언트 컴포넌트로 구조를 바꿉니다.
    // AdvertiserCampaignsContent를 UnifiedAdvertiserPage로 리팩토링합니다.

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdvertiserSidebar />

            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 italic">
                                <Megaphone className="w-8 h-8 text-primary" />
                                My Campaigns
                            </h1>
                            <p className="text-gray-500 mt-1 font-medium">
                                등록하신 모든 캠페인을 효율적으로 관리하세요.
                            </p>
                        </div>
                        <Link 
                            href="/dashboard/campaign/new" 
                            className="bg-primary text-white px-5 py-3 rounded-2xl font-bold shadow-sm hover:shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            + 새 캠페인 등록
                        </Link>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <UnifiedAdvertiserPage />
                    </div>
                </div>
            </div>
        </div>
    );
}

