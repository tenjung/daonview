'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import CampaignCard from '@/components/CampaignCard';
import CampaignSkeleton from '@/components/CampaignSkeleton';
import { Star, MapPin, Zap, Info, Smartphone, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { mapCampaignToCard } from '@/lib/campaignUtils';
import { Badge } from '@/components/ui/badge';

export default function RecommendedCampaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. 유저 세션 확인 (매우 빠름)
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // 2. 프로필과 캠페인 데이터를 병렬로 호출 (속도 개선 핵심)
        const [profileResponse, campaignResponse] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('campaigns').select('*').neq('status', 'COMPLETED').order('created_at', { ascending: false })
        ]);

        const profileData = profileResponse.data;
        const campaignData = campaignResponse.data;

        if (profileResponse.error || !profileData || profileData.role !== 'INFLUENCER') {
          router.push('/');
          return;
        }

        if (campaignResponse.error) {
          throw campaignResponse.error;
        }

        setProfile(profileData);

        // 3. 추천 점수 계산 최적화
        const interests = new Set(profileData.interests || []);
        const platforms = new Set(profileData.preferred_platforms || []);
        const regions = profileData.preferred_regions || [];

        const filtered = (campaignData || [])
          .map(campaign => {
            let score = 0;
            const reasons: string[] = [];

            // 카테고리 매칭
            if (interests.has(campaign.category)) {
              score += 40;
              reasons.push('관심 분야');
            }

            // 플랫폼 매칭
            if (platforms.has(campaign.platform)) {
              score += 30;
              reasons.push('선호 플랫폼');
            }

            // 지역/유형 매칭
            if (campaign.type === 'VISIT' && campaign.region) {
              const isMatch = regions.some((r: string) => campaign.region.includes(r) || r === 'nationwide');
              if (isMatch) {
                score += 30;
                reasons.push('선호 지역');
              }
            } else if (campaign.type === 'DELIVERY') {
              score += 10;
              reasons.push('배송형');
            }

            return { ...campaign, score, reasons };
          })
          .filter(c => c.score > 0)
          .sort((a, b) => b.score - a.score);

        setCampaigns(filtered);
      } catch (error) {
        console.error('Error fetching recommended campaigns:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-3 md:px-10 py-12">
        <div className="flex flex-col gap-2 mb-8 items-center md:items-start text-center md:text-left">
          <div className="h-10 w-64 bg-slate-100 animate-pulse rounded-lg" />
          <div className="h-4 w-96 bg-slate-50 animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
          {[...Array(10)].map((_, i) => (
            <CampaignSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-3 md:px-10 py-12">
      <div className="mb-12 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 rounded-full text-amber-600 text-xs font-bold mb-4 border border-amber-100/50">
          <Zap size={14} className="fill-amber-600" />
          <span>인공지능 맞춤 추천</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end gap-3 mb-2">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {profile?.nickname || '회원'}님을 위한 맞춤 캠페인
          </h1>
          <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600 px-3 py-1 rounded-full text-xs font-black self-start md:mb-1 border-none shadow-sm shadow-amber-200">
            {campaigns.length}
          </Badge>
        </div>
        <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
          설정하신 활동 플랫폼과 관심 카테고리를 분석하여<br className="hidden md:block" />
          가장 높은 매칭 점수를 기록한 캠페인부터 정렬했습니다.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl">
          {/* 나의 활동 플랫폼 */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center transition-colors group-hover:bg-indigo-500 group-hover:text-white">
                  <Smartphone size={20} />
                </div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight whitespace-nowrap">나의 활동 플랫폼</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {profile?.preferred_platforms && profile.preferred_platforms.length > 0 ? (
                  profile.preferred_platforms.map((platform: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="px-2.5 py-1 bg-indigo-50/30 text-indigo-700 border-indigo-100 font-bold text-[11px] hover:bg-indigo-100 transition-colors">
                      {platform}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-300">설정 없음</span>
                )}
              </div>
            </div>
          </div>

          {/* 나의 관심 카테고리 */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center transition-colors group-hover:bg-rose-500 group-hover:text-white">
                  <Target size={20} />
                </div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight whitespace-nowrap">나의 관심 카테고리</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {profile?.interests && profile.interests.length > 0 ? (
                  profile.interests.map((interest: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="px-2.5 py-1 bg-rose-50/30 text-rose-700 border-rose-100 font-bold text-[11px] hover:bg-rose-100 transition-colors">
                      #{interest}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-300">설정 없음</span>
                )}
              </div>
            </div>
          </div>
        </div>
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
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
          {campaigns.map((campaign) => {
            const score = Math.round(campaign.score);

            // 점수별 스타일 정의
            let badgeStyle = "bg-amber-500 text-white shadow-amber-200";
            let containerStyle = "bg-white/95 border-amber-100 text-amber-600";
            let Icon = Star;

            if (score >= 90) {
              badgeStyle = "bg-emerald-500 text-white shadow-emerald-200";
              containerStyle = "bg-white/95 border-emerald-100 text-emerald-600";
            } else if (score >= 70) {
              badgeStyle = "bg-indigo-500 text-white shadow-indigo-200";
              containerStyle = "bg-white/95 border-indigo-100 text-indigo-600";
            }

            return (
              <div key={campaign.id} className="relative group">
                {/* Refined Selection Probability Badge */}
                <div className="absolute top-4 left-4 z-10 pointer-events-none transform transition-transform group-hover:scale-105 duration-300">
                  <div className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-xl border backdrop-blur-md shadow-lg
                    ${containerStyle}
                  `}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${badgeStyle} shadow-sm`}>
                      <Icon size={10} className="fill-current" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold opacity-80 tracking-tight text-slate-500">선정 확률</span>
                      <span className="text-sm font-black tracking-tighter">{score}%</span>
                    </div>
                  </div>
                </div>

                <CampaignCard {...mapCampaignToCard(campaign)} />
              </div>
            );
          })}

          {/* Fill remaining slots to maintain 2 rows (10 items) layout */}
          {campaigns.length > 0 && campaigns.length < 10 && [...Array(10 - campaigns.length)].map((_, i) => (
            <div key={`skeleton-fill-${i}`} className="opacity-40">
              <CampaignSkeleton />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
