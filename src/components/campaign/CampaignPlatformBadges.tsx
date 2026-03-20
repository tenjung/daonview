import { PlatformBadge } from '@/components/campaign/CampaignBadges';
import { resolveCampaignPlatformState } from '@/lib/campaignUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CampaignPlatformBadgesProps {
  type?: string | null;
  platform?: string | null;
  includeReview?: boolean;
  includeNaver?: boolean;
  includeInstagram?: boolean;
  showTooltip?: boolean;
}

export default function CampaignPlatformBadges({
  type,
  platform,
  includeReview,
  includeNaver,
  includeInstagram,
  showTooltip = false,
}: CampaignPlatformBadgesProps) {
  const resolved = resolveCampaignPlatformState({
    type,
    platform,
    step1Data: {
      includeReview,
      includeNaver,
      includeInstagram,
      platform,
    },
  });

  const typeLabel =
    resolved.normalizedType === 'DELIVERY'
      ? '배송체험단'
      : resolved.normalizedType === 'PRESS'
        ? '기자단'
        : resolved.normalizedType === 'PURCHASE'
          ? '구매형 캠페인'
          : '방문체험단';

  const conditionParts: string[] =
    resolved.normalizedType === 'DELIVERY'
      ? [
        ...(resolved.includeReview ? ['구매평'] : []),
        ...(resolved.includeNaver ? ['블로그'] : []),
        ...(resolved.includeInstagram ? ['인스타그램'] : []),
      ]
      : [resolved.resolvedPlatform === 'INSTAGRAM' ? '인스타그램' : '블로그'];

  const conditionLabel = conditionParts.length > 0 ? conditionParts.join(' + ') : '조건 확인 필요';

  const wrapWithTooltip = (key: string, node: React.ReactNode) => {
    if (!showTooltip) return <span key={key}>{node}</span>;
    return (
      <Tooltip key={key}>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-slate-900 text-white border-slate-700">
          <div className="space-y-1 text-[11px] leading-relaxed">
            <p>캠페인 유형: {typeLabel}</p>
            <p>참여 조건: {conditionLabel}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  const badgeNodes: React.ReactNode[] = [];

  if (resolved.normalizedType === 'DELIVERY') {
    if (resolved.includeReview) badgeNodes.push(wrapWithTooltip('purchase', <PlatformBadge platform="PURCHASE" />));
    if (resolved.includeNaver) badgeNodes.push(wrapWithTooltip('blog', <PlatformBadge platform="BLOG" />));
    if (resolved.includeInstagram) badgeNodes.push(wrapWithTooltip('instagram', <PlatformBadge platform="INSTAGRAM" />));
    if (!resolved.includeReview && !resolved.includeNaver && !resolved.includeInstagram) {
      badgeNodes.push(wrapWithTooltip('fallback', <PlatformBadge platform={resolved.resolvedPlatform} />));
    }
  } else {
    badgeNodes.push(wrapWithTooltip('default', <PlatformBadge platform={resolved.resolvedPlatform} />));
  }

  if (!showTooltip) return <>{badgeNodes}</>;
  return <TooltipProvider delayDuration={250}>{badgeNodes}</TooltipProvider>;
}
