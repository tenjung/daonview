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
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group">
      <CardContent className="p-0">
        <div className="flex items-stretch h-32">
          <div className={`w-2 ${color}`} />
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-3xl font-bold mt-1 group-hover:scale-105 transition-transform origin-left">{value}</h3>
              </div>
              <div className={`p-3 rounded-2xl ${color.replace('bg-', 'bg-opacity-10 bg-')} ${color.replace('bg-', 'text-')}`}>
                {icon}
              </div>
            </div>
            <p className="text-xs text-gray-400 font-medium">{description}</p>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
