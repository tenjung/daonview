import Link from 'next/link';
import CampaignCarousel from '@/components/CampaignCarousel';

type HomeCampaignCardItem = {
  id: number | string;
  title: string;
  imageUrl?: string;
  type?: string;
  provision?: string | null;
  dday: string;
  applicants: number;
  total: number;
  platform: string;
  includeReview?: boolean;
  includeNaver?: boolean;
  includeInstagram?: boolean;
  region?: string | null;
  sub_region?: string | null;
  end_date?: string;
  created_at?: string;
};

interface CampaignSectionProps {
  badge: string;
  badgeClassName: string;
  title: string;
  titleEmoji: string;
  sectionClassName: string;
  viewAllHref: string;
  viewAllClassName: string;
  campaigns: HomeCampaignCardItem[];
}

export default function CampaignSection({
  badge,
  badgeClassName,
  title,
  titleEmoji,
  sectionClassName,
  viewAllHref,
  viewAllClassName,
  campaigns,
}: CampaignSectionProps) {
  return (
    <section className={sectionClassName}>
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-wider ${badgeClassName}`}>
              {badge}
            </span>
            <h2 className="text-xl md:text-3xl font-black text-text-main flex items-center gap-2">
              {title} <span>{titleEmoji}</span>
            </h2>
          </div>
          <Link href={viewAllHref} className={`text-sm font-bold transition-colors flex items-center gap-1 group ${viewAllClassName}`}>
            전체보기 <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
          </Link>
        </div>

        <CampaignCarousel
          campaigns={campaigns}
          maxItems={4}
          showNavigation={false}
        />
      </div>
    </section>
  );
}
