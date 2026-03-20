'use client';

interface InfluencerSummaryItem {
  label: string;
  value: number | string;
  tone?: 'neutral' | 'blue' | 'green' | 'orange' | 'red' | 'rose';
}

interface InfluencerSummaryBannerProps {
  items: InfluencerSummaryItem[];
  columns?: 2 | 3 | 4 | 5;
}

const toneClassMap: Record<NonNullable<InfluencerSummaryItem['tone']>, string> = {
  neutral: 'bg-gray-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  rose: 'bg-rose-500',
};

const columnClassMap: Record<NonNullable<InfluencerSummaryBannerProps['columns']>, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2',
  5: 'grid-cols-3',
};

export function InfluencerSummaryBanner({
  items,
  columns = 3,
}: InfluencerSummaryBannerProps) {
  return (
    <div className="overflow-hidden border-y border-gray-100 bg-white sm:hidden">
      <div className={`grid ${columnClassMap[columns]} ${columns > 3 ? 'gap-y-0' : ''}`}>
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className={`px-3 py-4 text-center ${
              index < items.length - 1 ? 'border-r border-gray-100' : ''
            } ${columns > 3 && index < items.length - (items.length % 2 === 0 ? 2 : 1) ? '' : ''}`}
          >
            <div className={`mx-auto mb-2 h-1.5 w-8 rounded-full ${toneClassMap[item.tone || 'neutral']}`} />
            <p className="text-[12px] font-bold leading-tight text-gray-500">{item.label}</p>
            <p className="mt-2 text-3xl font-black leading-none text-gray-950">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
