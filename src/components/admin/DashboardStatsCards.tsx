"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Megaphone, Clock, Briefcase } from "lucide-react"
import Link from "next/link"

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  color: string
  href?: string
}

function StatCard({ title, value, description, icon, color, href }: StatCardProps) {
  const content = (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group h-full">
      <CardContent className="p-0 h-full">
        <div className="flex flex-col sm:flex-row items-stretch h-full sm:h-24">
          {/* 모바일에서는 상단 라인, 데스크탑에서는 좌측 라인 */}
          <div className={`h-1.5 sm:h-auto sm:w-2 shrink-0 ${color}`} />
          <div className="flex-1 p-4 flex flex-col justify-center sm:justify-between items-start sm:items-start text-left relative gap-2 sm:gap-0">
            {/* 아이콘: 모바일은 우측 상단 절대배치, 데스크탑은 우측 흐름배치 */}
            <div className={`absolute top-4 right-4 sm:static sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2 p-2 rounded-xl ${color.replace('bg-', 'bg-opacity-10 bg-')} flex-shrink-0 ${color.replace('bg-', 'text-')}`}>
              {icon}
            </div>
            
            <div className="flex flex-col w-full pr-10 sm:pr-14">
              <p className="text-xs font-medium text-gray-500 whitespace-nowrap mb-0.5">{title}</p>
              <h3 className="text-2xl sm:text-xl font-bold group-hover:scale-105 transition-transform origin-left">{value}</h3>
            </div>
            
            <p className="hidden sm:block text-xs text-gray-400 font-medium">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

interface DashboardStatsCardsProps {
  stats: {
    totalAdvertisers: number
    totalInfluencers: number
    todayCampaigns: number
    pendingApprovals: number
  }
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
      <StatCard
        title="총 광고주"
        value={stats.totalAdvertisers.toLocaleString()}
        description="기업/브랜드 계정 수"
        icon={<Briefcase size={20} />}
        color="bg-blue-500"
        href="/admin/users?tab=ADVERTISER"
      />
      <StatCard
        title="총 인플루언서"
        value={stats.totalInfluencers.toLocaleString()}
        description="리뷰어 계정 수"
        icon={<Users size={20} />}
        color="bg-purple-500"
        href="/admin/users?tab=INFLUENCER"
      />
      <StatCard
        title="오늘 신규 캠페인"
        value={stats.todayCampaigns}
        description="오늘 등록된 캠페인"
        icon={<Megaphone size={20} />}
        color="bg-green-500"
        href="/dashboard/admin/campaigns"
      />
      <StatCard
        title="승인 대기"
        value={stats.pendingApprovals}
        description="검토 필요한 캠페인"
        icon={<Clock size={20} />}
        color="bg-orange-500"
        href="/dashboard/admin/campaigns"
      />
    </div>
  )
}
