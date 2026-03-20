import { InfluencerSummaryBanner } from "@/components/influencer/InfluencerSummaryBanner"
import { StatCard } from "@/components/ui/stat-card"

interface InfluencerStats {
    total: number;
    approved: number;
    pending: number;
}

export function InfluencerStatsCards({ stats }: { stats: InfluencerStats }) {
  const statsConfig = [
        {
            title: "신청한 캠페인",
            value: stats.total,
            icon: null,
            color: "bg-blue-500",
            description: "지금까지 신청한 총 캠페인 수"
        },
        {
            title: "선정된 캠페인",
            value: stats.approved,
            icon: null,
            color: "bg-green-500",
            description: "광고주로부터 선정된 캠페인 수"
        },
        {
            title: "작성해야 할 리뷰",
            value: stats.pending,
            icon: null,
            color: "bg-orange-500",
            description: "선정 후 리뷰 작성이 필요한 캠페인"
        }
    ];

    return (
        <>
            <div className="mb-6 sm:hidden">
                <InfluencerSummaryBanner
                    items={statsConfig.map((stat) => ({
                        label: stat.title,
                        value: stat.value,
                        tone:
                            stat.color === 'bg-blue-500'
                                ? 'blue'
                                : stat.color === 'bg-green-500'
                                  ? 'green'
                                  : 'orange',
                    }))}
                />
            </div>

            <div className="hidden gap-6 md:grid-cols-3 mb-10 sm:grid">
                {statsConfig.map((stat) => (
                    <StatCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        description={stat.description}
                    />
                ))}
            </div>
        </>
    );
}
