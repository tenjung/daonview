"use client"

import { StatTile, StatTileGroup } from "@/components/dashboard/StatTile"

export interface DashboardStats {
  totalAdvertisers: number
  totalInfluencers: number
  todayCampaigns: number
  pendingApprovals: number
}

interface DashboardStatsCardsProps {
  stats: DashboardStats
  criticalCount: number
  warningCount: number
  onCriticalClick: () => void
  onWarningClick: () => void
}

export function DashboardStatsCards({
  stats,
  criticalCount,
  warningCount,
  onCriticalClick,
  onWarningClick,
}: DashboardStatsCardsProps) {
  return (
    <StatTileGroup columns={7}>
      <StatTile label="광고주" value={stats.totalAdvertisers} tone="blue" href="/dashboard/admin/users/advertisers" />
      <StatTile label="인플루언서" value={stats.totalInfluencers} tone="purple" href="/dashboard/admin/users/influencers" />
      <StatTile label="오늘 신규" value={stats.todayCampaigns} tone="green" href="/dashboard/admin/campaigns" />
      <StatTile label="승인 대기" value={stats.pendingApprovals} tone="orange" highlight href="/dashboard/admin/campaigns" />
      <StatTile label="🔴 위험" value={criticalCount} tone="red" highlight onClick={onCriticalClick} title="마감 3일 이내 + 신청률 50% 미만" />
      <StatTile label="🟡 주의" value={warningCount} tone="yellow" highlight onClick={onWarningClick} title="마감 임박 또는 신청률 50% 미만" />
      <StatTile label="⚖️ 법적" value={0} tone="gray" disabled title="데이터 연결 전" />
    </StatTileGroup>
  )
}
