import { PlatformBadge } from '@/components/campaign/CampaignBadges';
import { resolveCampaignPlatformState } from '@/lib/campaignUtils';

interface CampaignPlatformBadgesProps {
  type?: string | null;
  platform?: string | null;
  includeReview?: boolean;
  includeNaver?: boolean;
  includeInstagram?: boolean;
}

export default function CampaignPlatformBadges({
  type,
  platform,
  includeReview,
  includeNaver,
  includeInstagram,
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

  if (resolved.normalizedType === 'DELIVERY') {
    return (
      <>
        {resolved.includeReview && <PlatformBadge platform="PURCHASE" />}
        {resolved.includeNaver && <PlatformBadge platform="BLOG" />}
        {resolved.includeInstagram && <PlatformBadge platform="INSTAGRAM" />}
        {!resolved.includeReview && !resolved.includeNaver && !resolved.includeInstagram && (
          <PlatformBadge platform={resolved.resolvedPlatform} />
        )}
      </>
    );
  }

  return <PlatformBadge platform={resolved.resolvedPlatform} />;
}
