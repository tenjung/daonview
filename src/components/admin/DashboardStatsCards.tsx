"use client"

import * as React from "react"
import Link from "next/link"

type TileTone = "blue" | "purple" | "green" | "orange" | "red" | "yellow" | "gray"

const TONE_STYLES: Record<TileTone, { bar: string; active: string }> = {
  blue: { bar: "bg-blue-500", active: "bg-blue-50 border-blue-200" },
  purple: { bar: "bg-purple-500", active: "bg-purple-50 border-purple-200" },
  green: { bar: "bg-green-500", active: "bg-green-50 border-green-200" },
  orange: { bar: "bg-orange-500", active: "bg-orange-50 border-orange-200" },
  red: { bar: "bg-red-500", active: "bg-red-50 border-red-200" },
  yellow: { bar: "bg-yellow-400", active: "bg-yellow-50 border-yellow-200" },
  gray: { bar: "bg-gray-300", active: "bg-gray-50 border-gray-200" },
}

export interface StatTileProps {
  label: string
  value: number
  tone: TileTone
  /** 0이 아닐 때 배경을 진하게 강조 */
  highlight?: boolean
  href?: string
  onClick?: () => void
  disabled?: boolean
  title?: string
}

export function StatTile({ label, value, tone, highlight, href, onClick, disabled, title }: StatTileProps) {
  const style = TONE_STYLES[tone]
  const isActive = Boolean(highlight && value > 0)
  const className = `relative flex flex-col items-center sm:items-start justify-center gap-0.5 overflow-hidden rounded-xl border px-2 sm:px-4 py-2.5 sm:py-3 text-center sm:text-left transition-all ${
    isActive ? style.active : "bg-white border-gray-100"
  } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md hover:border-gray-300 cursor-pointer"}`

  const content = (
    <>
      <span className={`absolute left-0 top-0 h-1 w-full sm:h-full sm:w-1 ${style.bar}`} />
      <span className="text-[11px] sm:text-xs font-medium text-gray-500 whitespace-nowrap">{label}</span>
      <span className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{value.toLocaleString()}</span>
    </>
  )

  if (disabled) {
    return <div className={className} title={title} aria-disabled="true">{content}</div>
  }

  if (href) {
    return <Link href={href} className={className} title={title}>{content}</Link>
  }

  return (
    <button type="button" onClick={onClick} className={className} title={title}>
      {content}
    </button>
  )
}

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
    <div className="grid grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 mb-6 sm:mb-8">
      <StatTile label="광고주" value={stats.totalAdvertisers} tone="blue" href="/dashboard/admin/users/advertisers" />
      <StatTile label="인플루언서" value={stats.totalInfluencers} tone="purple" href="/dashboard/admin/users/influencers" />
      <StatTile label="오늘 신규" value={stats.todayCampaigns} tone="green" href="/dashboard/admin/campaigns" />
      <StatTile label="승인 대기" value={stats.pendingApprovals} tone="orange" highlight href="/dashboard/admin/campaigns" />
      <StatTile label="🔴 위험" value={criticalCount} tone="red" highlight onClick={onCriticalClick} title="마감 3일 이내 + 신청률 50% 미만" />
      <StatTile label="🟡 주의" value={warningCount} tone="yellow" highlight onClick={onWarningClick} title="마감 임박 또는 신청률 50% 미만" />
      <StatTile label="⚖️ 법적" value={0} tone="gray" disabled title="데이터 연결 전" />
    </div>
  )
}
