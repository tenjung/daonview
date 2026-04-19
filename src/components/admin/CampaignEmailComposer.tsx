"use client";

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Clipboard, Mail, MousePointerClick, RotateCcw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AdminCampaignEmailCampaign,
  buildCampaignPromotionEmailHtml,
  CAMPAIGN_PROMOTION_EMAIL_SUBJECT,
} from '@/lib/adminCampaignEmail';

interface CampaignEmailComposerProps {
  campaigns: AdminCampaignEmailCampaign[];
}

const statusLabels: Record<string, string> = {
  RECRUITING: '모집중',
  ONGOING: '진행중',
};

type StatusFilter = 'ALL' | 'RECRUITING' | 'ONGOING';
type CampaignListTab = 'VISIT' | 'DELIVERY';
type DeliveryChannelFilter = 'ALL' | 'BLOG_ONLY' | 'PURCHASE_ONLY' | 'PURCHASE_WITH_SNS' | 'INSTAGRAM_ONLY';

const filterSelectClassName =
  'h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getSearchText(campaign: AdminCampaignEmailCampaign) {
  return [
    campaign.id,
    `#${campaign.id}`,
    campaign.title,
    campaign.status,
    statusLabels[campaign.status] || '',
    campaign.type,
    campaign.platform,
    campaign.category,
    campaign.regionLabel,
    campaign.intro,
    campaign.providedItems,
    campaign.storeName,
    campaign.storeAddress,
    campaign.deliveryPlatformLabel,
    ...campaign.deliveryChannelLabels,
  ].join(' ');
}

function matchesDeliveryChannel(campaign: AdminCampaignEmailCampaign, filter: DeliveryChannelFilter) {
  if (filter === 'ALL') return true;
  if (campaign.type !== 'DELIVERY') return false;

  const labels = campaign.deliveryChannelLabels;
  const hasReview = labels.includes('구매평');
  const hasBlog = labels.includes('블로그');
  const hasInstagram = labels.includes('인스타그램');

  if (filter === 'BLOG_ONLY') return hasBlog && !hasReview && !hasInstagram;
  if (filter === 'PURCHASE_ONLY') return hasReview && !hasBlog && !hasInstagram;
  if (filter === 'PURCHASE_WITH_SNS') return hasReview && (hasBlog || hasInstagram);
  if (filter === 'INSTAGRAM_ONLY') return hasInstagram && !hasReview && !hasBlog;

  return true;
}

