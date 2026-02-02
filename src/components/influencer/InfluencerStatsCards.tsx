import { FileText, CheckCircle, Clock } from "lucide-react"
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
            icon: <FileText size={20} />,
            color: "bg-blue-500",
            description: "지금까지 신청한 총 캠페인 수"
        },
        {
            title: "선정된 캠페인",
            value: stats.approved,
            icon: <CheckCircle size={20} />,
            color: "bg-green-500",
            description: "광고주로부터 선정된 캠페인 수"
        },
        {
            title: "작성해야 할 리뷰",
            value: stats.pending,
            icon: <Clock size={20} />,
            color: "bg-orange-500",
            description: "선정 후 리뷰 작성이 필요한 캠페인"
        }
    ];

    return (
        <div className="grid gap-6 md:grid-cols-3 mb-10">
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
    );
}
