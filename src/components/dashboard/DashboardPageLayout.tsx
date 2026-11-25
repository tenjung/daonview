"use client"

// 관리자·광고주·인플루언서 대시보드 공통 페이지 틀 (사이드바 + 본문)
import type { ReactNode } from "react"
import AdminSidebar from "@/components/AdminSidebar"
import AdvertiserSidebar from "@/components/AdvertiserSidebar"
import InfluencerSidebar from "@/components/InfluencerSidebar"
import DashboardSidebar from "@/components/DashboardSidebar"
import { ADVERTISER_NAV, INFLUENCER_NAV } from "@/constants/navigation"
import type { CampaignCounts } from "@/lib/adminUtils"
import type { DashboardRoleKey } from "@/constants/role"
import { cn } from "@/lib/utils"

interface DashboardPageLayoutProps {
  role: DashboardRoleKey
  children: ReactNode
  /** 관리자 사이드바 캠페인 카운트 (SSR) */
  sidebarCounts?: CampaignCounts
  containerClassName?: string
  /** 사이드바 표시 이름 (광고주·인플루언서, SSR 값 우선) */
  userName?: string
}

function RoleSidebarSlot({
  role,
  sidebarCounts,
  userName,
}: {
  role: DashboardRoleKey
  sidebarCounts?: CampaignCounts
  userName?: string
}) {
  if (role === "ADMIN") return <AdminSidebar initialCounts={sidebarCounts} />
  // SSR로 받은 이름이 있으면 그대로 써서 깜빡임 없이 표시
  if (userName) {
    return (
      <DashboardSidebar
        userType={role}
        userName={userName}
        links={role === "ADVERTISER" ? ADVERTISER_NAV : INFLUENCER_NAV}
      />
    )
  }
  if (role === "ADVERTISER") return <AdvertiserSidebar />
  return <InfluencerSidebar />
}

export default function DashboardPageLayout({
  role,
  children,
  sidebarCounts,
  containerClassName,
  userName,
}: DashboardPageLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <RoleSidebarSlot role={role} sidebarCounts={sidebarCounts} userName={userName} />
      <main className="flex-1 bg-gray-50/50 p-0 sm:p-4 md:p-6 overflow-y-auto">
        <div className={cn("max-w-full mx-auto w-full", containerClassName)}>
          {children}
        </div>
      </main>
    </div>
  )
}
