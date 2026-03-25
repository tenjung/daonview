import type { ReactNode } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  Layers3,
  Megaphone,
  ShieldAlert,
  Sparkles,
  TimerReset,
  Users,
} from 'lucide-react';
import { CAMPAIGN_STATUS_LABELS } from '@/constants/campaign';
import { APPLICATION_STATUS_LABELS, REVIEW_STATUS_LABELS } from '@/constants/status';
import { getCampaignRecruitTarget, isCampaignAutoExtendEnabled } from '@/lib/campaignUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type CampaignProgressRow = {
  id: number;
  title: string;
  status: string;
  type?: string | null;
  platform?: string | null;
  end_date?: string | null;
  review_deadline?: string | null;
  first_selection_date?: string | null;
  total_recruitment?: number | null;
  campaign_options?: Record<string, unknown> | Record<string, unknown>[] | null;
  is_unlimited_recruitment?: boolean | null;
  created_at?: string | null;
  applications?: Array<{ count: number }> | { count: number } | null;
};

type RecentApplicationRow = {
  id: number;
  created_at: string;
  status: string;
  campaign_id: number;
  user_id: string;
  user?: {
    nickname?: string | null;
    name?: string | null;
    email?: string | null;
  }[] | null;
  campaign?: {
    id: number;
    title: string;
  }[] | null;
};

type RecentReviewRow = {
  id: number;
  created_at: string;
  status: string;
  title?: string | null;
  author_name?: string | null;
  platform?: string | null;
  campaign_id?: number | null;
  campaign?: {
    id: number;
    title: string;
  }[] | null;
};

