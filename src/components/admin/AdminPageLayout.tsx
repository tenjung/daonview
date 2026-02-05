"use client"

import React from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { cn } from '@/lib/utils'

interface AdminPageLayoutProps {
  children: React.ReactNode
  sidebarCounts?: any
  containerClassName?: string
}

export default function AdminPageLayout({
  children,
  sidebarCounts,
  containerClassName
}: AdminPageLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar initialCounts={sidebarCounts} />
      <main className="flex-1 bg-gray-50/50 p-6 md:p-8 overflow-y-auto">
        <div className={cn("max-w-full mx-auto w-full", containerClassName)}>
          {children}
        </div>
      </main>
    </div>
  )
}
