'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, CheckCircle2, Download, Lock, Search, Sparkles, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useSubscription } from '@/hooks/useSubscription';
import { isAdminRole, normalizeRoleValue } from '@/lib/campaignPermissions';
import { AIQuota } from '@/types/aiQuota';
import { SmartStoreCategorySuggestion, SmartStoreTagAnalysis, SmartStoreTagGrade } from '@/lib/ai/smartStoreTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const GRADE_LABELS: Record<SmartStoreTagGrade, string> = {
  HIGH_POTENTIAL: '고가능성 태그',
  VALID_CANDIDATE: '유효 후보',
  GENERAL: '일반 후보',
};

const GRADE_STYLES: Record<SmartStoreTagGrade, string> = {
  HIGH_POTENTIAL: 'border-violet-200 bg-violet-50 text-violet-700',
  VALID_CANDIDATE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  GENERAL: 'border-slate-200 bg-slate-50 text-slate-600',
};

function escapeCsvCell(value: string | number | null) {
  const text = value === null ? '확인 불가' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function SmartStoreTagsPage() {
  const { user, profile, isLoading: isAuthLoading } = useAuthStore();
  const { isUnlimited, isLoading: isSubscriptionLoading } = useSubscription();
  const [seedKeyword, setSeedKeyword] = useState('');
  const [categoryPath, setCategoryPath] = useState('');
  const [categorySuggestions, setCategorySuggestions] = useState<SmartStoreCategorySuggestion[]>([]);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [quota, setQuota] = useState<AIQuota | null>(null);
  const [result, setResult] = useState<SmartStoreTagAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const normalizedRole = normalizeRoleValue(profile?.role);
  const isAdmin = isAdminRole(normalizedRole);
  const isAdvertiser = normalizedRole === 'ADVERTISER';
  const isInfluencer = normalizedRole === 'INFLUENCER';
  const canUse = isAdmin || (isAdvertiser && isUnlimited);
  const isLoading = isAuthLoading || (isAdvertiser && isSubscriptionLoading);
  const isLimitReached = quota ? !quota.unlimited && quota.count >= quota.limit : false;
  const trimmedSeedKeyword = seedKeyword.trim();

  const highPotentialTags = useMemo(
    () => result?.tags.filter((tag) => tag.grade === 'HIGH_POTENTIAL').slice(0, 8) || [],
    [result]
  );
  const priorityTags = useMemo(() => {
    if (!result) return [];
    return highPotentialTags.length > 0 ? highPotentialTags : result.tags.slice(0, 8);
  }, [highPotentialTags, result]);

  useEffect(() => {
    if (!user) return;

    fetch('/api/ai-service/quota')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data?.smartStoreTags) {
          setQuota(data.smartStoreTags);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch smart store tag quota:', error);
      });
  }, [user]);

  const recommendCategories = async (keyword: string) => {
    if (keyword.length < 2) {
      throw new Error('기준 검색어를 2자 이상 입력해주세요.');
    }

    setIsLoadingCategories(true);
    setCategoryPath('');
    setCategorySuggestions([]);
    setCategoryMessage(null);

    try {
      const response = await fetch('/api/ai-service/smart-store-tags/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedKeyword: keyword }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '카테고리 추천 중 오류가 발생했습니다.');
      }

      const suggestions = (data.suggestions || []) as SmartStoreCategorySuggestion[];
      setCategorySuggestions(suggestions);
      setCategoryMessage(data.apiMessage || null);

      if (suggestions[0]?.categoryPath) {
        setCategoryPath(suggestions[0].categoryPath);
        return suggestions[0].categoryPath;
      }

      throw new Error(data.apiMessage || '추천 카테고리를 찾지 못했습니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '카테고리 추천 중 오류가 발생했습니다.';
      setCategoryMessage(message);
      throw new Error(message);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const runAnalysis = async (keyword: string, selectedCategoryPath: string) => {
    const response = await fetch('/api/ai-service/smart-store-tags/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seedKeyword: keyword, categoryPath: selectedCategoryPath }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '분석 중 오류가 발생했습니다.');
    }

    setResult(data);

    const quotaResponse = await fetch('/api/ai-service/quota');
    if (quotaResponse.ok) {
      const quotaData = await quotaResponse.json();
      setQuota(quotaData.smartStoreTags);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canUse || isLimitReached || isAnalyzing || isLoadingCategories) return;

    const keyword = seedKeyword.trim();
    setResult(null);

    try {
      await recommendCategories(keyword);
      toast.success('추천 카테고리를 선택하면 태그 분석이 실행됩니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      toast.error(message);
    }
  };

  const handleCategorySelect = async (selectedCategoryPath: string) => {
    if (!canUse || isLimitReached || isAnalyzing || isLoadingCategories) return;

    const keyword = seedKeyword.trim();
    if (keyword.length < 2) {
      toast.error('기준 검색어를 2자 이상 입력해주세요.');
      return;
    }

    setCategoryPath(selectedCategoryPath);
    setIsAnalyzing(true);
    setResult(null);

    try {
      await runAnalysis(keyword, selectedCategoryPath);
      toast.success('선택한 카테고리 기준으로 태그 분석이 완료되었습니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!result) return;

    const headers = [
      '순위',
      '태그',
      '등급',
      '종합점수',
      '출현빈도',
      '상위근거',
      '카테고리적합',
      '단어수',
      '월검색량',
      '잠재확장',
      '추천조합',
      '기준검색어',
      '카테고리',
    ];
    const rows = result.tags.map((tag, index) => [
      index + 1,
      tag.tag,
      GRADE_LABELS[tag.grade],
      tag.selectionScore,
      tag.frequencyScore,
      tag.sourceScore,
      tag.categoryScore,
      tag.wordCount,
      tag.monthlySearchVolume,
      tag.potentialVolume,
      tag.recommendedCombinations.join(' | '),
      result.seedKeyword,
      result.categoryPath,
    ]);
    const csv = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(',')),
    ].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeKeyword = result.seedKeyword.replace(/[^0-9a-zA-Z가-힣_-]/g, '_');

    link.href = url;
    link.download = `smart-store-tags_${safeKeyword || 'analysis'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
          <div className="mt-6 h-40 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-16">
        <AccessPanel
          title="로그인이 필요합니다"
          description="스마트스토어 태그 분석기는 관리자와 월 자동결제 이용권이 활성화된 광고주만 사용할 수 있습니다."
          actionHref="/login"
          actionLabel="로그인하기"
        />
      </div>
    );
  }

  if (isInfluencer || (!isAdmin && !isAdvertiser)) {
    return (
      <div className="container py-16">
        <AccessPanel
          title="이용 권한이 없습니다"
          description="이 기능은 관리자와 광고주 전용 기능입니다. 인플루언서 계정에는 노출되지 않습니다."
          actionHref="/ai-service"
          actionLabel="AI 인텔리전스으로 이동"
        />
      </div>
    );
  }

  if (isAdvertiser && !isUnlimited) {
    return (
      <div className="container py-16">
        <AccessPanel
          title="월 자동결제 이용권이 필요합니다"
          description="스마트스토어 태그 분석기는 월 자동결제가 활성화된 광고주만 사용할 수 있습니다."
          actionHref="/dashboard/advertiser/pricing?tab=subscription"
          actionLabel="월 이용권 확인"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container py-10 md:py-14">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/ai-service" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              AI 인텔리전스
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Tags className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">스마트스토어 태그 분석기</h1>
                <p className="mt-2 text-sm font-medium text-slate-600 md:text-base">
                  네이버 쇼핑 상위 40개 상품을 기준으로 태그 후보, 카테고리 적합도, 조합 확장 가능성을 분석합니다.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white px-4 py-3 text-sm font-bold text-indigo-700 shadow-sm">
            {quota?.unlimited ? '관리자 무제한 이용' : `금일 잔여 ${quota ? Math.max(0, quota.limit - quota.count) : 2} / ${quota?.limit || 2}`}
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
              <div className="space-y-2">
                <Label htmlFor="seedKeyword">기준 검색어</Label>
                <Input
                  id="seedKeyword"
                  value={seedKeyword}
                  onChange={(event) => {
                    setSeedKeyword(event.target.value);
                    setCategoryPath('');
                    setCategorySuggestions([]);
                    setCategoryMessage(null);
                  }}
                  placeholder="예: 남자 반팔티"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>추천 카테고리</Label>
                  {categoryPath && (
                    <span className="text-xs font-bold text-emerald-700">선택됨</span>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {categorySuggestions.length > 0 ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      {categorySuggestions.map((category) => (
                        <button
                          type="button"
                          key={category.categoryPath}
                          onClick={() => handleCategorySelect(category.categoryPath)}
                          className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                            categoryPath === category.categoryPath
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : 'border-white bg-white text-slate-700 hover:border-slate-200'
                          }`}
                        >
                          <div className="truncate text-sm font-black">{category.categoryPath}</div>
                          <div className="mt-1 text-xs font-bold text-slate-500">
                            상위 40개 매칭 {category.matchedItemCount}개 · 신뢰도 {category.confidence}%
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-slate-500">
                      기준 검색어 입력 후 엔터를 누르면 추천 카테고리가 표시됩니다. 카테고리를 선택하면 태그 분석이 실행됩니다.
                    </div>
                  )}
                </div>
                {categoryMessage && (
                  <p className="text-xs font-bold text-amber-700">{categoryMessage}</p>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600">
                    <Search className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">태그 후보 자동 추출</div>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                      먼저 검색어에 맞는 카테고리를 추천하고, 선택한 카테고리 기준으로 네이버 쇼핑 상위 40개 상품의 후보 태그를 분석합니다.
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="h-full min-h-14 w-full" disabled={isAnalyzing || isLoadingCategories || isLimitReached || trimmedSeedKeyword.length < 2}>
                {isLoadingCategories ? '카테고리 추천 중...' : isAnalyzing ? '태그 분석 중...' : '카테고리 추천'}
                {!isAnalyzing && !isLoadingCategories && <Search className="h-4 w-4" />}
              </Button>
            </div>
          </form>

          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard icon={BarChart3} label="분석 태그" value={result ? `${result.totalTags}개` : '-'} />
              <MetricCard icon={Sparkles} label="고가능성" value={result ? `${result.highPotentialCount}개` : '-'} />
              <MetricCard icon={CheckCircle2} label="기준 상품" value={result ? `${result.sourceItemCount}개` : '-'} />
            </div>

            {result?.apiMessage && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                {result.apiMessage}
              </div>
            )}

            {priorityTags.length > 0 && (
              <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-base font-black text-slate-950">우선 검토 태그</h2>
                <div className="flex flex-wrap gap-2">
                  {priorityTags.map((tag) => (
                    <Badge key={tag.tag} className="border-violet-200 bg-violet-50 px-3 py-1 text-violet-700 hover:bg-violet-50">
                      {tag.tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-black text-slate-950">분석 결과</h2>
                <p className="mt-1 text-sm text-slate-500">후보 태그를 엑셀형 테이블로 비교합니다. 조합 키워드는 다운로드 파일에 전체 저장됩니다.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadCsv}
                disabled={!result}
                className="shrink-0"
              >
                <Download className="h-4 w-4" />
                엑셀 다운로드
              </Button>
            </div>
              {result ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-[980px]">
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-16 min-w-16 whitespace-nowrap text-center">순번</TableHead>
                        <TableHead className="min-w-[240px] whitespace-nowrap">태그</TableHead>
                        <TableHead className="w-28 whitespace-nowrap text-center">등급</TableHead>
                        <TableHead className="w-20 whitespace-nowrap text-center">종합</TableHead>
                        <TableHead className="w-20 whitespace-nowrap text-center">빈도</TableHead>
                        <TableHead className="w-20 whitespace-nowrap text-center">근거</TableHead>
                        <TableHead className="w-20 whitespace-nowrap text-center">적합</TableHead>
                        <TableHead className="min-w-[320px] whitespace-nowrap">추천 조합</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.tags.map((tag, index) => (
                        <TableRow key={tag.tag} className="h-12">
                          <TableCell className="align-middle text-center text-xs font-bold text-slate-500">{index + 1}</TableCell>
                          <TableCell className="align-middle">
                            <div className="max-w-[280px] truncate font-black text-slate-950">{tag.tag}</div>
                            <div className="text-xs font-bold text-slate-400">{tag.wordCount}단어</div>
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            <Badge variant="outline" className={`mx-auto justify-center ${GRADE_STYLES[tag.grade]}`}>
                              {GRADE_LABELS[tag.grade]}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle text-center font-black text-slate-950">{tag.selectionScore}</TableCell>
                          <TableCell className="align-middle text-center font-bold text-slate-700">{tag.frequencyScore}</TableCell>
                          <TableCell className="align-middle text-center font-bold text-slate-700">{tag.sourceScore}</TableCell>
                          <TableCell className="align-middle text-center font-bold text-slate-700">{tag.categoryScore}</TableCell>
                          <TableCell className="align-middle">
                            <div className="max-w-[420px] truncate text-xs font-bold text-slate-600">
                              {tag.recommendedCombinations.join(' · ') || '-'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-sm font-medium text-slate-500">
                  기준 검색어로 카테고리를 추천받은 뒤 상위 40개 상품 기준 분석을 실행하세요.
                </div>
              )}
          </section>
        </div>
      </div>
    </div>
  );
}

function AccessPanel({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-black text-slate-950">{title}</h1>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{description}</p>
      <Button asChild className="mt-6">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
