"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  color: string
  href?: string
  trend?: {
    value: string | number
    isPositive?: boolean
  }
}

export function StatCard({ title, value, description, icon, color, href, trend }: StatCardProps) {
  const content = (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group bg-white">
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
            <div className="flex items-center justify-between">
              {description && <p className="text-xs text-gray-400 font-medium">{description}</p>}
              {trend && (
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend.isPositive ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                  {trend.value}
                </div>
              )}
            </div>
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
