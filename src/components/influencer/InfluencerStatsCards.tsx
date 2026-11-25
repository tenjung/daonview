"use client"

// 인플루언서 대시보드 통계: 공통 StatTile 사용 (모바일·데스크톱 동일 구성)
import { StatTile, StatTileGroup } from "@/components/dashboard/StatTile"

interface InfluencerStats {
    total: number;
    approved: number;
    pending: number;
}

export function InfluencerStatsCards({ stats }: { stats: InfluencerStats }) {
    return (
        <StatTileGroup columns={3}>
            <StatTile label="신청한 캠페인" value={stats.total} tone="blue" href="/dashboard/influencer/campaigns" />
            <StatTile label="선정된 캠페인" value={stats.approved} tone="green" href="/dashboard/influencer/campaigns" />
            <StatTile label="작성할 리뷰" value={stats.pending} tone="orange" highlight href="/dashboard/influencer/reviews" />
        </StatTileGroup>
    );
}
