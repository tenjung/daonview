'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import CampaignCard from '@/components/CampaignCard';
import CampaignSkeleton from '@/components/CampaignSkeleton';
import { Star, MapPin, Zap, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { mapCampaignToCard } from '@/lib/campaignUtils';

export default function RecommendedCampaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileData || profileData.role !== 'INFLUENCER') {
        router.push('/');
        return;
      }

      setProfile(profileData);

      // 1. Fetch campaigns that match user interests or platforms
      // We'll fetch active campaigns and then sort/filter them in memory for better UX
      const { data: campaignData, error } = await supabase
        .from('campaigns')
        .select('*')
        .neq('status', 'COMPLETED')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        setLoading(false);
        return;
      }

      // 2. Calculate Recommendation Scores
      const scoredCampaigns = (campaignData || []).map(campaign => {
        let score = 0;
        let reasons: string[] = [];

        // Category Match (Priority: 40 pts)
        if (profileData.interests?.includes(campaign.category)) {
          score += 40;
          reasons.push('관심 분야');
        }

        // Platform Match (Priority: 30 pts)
        if (profileData.preferred_platforms?.includes(campaign.platform)) {
          score += 30;
          reasons.push('선호 플랫폼');
        }

        // Region Match (Priority: 30 pts)
        // Check if campaign region matches any of the preferred regions
        if (campaign.type === 'VISIT' && campaign.region) {
          const regionMatch = profileData.preferred_regions?.some((r: string) => 
            campaign.region.includes(r) || r === 'nationwide'
          );
          if (regionMatch) {
            score += 30;
            reasons.push('선호 지역');
          }
        } else if (campaign.type === 'DELIVERY') {
           // Delivery campaigns are generally highly recommended if other filters match
           score += 10;
           reasons.push('배송형');
        }

        return { ...campaign, score, reasons };
      });

      // 3. Filter out zero score campaigns and sort by score
      const filtered = scoredCampaigns
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score);

      setCampaigns(filtered);
      setLoading(false);
    }

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto py-12 px-4">
        <div className="flex flex-col gap-2 mb-8">
          <div className="h-10 w-64 bg-slate-100 animate-pulse rounded-lg" />
          <div className="h-4 w-96 bg-slate-50 animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <CampaignSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto py-12 px-4">
      <div className="mb-10 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 rounded-full text-amber-600 text-xs font-bold mb-4">
          <Zap size={14} className="fill-amber-600" />
          <span>인공지능 맞춤 추천</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          {profile?.nickname || '회원'}님을 위한 맞춤 캠페인
        </h1>
        <p className="text-gray-500">
          설정하신 관심사와 플랫폼을 기반으로 당첨 확률이 높은 캠페인을 선정했습니다.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
            <Info size={32} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">맞춤 캠페인이 아직 없어요</h3>
          <p className="text-gray-500 mb-8">프로필의 관심사를 수정하면 더 많은 추천을 받을 수 있습니다.</p>
          <button 
            onClick={() => router.push('/profile/edit')}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
          >
            프로필 수정하러 가기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="relative group">
              {/* Match Badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm flex items-center gap-1 border border-amber-100 text-amber-600">
                  <Star size={10} className="fill-amber-500" />
                  <span>{Math.round(campaign.score)}% 매칭</span>
                </div>
              </div>
              
              <CampaignCard {...mapCampaignToCard(campaign)} />
              
              {/* Hover Reason Tooltip */}
              <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm text-white p-2 rounded-lg text-[10px] pointer-events-none transform translate-y-1 group-hover:translate-y-0 duration-300">
                <div className="font-bold mb-1">추천 이유:</div>
                <div className="flex flex-wrap gap-1">
                  {campaign.reasons.map((reason: string, idx: number) => (
                    <span key={idx} className="bg-white/20 px-1.5 py-0.5 rounded">#{reason}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