function formatDate(date?: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

function formatDateTime(date?: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function getCountFromRelation(value: CampaignProgressRow['applications']) {
  if (!value) return 0;
  if (Array.isArray(value)) return value[0]?.count || 0;
  if (typeof value === 'object' && 'count' in value) return value.count || 0;
  return 0;
}

function getDaysLeft(date?: string | null) {
  if (!date) return null;
  const endDate = new Date(date);
  const today = new Date();
  return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getCampaignHealth(campaign: CampaignProgressRow) {
  const applicants = getCountFromRelation(campaign.applications);
  const target = getCampaignRecruitTarget(campaign) || 0;
  const isAutoExtend = isCampaignAutoExtendEnabled(campaign);
  const daysLeft = getDaysLeft(campaign.end_date);
  const reviewDaysLeft = getDaysLeft(campaign.review_deadline);
  const progressRate = target > 0 && !isAutoExtend ? Math.round((applicants / target) * 100) : null;

  let tone: 'good' | 'warning' | 'critical' = 'good';
  if (!isAutoExtend && target > 0) {
    if ((daysLeft !== null && daysLeft <= 3 && applicants < target * 0.5) || applicants === 0) tone = 'critical';
    else if ((daysLeft !== null && daysLeft <= 5) || applicants < target) tone = 'warning';
  }

  let message = '안정적으로 운영 중';
  if (tone === 'critical') {
    message = applicants === 0 ? '신청 0건, 즉시 점검 필요' : '마감 임박, 모집 보강 필요';
  } else if (tone === 'warning') {
    message = applicants < target ? '목표 대비 신청 부족' : '일정 확인 필요';
  }

  return { applicants, target, isAutoExtend, daysLeft, reviewDaysLeft, progressRate, tone, message };
}

function toneClassName(tone: 'good' | 'warning' | 'critical') {
  if (tone === 'critical') return 'border-red-200 bg-red-50 text-red-700';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function toneRingClassName(tone: 'good' | 'warning' | 'critical') {
  if (tone === 'critical') return 'border-red-200/80 bg-gradient-to-br from-red-50 to-white';
  if (tone === 'warning') return 'border-amber-200/80 bg-gradient-to-br from-amber-50 to-white';
  return 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white';
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 sm:text-sm">{title}</p>
            <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 sm:mt-2 sm:text-3xl">{value}</p>
            <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{description}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 p-2.5 text-rose-500 sm:p-3">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  title,
  count,
  description,
  href,
  tone,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
  tone: 'rose' | 'amber' | 'red' | 'sky';
}) {
  const toneClass = {
    rose: 'border-rose-200 bg-rose-50/80 text-rose-700',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-700',
    red: 'border-red-200 bg-red-50/80 text-red-700',
    sky: 'border-sky-200 bg-sky-50/80 text-sky-700',
  }[tone];

  return (
    <Link
      href={href}
      className={`block rounded-3xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-black">{title}</div>
          <div className="mt-1 text-xs opacity-80">{description}</div>
        </div>
        <div className="shrink-0 rounded-2xl bg-white/80 px-3 py-2 text-right shadow-sm">
          <div className="text-xl font-black leading-none">{count}</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">건</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs font-bold">
        바로 보기 <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

export default async function AdminProgressDashboardPage() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    sidebarCounts,
    pendingCampaignsRes,
    campaignsInProgressRes,
    pendingApplicationsRes,
    selectedApplicationsRes,
    completedApplicationsRes,
    overdueApplicationsRes,
    extensionPendingRes,
    pendingReviewsRes,
    approvedReviewsRes,
    weeklyReviewsRes,
    recentApplicationsRes,
    recentReviewsRes,
  ] = await Promise.all([
    fetchAdminCampaignCounts(supabase),
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase
      .from('campaigns')
      .select('id, title, status, type, platform, end_date, review_deadline, first_selection_date, total_recruitment, campaign_options, is_unlimited_recruitment, created_at, applications(count)')
      .in('status', ['RECRUITING', 'ONGOING'])
      .order('end_date', { ascending: true })
      .limit(12),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('applications').select('id', { count: 'exact', head: true }).in('status', ['APPROVED', 'SELECTED']),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
    supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['APPROVED', 'SELECTED'])
      .lt('review_deadline', nowIso),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('extension_status', 'PENDING'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'APPROVED'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgoIso),
    supabase
      .from('applications')
      .select(`
        id,
        created_at,
        status,
        campaign_id,
        user_id,
        user:profiles!applications_user_id_fkey(nickname, name, email),
        campaign:campaigns!applications_campaign_id_fkey(id, title)
      `)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('reviews')
      .select(`
        id,
        created_at,
        status,
        title,
        author_name,
        platform,
        campaign_id,
        campaign:campaigns!reviews_campaign_id_fkey(id, title)
      `)
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const campaignsInProgress = (campaignsInProgressRes.data || []) as CampaignProgressRow[];
  const recentApplications = (recentApplicationsRes.data || []) as RecentApplicationRow[];
  const recentReviews = (recentReviewsRes.data || []) as RecentReviewRow[];

  const criticalCampaigns = campaignsInProgress.filter((campaign) => getCampaignHealth(campaign).tone === 'critical');
  const warningCampaigns = campaignsInProgress.filter((campaign) => getCampaignHealth(campaign).tone === 'warning');
  const recruitingCount = campaignsInProgress.filter((campaign) => campaign.status === 'RECRUITING').length;
  const ongoingCount = campaignsInProgress.filter((campaign) => campaign.status === 'ONGOING').length;

  const applicationSummary = [
    { key: 'PENDING', label: APPLICATION_STATUS_LABELS.PENDING, count: pendingApplicationsRes.count || 0 },
    { key: 'APPROVED', label: '선정 진행', count: selectedApplicationsRes.count || 0 },
    { key: 'COMPLETED', label: APPLICATION_STATUS_LABELS.COMPLETED, count: completedApplicationsRes.count || 0 },
  ];

  const reviewSummary = [
    { key: 'PENDING', label: REVIEW_STATUS_LABELS.PENDING, count: pendingReviewsRes.count || 0 },
    { key: 'APPROVED', label: REVIEW_STATUS_LABELS.APPROVED, count: approvedReviewsRes.count || 0 },
    { key: 'WEEKLY', label: '최근 7일 등록', count: weeklyReviewsRes.count || 0 },
  ];

  const totalUrgentCount =
    (pendingCampaignsRes.count || 0) +
    (pendingReviewsRes.count || 0) +
    (overdueApplicationsRes.count || 0) +
    (extensionPendingRes.count || 0);

  const mobileSnapshot = [
    { label: '긴급', value: criticalCampaigns.length, tone: 'text-red-600' },
    { label: '주의', value: warningCampaigns.length, tone: 'text-amber-600' },
    { label: '리뷰대기', value: pendingReviewsRes.count || 0, tone: 'text-slate-900' },
    { label: '연장요청', value: extensionPendingRes.count || 0, tone: 'text-slate-900' },
  ];

  return (
    <AdminPageLayout sidebarCounts={sidebarCounts} containerClassName="max-w-[1480px]">
      <div className="space-y-5 p-1 sm:space-y-6 sm:p-0">
        <div className="rounded-[28px] bg-gradient-to-r from-slate-950 via-slate-900 to-rose-900 px-4 py-5 text-white shadow-lg sm:px-8 sm:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-rose-100 sm:text-xs">
                <Sparkles className="h-3.5 w-3.5" /> 진행기능 정리대시보드
              </div>
              <h1 className="text-xl font-black tracking-tight sm:text-3xl">캠페인 진행 흐름을 한 번에 보는 관리자 보드</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-200 sm:text-base">
                캠페인 승인, 신청자 선발, 리뷰 제출/승인, 연장 요청까지 운영팀이 바로 처리해야 할 지점을 한 화면에 모았습니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Link href="/dashboard/admin/campaigns" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-rose-50">
                캠페인 관리
              </Link>
              <Link href="/dashboard/admin/reviews/manage" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/20">
                리뷰 승인
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 sm:hidden">
            {mobileSnapshot.map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/10 px-3 py-3 text-center backdrop-blur-sm">
                <div className="text-[10px] font-semibold text-slate-200">{item.label}</div>
                <div className={`mt-1 text-lg font-black ${item.tone}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="승인 대기 캠페인" value={pendingCampaignsRes.count || 0} description="신규 등록 후 관리자 확인 필요" icon={<Megaphone className="h-5 w-5" />} />
          <StatCard title="진행 중 캠페인" value={campaignsInProgress.length} description={`모집중 ${recruitingCount} · 운영중 ${ongoingCount}`} icon={<Layers3 className="h-5 w-5" />} />
          <StatCard title="리뷰 지연/마감 경과" value={overdueApplicationsRes.count || 0} description="선정 이후 리뷰 제출이 밀린 건" icon={<ShieldAlert className="h-5 w-5" />} />
          <StatCard title="연장 요청 대기" value={extensionPendingRes.count || 0} description="리뷰 마감 연장 승인/반려 필요" icon={<Clock3 className="h-5 w-5" />} />
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-black text-slate-900 sm:text-lg">
              <AlertTriangle className="h-5 w-5 text-rose-500" /> 지금 바로 처리할 액션
            </CardTitle>
            <CardDescription>모바일에서 먼저 눌러야 하는 운영 큐를 앞에 뺐습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <QuickActionCard title="승인 대기 캠페인" count={pendingCampaignsRes.count || 0} description="신규 광고주 응답 전 확인" href="/dashboard/admin/campaigns" tone="rose" />
              <QuickActionCard title="리뷰 승인 대기" count={pendingReviewsRes.count || 0} description="노출 전 품질 검수 필요" href="/dashboard/admin/reviews/manage" tone="amber" />
              <QuickActionCard title="리뷰 마감 경과" count={overdueApplicationsRes.count || 0} description="지연 인원 추적 및 안내" href="/dashboard/admin/campaigns" tone="red" />
              <QuickActionCard title="연장 요청 검토" count={extensionPendingRes.count || 0} description="승인/반려 의사결정 필요" href="/dashboard/admin/campaigns" tone="sky" />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-bold text-slate-500">오늘의 총 액션</div>
                <div className="mt-1 text-2xl font-black text-slate-900">{totalUrgentCount}</div>
              </div>
              <div className="rounded-2xl bg-red-50 px-4 py-3">
                <div className="text-[11px] font-bold text-red-600">긴급 캠페인</div>
                <div className="mt-1 text-2xl font-black text-red-700">{criticalCampaigns.length}</div>
              </div>
              <div className="rounded-2xl bg-amber-50 px-4 py-3">
                <div className="text-[11px] font-bold text-amber-600">주의 캠페인</div>
                <div className="mt-1 text-2xl font-black text-amber-700">{warningCampaigns.length}</div>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                <div className="text-[11px] font-bold text-emerald-600">최근 7일 리뷰</div>
                <div className="mt-1 text-2xl font-black text-emerald-700">{weeklyReviewsRes.count || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-900">
                <BarChart3 className="h-5 w-5 text-rose-500" /> 진행 우선순위 캠페인
              </CardTitle>
              <CardDescription>모집률, 마감, 리뷰 일정 기준으로 모바일에서도 바로 판단할 수 있게 정리했습니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaignsInProgress.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  현재 진행 중인 캠페인이 없습니다.
                </div>
              ) : (
                campaignsInProgress.map((campaign) => {
                  const health = getCampaignHealth(campaign);
                  return (
                    <div key={campaign.id} className={`rounded-3xl border p-4 shadow-sm ${toneRingClassName(health.tone)}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="font-bold">{CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}</Badge>
                            {campaign.type && <Badge variant="secondary">{campaign.type}</Badge>}
                            {campaign.platform && <Badge variant="secondary">{campaign.platform}</Badge>}
                          </div>
                          <div className="line-clamp-2 text-base font-black leading-snug text-slate-900">{campaign.title}</div>
                          <div className="mt-2 text-xs font-medium text-slate-600">{health.message}</div>
                        </div>
                        <div className={`shrink-0 rounded-2xl border px-3 py-2 text-right ${toneClassName(health.tone)}`}>
                          <div className="text-[11px] font-bold">{health.tone === 'critical' ? '긴급 체크' : health.tone === 'warning' ? '주의 필요' : '안정'}</div>
                          <div className="mt-1 text-sm font-black">{health.progressRate !== null ? `${health.progressRate}% 모집` : '자동연장 운영'}</div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-2xl bg-white/80 px-3 py-3">
                          <div className="text-[10px] font-bold text-slate-500">모집 현황</div>
                          <div className="mt-1 text-sm font-black text-slate-900">{health.applicants} / {health.target}</div>
                        </div>
                        <div className="rounded-2xl bg-white/80 px-3 py-3">
                          <div className="text-[10px] font-bold text-slate-500">모집 마감</div>
                          <div className="mt-1 text-sm font-black text-slate-900">{health.daysLeft === null ? '-' : `${health.daysLeft}일`}</div>
                          <div className="text-[10px] text-slate-500">{formatDate(campaign.end_date)}</div>
                        </div>
                        <div className="rounded-2xl bg-white/80 px-3 py-3">
                          <div className="text-[10px] font-bold text-slate-500">선정일</div>
                          <div className="mt-1 text-sm font-black text-slate-900">{formatDate(campaign.first_selection_date)}</div>
                        </div>
                        <div className="rounded-2xl bg-white/80 px-3 py-3">
                          <div className="text-[10px] font-bold text-slate-500">리뷰 마감</div>
                          <div className="mt-1 text-sm font-black text-slate-900">{health.reviewDaysLeft === null ? '-' : `${health.reviewDaysLeft}일`}</div>
                          <div className="text-[10px] text-slate-500">{formatDate(campaign.review_deadline)}</div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <Link href={`/dashboard/admin/campaigns/${campaign.id}`} className="inline-flex items-center justify-center gap-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-black">
                          상세 보기 <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link href="/dashboard/admin/campaigns" className="inline-flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:text-slate-900">
                          캠페인 목록 <ExternalLink className="h-4 w-4" />
                        </Link>
                        <Link href="/dashboard/admin/reviews/manage" className="inline-flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:text-slate-900">
                          리뷰 검수 <ClipboardCheck className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-900">
                  <TimerReset className="h-5 w-5 text-amber-500" /> 운영 우선순위 메모
                </CardTitle>
                <CardDescription>숫자를 바로 행동으로 연결할 수 있게 압축했습니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start gap-2 font-semibold text-slate-900">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> 오늘의 권장 순서
                  </div>
                  <ol className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>1. 승인 대기 캠페인부터 처리해 신규 광고주 응답 속도를 지킵니다.</li>
                    <li>2. 리뷰 승인 대기를 비워 노출 대기 리뷰를 줄입니다.</li>
                    <li>3. 마감 경과/연장 요청 건을 확인해 CS 발생 가능성을 줄입니다.</li>
                  </ol>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4 text-rose-900">
                  <div className="font-bold">지금 가장 위험한 구간</div>
                  <div className="mt-2 text-sm leading-6">
                    긴급 캠페인 <span className="font-black">{criticalCampaigns.length}건</span> · 리뷰 지연 <span className="font-black">{overdueApplicationsRes.count || 0}건</span> · 승인 대기 캠페인 <span className="font-black">{pendingCampaignsRes.count || 0}건</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-900">빠른 이동</CardTitle>
                <CardDescription>모바일에서 자주 오가는 화면만 묶었습니다.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {[
                  { href: '/dashboard/admin/campaigns', label: '캠페인 전체 관리' },
                  { href: '/dashboard/admin/reviews', label: '리뷰 목록' },
                  { href: '/dashboard/admin/reviews/manage', label: '리뷰 승인/숨김' },
                  { href: '/dashboard/admin', label: '기존 인사이트 홈' },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 px-4 py-4 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50/40 hover:text-slate-900">
                    {item.label}
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="applications" className="space-y-4">
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-grid min-w-full grid-cols-3 sm:w-full lg:w-[420px]">
              <TabsTrigger value="applications">신청 현황</TabsTrigger>
              <TabsTrigger value="reviews">리뷰 현황</TabsTrigger>
              <TabsTrigger value="recent">최근 흐름</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="applications" className="mt-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.72fr_1.28fr]">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-900">
                    <Users className="h-5 w-5 text-rose-500" /> 신청 파이프라인
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {applicationSummary.map((item) => (
                    <div key={item.key} className="rounded-2xl bg-slate-50 px-4 py-4">
                      <div className="text-xs font-bold text-slate-500">{item.label}</div>
                      <div className="mt-1 text-3xl font-black text-slate-900">{item.count}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900">최근 신청 유입</CardTitle>
                  <CardDescription>가장 최근 접수된 신청서 6건입니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentApplications.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                        최근 신청 데이터가 없습니다.
                      </div>
                    ) : (
                      recentApplications.map((application) => (
                        <Link
                          key={application.id}
                          href={`/dashboard/admin/campaigns/${application.campaign_id}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-rose-200 hover:bg-rose-50/40"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-slate-900">{application.campaign?.[0]?.title || `캠페인 #${application.campaign_id}`}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {(application.user?.[0]?.nickname || application.user?.[0]?.name || application.user?.[0]?.email || '이름 없음')} · {APPLICATION_STATUS_LABELS[application.status] || application.status}
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-[11px] font-medium text-slate-400 sm:text-xs">{formatDateTime(application.created_at)}</div>
                        </Link>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.72fr_1.28fr]">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-900">
                    <ClipboardCheck className="h-5 w-5 text-rose-500" /> 리뷰 파이프라인
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {reviewSummary.map((item) => (
                    <div key={item.key} className="rounded-2xl bg-slate-50 px-4 py-4">
                      <div className="text-xs font-bold text-slate-500">{item.label}</div>
                      <div className="mt-1 text-3xl font-black text-slate-900">{item.count}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900">최근 등록 리뷰</CardTitle>
                  <CardDescription>관리자가 품질 확인해야 할 최신 리뷰 흐름입니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentReviews.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                        최근 리뷰 데이터가 없습니다.
                      </div>
                    ) : (
                      recentReviews.map((review) => (
                        <Link
                          key={review.id}
                          href="/dashboard/admin/reviews/manage"
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-rose-200 hover:bg-rose-50/40"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-slate-900">{review.title || review.campaign?.[0]?.title || `리뷰 #${review.id}`}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {(review.author_name || '작성자 미상')} · {review.platform || 'LINK'} · {REVIEW_STATUS_LABELS[review.status] || review.status}
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-[11px] font-medium text-slate-400 sm:text-xs">{formatDateTime(review.created_at)}</div>
                        </Link>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900">운영 체크 메모</CardTitle>
                  <CardDescription>페이지 숫자를 실무 행동으로 바로 연결하기 위한 요약입니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start gap-2 font-semibold text-slate-900">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> 우선 확인 추천
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      <li>• 승인 대기 캠페인이 누적되면 신규 광고주 응답 속도가 느려집니다.</li>
                      <li>• 리뷰 마감 경과 건은 캠페인별 신청자 페이지에서 바로 개별 추적 가능합니다.</li>
                      <li>• 리뷰 승인 대기는 리뷰 관리에서 일괄 확인 후 공개 처리하는 흐름에 맞춰졌습니다.</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-4 text-rose-900">
                    <div className="font-bold">지금 가장 위험한 구간</div>
                    <div className="mt-2 text-sm">
                      긴급 캠페인 <span className="font-black">{criticalCampaigns.length}건</span>, 리뷰 지연 <span className="font-black">{overdueApplicationsRes.count || 0}건</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900">빠른 이동</CardTitle>
                  <CardDescription>운영자가 자주 오가는 화면을 묶었습니다.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { href: '/dashboard/admin/campaigns', label: '캠페인 전체 관리' },
                    { href: '/dashboard/admin/reviews', label: '리뷰 목록' },
                    { href: '/dashboard/admin/reviews/manage', label: '리뷰 승인/숨김' },
                    { href: '/dashboard/admin', label: '기존 인사이트 홈' },
                  ].map((item) => (
                    <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 px-4 py-4 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50/40 hover:text-slate-900">
                      {item.label}
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageLayout>
  );
}
