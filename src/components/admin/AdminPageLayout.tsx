"use client"

// 기존 관리자 화면 호환용: 공통 DashboardPageLayout(role=ADMIN)을 그대로 사용한다.
import React from 'react'
import DashboardPageLayout from '@/components/dashboard/DashboardPageLayout'
import type { CampaignCounts } from '@/lib/adminUtils'

interface AdminPageLayoutProps {
  children: React.ReactNode
  sidebarCounts?: CampaignCounts
  containerClassName?: string
}

export default function AdminPageLayout({
  children,
  sidebarCounts,
  containerClassName
}: AdminPageLayoutProps) {
  return (
    <DashboardPageLayout role="ADMIN" sidebarCounts={sidebarCounts} containerClassName={containerClassName}>
      {children}
    </DashboardPageLayout>
  )
}
