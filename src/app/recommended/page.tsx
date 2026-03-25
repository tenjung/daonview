'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import CampaignCard from '@/components/CampaignCard';
import CampaignSkeleton from '@/components/CampaignSkeleton';
import { Star, MapPin, Zap, Info, Smartphone, Target, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getCampaignRecruitTarget, mapCampaignToCard, normalizeCampaignPlatform } from '@/lib/campaignUtils';
import { Badge } from '@/components/ui/badge';
import { ACTIVE_CAMPAIGN_STATUSES } from '@/constants/campaign';
import { isRole, USER_ROLES } from '@/constants/role';

const REGION_MAP: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천', busan: '부산',
  daegu: '대구', gwangju: '광주', daejeon: '대전', ulsan: '울산',
  sejong: '세종', gangwon: '강원', chungbuk: '충북', chungnam: '충남',
  jeonbuk: '전북', jeonnam: '전남', gyeongbuk: '경북', gyeongnam: '경남',
  jeju: '제주', nationwide: '전국'
};

const DISPLAY_NAME_MAP: Record<string, string> = {
  BLOG: '블로그',
  NAVER_BLOG: '블로그',
  INSTAGRAM: '인스타그램',
  YOUTUBE: '유튜브',
  TIKTOK: '틱톡'
};

const normalizePlatform = (value: string | null | undefined) =>
  normalizeCampaignPlatform(value, 'BLOG');

export default function RecommendedCampaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const { user, profile, isLoading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 인증 초기화 대기
    if (authLoading) return;

    // 비로그인 유저 리다이렉트
    if (!user) {
      router.push('/login');
      return;
    }

    // 인플루언서가 아닌 경우 리다이렉트
    if (profile && !isRole(profile.role, USER_ROLES.INFLUENCER)) {
      router.push('/');
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        
        // 모집 중이거나 진행 중인 캠페인만 조회
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .in('status', ACTIVE_CAMPAIGN_STATUSES as unknown as string[])
          .order('created_at', { ascending: false });

        if (campaignError) throw campaignError;
        if (!campaignData) return;

        // 추천 점수 계산 최적화
        const userInterests = new Set(profile?.interests || []);
        const userPlatforms = new Set((profile?.preferred_platforms || []).map((platform: string) => normalizePlatform(platform)));
        const userRegions = profile?.preferred_regions || [];

        const filtered = (campaignData || [])
          .map(campaign => {
            let score = 0;
            const reasons: string[] = [];

            // 1. 플랫폼 매칭
            const normalizedCampaignPlatform = normalizePlatform(campaign.platform);
            const isPlatformMatch = userPlatforms.has(normalizedCampaignPlatform);

            if (userPlatforms.size > 0 && !isPlatformMatch) {
              return { ...campaign, score: 0, reasons: [] };
            }
            score += 30;

            // 2. 카테고리 매칭
            if (userInterests.has(campaign.category)) {
              score += 40;
              reasons.push('관심 분야 일치');
            }

            // 3. 지역 및 유형 매칭
            if (campaign.type === 'VISIT') {
              if (campaign.region) {
                const isMatch = userRegions.some((id: string) => {
                  const regionName = REGION_MAP[id];
                  return (regionName && campaign.region.includes(regionName)) || id === 'nationwide';
                });

                if (isMatch) {
                  score += 25;
                  reasons.push('내 활동 지역');
                } else {
                  return { ...campaign, score: 0, reasons: [] };
                }
              }
            } else if (campaign.type === 'DELIVERY') {
              score = Math.max(score, 40); 
              score += 10;
              reasons.push('참여 가능 배송형');
            }

            // 4. 가산점 및 확률 보정
            if (campaign.end_date) {
              const endDate = new Date(campaign.end_date);
              const now = new Date();
              const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (daysLeft > 0 && daysLeft <= 3) score += 5;
            }

            const applicantsCount = campaign.applicants_count || 0;
            const recruitmentCount = getCampaignRecruitTarget(campaign) || 1;
            const competitionRatio = applicantsCount / recruitmentCount;
            if (competitionRatio < 0.3) score += 15;
            else if (competitionRatio < 0.7) score += 5;

            return { ...campaign, score: Math.min(score, 100), reasons };
          })
          .filter(c => c.score >= 30)
          .sort((a, b) => b.score - a.score);

        setCampaigns(filtered);
      } catch (error) {
        console.error('Error fetching recommended campaigns:', error);
      } finally {
        setLoading(false);
      }
    }

    if (profile) {
      fetchData();
    }
  }, [authLoading, user, profile, router]);

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-center md:text-left">
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
              가장 높은 적합도 점수를 기록한 캠페인부터 정렬했습니다.
            </p>
          </div>
          
          <button 
            onClick={() => router.push('/profile/edit')}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-primary/30 hover:text-primary transition-all shadow-sm group self-center md:self-end"
          >
            <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500" />
            맞춤 설정 변경
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
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
                      {DISPLAY_NAME_MAP[normalizePlatform(platform)] || normalizePlatform(platform)}
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

          {/* 나의 관심 지역 */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                  <MapPin size={20} />
                </div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight whitespace-nowrap">나의 관심 지역</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {profile?.preferred_regions && profile.preferred_regions.length > 0 ? (
                  profile.preferred_regions.map((region: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="px-2.5 py-1 bg-emerald-50/30 text-emerald-700 border-emerald-100 font-bold text-[11px] hover:bg-emerald-100 transition-colors">
                      {REGION_MAP[region] || region}
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
