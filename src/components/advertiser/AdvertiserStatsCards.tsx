"use client"

// 광고주 대시보드 통계: 공통 StatTile 사용
import { StatTile, StatTileGroup } from "@/components/dashboard/StatTile"

interface AdvertiserStatsCardsProps {
  stats: {
    activeCampaigns: number
    totalApplications: number
  }
}

export function AdvertiserStatsCards({ stats }: AdvertiserStatsCardsProps) {
  return (
    <StatTileGroup columns={4}>
      <StatTile label="진행 중 캠페인" value={stats.activeCampaigns} tone="red" href="/dashboard/advertiser/campaigns" />
      <StatTile label="누적 신청자" value={stats.totalApplications} tone="blue" href="/dashboard/advertiser/campaigns" />
    </StatTileGroup>
  )
}
