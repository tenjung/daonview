"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Megaphone, CreditCard } from "lucide-react"
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

interface AdvertiserStatsCardsProps {
  stats: {
    activeCampaigns: number
    totalApplications: number
    pointBalance: number
  }
}

export function AdvertiserStatsCards({ stats }: AdvertiserStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="진행 중인 캠페인"
        value={stats.activeCampaigns}
        description="모집 및 진행 중인 캠페인 수"
        icon={<Megaphone size={20} />}
        color="bg-rose-500"
        href="/dashboard/advertiser/campaigns"
      />
      <StatCard
        title="총 신청자 수"
        value={stats.totalApplications.toLocaleString()}
        description="전체 캠페인 누적 신청자"
        icon={<Users size={20} />}
        color="bg-blue-500"
        href="/dashboard/advertiser/campaigns"
      />
      <StatCard
        title="포인트 잔액"
        value={stats.pointBalance.toLocaleString() + ' P'}
        description="캠페인 등록 가능 잔액"
        icon={<CreditCard size={20} />}
        color="bg-emerald-500"
      />
    </div>
  )
}