function CampaignSelectCard({
  campaign,
  checked,
  onCheckedChange,
}: {
  campaign: AdminCampaignEmailCampaign;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const detailText = campaign.type === 'DELIVERY'
    ? `${campaign.deliveryPlatformLabel} · ${campaign.providedItems}`
    : [campaign.regionLabel, campaign.storeName, campaign.storeAddress].filter(Boolean).join(' · ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCheckedChange(!checked)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onCheckedChange(!checked);
        }
      }}
      className={`w-full rounded-lg border p-4 text-left transition hover:border-primary/40 hover:bg-rose-50/30 ${
        checked ? 'border-primary bg-rose-50/60' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(Boolean(value))}
          onClick={(event) => event.stopPropagation()}
          className="mt-1"
          aria-label={`${campaign.title} 선택`}
        />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-100">
              {statusLabels[campaign.status] || campaign.status}
            </Badge>
            {campaign.type === 'DELIVERY' ? (
              <>
                <Badge className="rounded-lg bg-rose-600 text-white hover:bg-rose-600">
                  {campaign.deliveryPlatformLabel}
                </Badge>
                {campaign.deliveryChannelLabels.map((label) => (
                  <Badge key={label} variant="outline" className="rounded-lg bg-white">
                    {label}
                  </Badge>
                ))}
              </>
            ) : (
              <Badge variant="outline" className="rounded-lg">
                {campaign.platform}
              </Badge>
            )}
            <span className="text-xs font-semibold text-gray-400">#{campaign.id}</span>
          </div>
          <div className="line-clamp-2 text-sm font-black leading-snug text-gray-900">
            {campaign.title}
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
            {detailText || campaign.intro}
          </p>
        </div>
      </div>
    </div>
  );
}

function CampaignGroup({
  title,
  campaigns,
  selectedIds,
  onToggle,
  emptyMessage = '조건에 맞는 캠페인이 없습니다.',
}: {
  title: string;
  campaigns: AdminCampaignEmailCampaign[];
  selectedIds: Set<number>;
  onToggle: (id: number, checked: boolean) => void;
  emptyMessage?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900">{title}</h3>
        <span className="text-xs font-bold text-gray-400">{campaigns.length}개</span>
      </div>
      <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
        {campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <CampaignSelectCard
              key={campaign.id}
              campaign={campaign}
              checked={selectedIds.has(campaign.id)}
              onCheckedChange={(checked) => onToggle(campaign.id, checked)}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectedCampaignOrderList({
  campaigns,
  onMove,
  onRemove,
}: {
  campaigns: AdminCampaignEmailCampaign[];
  onMove: (index: number, direction: 'UP' | 'DOWN') => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900">선택한 캠페인 순서</h3>
        <span className="text-xs font-bold text-gray-400">{campaigns.length}개</span>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs font-bold text-gray-500">
          메일에 넣을 캠페인을 선택하면 순서를 조정할 수 있습니다.
        </div>
      ) : (
        <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
          {campaigns.map((campaign, index) => (
            <div
              key={campaign.id}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-primary">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="rounded-lg bg-white text-[10px]">
                    {campaign.type === 'VISIT' ? '지역/방문' : '배송체험'}
                  </Badge>
                  {campaign.type === 'DELIVERY' && (
                    <Badge className="rounded-lg bg-rose-600 text-[10px] text-white hover:bg-rose-600">
                      {campaign.deliveryPlatformLabel}
                    </Badge>
                  )}
                  <span className="text-[10px] font-bold text-gray-400">#{campaign.id}</span>
                </div>
                <div className="truncate text-xs font-black text-gray-900">{campaign.title}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onMove(index, 'UP')}
                  disabled={index === 0}
                  className="h-8 w-8 rounded-lg p-0"
                  aria-label={`${campaign.title} 위로 이동`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onMove(index, 'DOWN')}
                  disabled={index === campaigns.length - 1}
                  className="h-8 w-8 rounded-lg p-0"
                  aria-label={`${campaign.title} 아래로 이동`}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemove(campaign.id)}
                  className="h-8 w-8 rounded-lg p-0 text-gray-500 hover:text-red-600"
                  aria-label={`${campaign.title} 제거`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampaignEmailComposer({ campaigns }: CampaignEmailComposerProps) {
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [activeTab, setActiveTab] = useState<CampaignListTab>('VISIT');
  const [deliveryChannelFilter, setDeliveryChannelFilter] = useState<DeliveryChannelFilter>('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const tabCounts = useMemo(() => ({
    VISIT: campaigns.filter((campaign) => campaign.type === 'VISIT').length,
    DELIVERY: campaigns.filter((campaign) => campaign.type === 'DELIVERY').length,
  }), [campaigns]);
  const campaignById = useMemo(
    () => new Map(campaigns.map((campaign) => [campaign.id, campaign])),
    [campaigns]
  );
  const selectedIds = useMemo(() => new Set(selectedCampaignIds), [selectedCampaignIds]);

  const regionOptions = useMemo(() => {
    const regions = campaigns
      .map((campaign) => campaign.regionLabel)
      .filter((region) => region && region !== '지역 확인 필요');

    return Array.from(new Set(regions)).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);

    return campaigns.filter((campaign) => {
      if (statusFilter !== 'ALL' && campaign.status !== statusFilter) return false;
      if (campaign.type !== activeTab) return false;
      if (regionFilter !== 'ALL' && campaign.regionLabel !== regionFilter) return false;
      if (activeTab === 'DELIVERY' && !matchesDeliveryChannel(campaign, deliveryChannelFilter)) return false;
      if (!normalizedQuery) return true;

      return normalizeText(getSearchText(campaign)).includes(normalizedQuery);
    });
  }, [activeTab, campaigns, deliveryChannelFilter, regionFilter, searchQuery, statusFilter]);

  const deliveryCampaigns = useMemo(
    () => filteredCampaigns
      .filter((campaign) => campaign.type === 'DELIVERY')
      .sort((a, b) => {
        if (a.deliverySortPriority !== b.deliverySortPriority) {
          return a.deliverySortPriority - b.deliverySortPriority;
        }
        return b.id - a.id;
      }),
    [filteredCampaigns]
  );
  const visitCampaigns = useMemo(
    () => filteredCampaigns.filter((campaign) => campaign.type === 'VISIT'),
    [filteredCampaigns]
  );
  const selectedCampaigns = useMemo(
    () => selectedCampaignIds
      .map((id) => campaignById.get(id))
      .filter((campaign): campaign is AdminCampaignEmailCampaign => Boolean(campaign)),
    [campaignById, selectedCampaignIds]
  );
  const visibleSelectedCount = useMemo(
    () => filteredCampaigns.filter((campaign) => selectedIds.has(campaign.id)).length,
    [filteredCampaigns, selectedIds]
  );
  const previewHtml = useMemo(
    () => buildCampaignPromotionEmailHtml(selectedCampaigns),
    [selectedCampaigns]
  );
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    activeTab !== 'VISIT' ||
    deliveryChannelFilter !== 'ALL' ||
    regionFilter !== 'ALL';
  const hiddenSelectedCount = selectedCampaigns.length - visibleSelectedCount;

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setActiveTab('VISIT');
    setDeliveryChannelFilter('ALL');
    setRegionFilter('ALL');
  };

  const handleToggle = (id: number, checked: boolean) => {
    setSelectedCampaignIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }

      return current.filter((selectedId) => selectedId !== id);
    });
  };

  const moveSelectedCampaign = (index: number, direction: 'UP' | 'DOWN') => {
    setSelectedCampaignIds((current) => {
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const removeSelectedCampaign = (id: number) => {
    setSelectedCampaignIds((current) => current.filter((selectedId) => selectedId !== id));
  };

  const handleCopyHtml = async () => {
    if (selectedCampaigns.length === 0) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(previewHtml);
      } else {
        throw new Error('Clipboard API is unavailable');
      }
      toast.success('이메일 HTML을 복사했습니다');
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = previewHtml;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();

      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (copied) {
        toast.success('이메일 HTML을 복사했습니다');
        return;
      }

      console.error('Failed to copy campaign email HTML:', error);
      toast.error('HTML 복사에 실패했습니다');
    }
  };

  return (
    <Card className="border-2 border-primary/10 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">진행 캠페인 메일 본문 생성</h2>
              <p className="mt-1 text-sm text-gray-500">선택한 캠페인만 이메일 본문에 들어갑니다.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-lg bg-primary text-white hover:bg-primary">
            선택 {selectedCampaigns.length}개
          </Badge>
          {hiddenSelectedCount > 0 && (
            <Badge variant="outline" className="rounded-lg border-amber-200 bg-amber-50 text-amber-700">
              필터 밖 선택 {hiddenSelectedCount}개
            </Badge>
          )}
          <Badge variant="secondary" className="rounded-lg">
            활성 {campaigns.length}개
          </Badge>
          <Badge variant="secondary" className="rounded-lg">
            검색결과 {filteredCampaigns.length}개
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(520px,1.1fr)]">
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 grid grid-cols-2 rounded-lg bg-white p-1">
              <button
                type="button"
                onClick={() => setActiveTab('VISIT')}
                className={`h-10 rounded-lg text-sm font-black transition ${
                  activeTab === 'VISIT'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                지역/방문 {tabCounts.VISIT}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('DELIVERY')}
                className={`h-10 rounded-lg text-sm font-black transition ${
                  activeTab === 'DELIVERY'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                배송체험 {tabCounts.DELIVERY}
              </button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="캠페인명, 지역, 매장명, 제공내역, ID 검색"
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm font-bold text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className={filterSelectClassName}
                aria-label="상태 필터"
              >
                <option value="ALL">상태 전체</option>
                <option value="RECRUITING">모집중</option>
                <option value="ONGOING">진행중</option>
              </select>

              <select
                value={deliveryChannelFilter}
                onChange={(event) => setDeliveryChannelFilter(event.target.value as DeliveryChannelFilter)}
                className={filterSelectClassName}
                aria-label="배송 채널 필터"
                disabled={activeTab !== 'DELIVERY'}
              >
                <option value="ALL">배송 채널 전체</option>
                <option value="BLOG_ONLY">블로그만</option>
                <option value="PURCHASE_ONLY">구매평만</option>
                <option value="PURCHASE_WITH_SNS">구매평+SNS</option>
                <option value="INSTAGRAM_ONLY">인스타그램만</option>
              </select>

              <select
                value={regionFilter}
                onChange={(event) => setRegionFilter(event.target.value)}
                className={filterSelectClassName}
                aria-label="지역 필터"
              >
                <option value="ALL">지역 전체</option>
                {regionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-gray-500">
                현재 조건에 맞는 캠페인 {filteredCampaigns.length}개
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="gap-2 rounded-lg"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                필터 초기화
              </Button>
            </div>
          </div>

          <SelectedCampaignOrderList
            campaigns={selectedCampaigns}
            onMove={moveSelectedCampaign}
            onRemove={removeSelectedCampaign}
          />

          {filteredCampaigns.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm font-bold text-gray-500">
              조건에 맞는 캠페인이 없습니다.
            </div>
          ) : activeTab === 'VISIT' ? (
            <CampaignGroup
              title="지역/방문"
              campaigns={visitCampaigns}
              selectedIds={selectedIds}
              onToggle={handleToggle}
            />
          ) : (
            <CampaignGroup
              title="배송체험"
              campaigns={deliveryCampaigns}
              selectedIds={selectedIds}
              onToggle={handleToggle}
            />
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
            <div className="mb-4">
              <div className="text-sm font-black text-gray-900">이메일 액션</div>
              <div className="mt-1 break-keep text-xs leading-relaxed text-gray-500">
                선택한 {selectedCampaigns.length}개 캠페인이 지정한 순서대로 본문에 반영됩니다.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <Button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                disabled={selectedCampaigns.length === 0}
                variant="outline"
                className="gap-2 rounded-lg bg-white"
              >
                <Mail className="h-4 w-4" />
                미리보기
              </Button>
              <Button
                onClick={handleCopyHtml}
                disabled={selectedCampaigns.length === 0}
                className="gap-2 rounded-lg"
              >
                <Clipboard className="h-4 w-4" />
                HTML 복사
              </Button>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-white p-3 text-xs leading-relaxed text-gray-500">
              <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                미리보기에서 최종 화면을 확인한 뒤 HTML을 복사해 발송 도구나 템플릿에 붙여넣으세요.
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-xs font-bold text-gray-500">이메일 제목</div>
            <div className="mt-2 break-keep text-sm font-black leading-relaxed text-gray-900">
              {CAMPAIGN_PROMOTION_EMAIL_SUBJECT}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>이메일 미리보기</DialogTitle>
            <DialogDescription>{CAMPAIGN_PROMOTION_EMAIL_SUBJECT}</DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex justify-end">
            <Button
              onClick={handleCopyHtml}
              disabled={selectedCampaigns.length === 0}
              size="sm"
              className="gap-2 rounded-lg"
            >
              <Clipboard className="h-4 w-4" />
              HTML 복사
            </Button>
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <iframe
              srcDoc={previewHtml}
              className="h-[560px] w-full bg-white"
              title="Campaign Email Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
