"use client"

// 관리자·광고주·인플루언서 대시보드 공통 통계 타일
import * as React from "react"
import Link from "next/link"

export type TileTone = "blue" | "purple" | "green" | "orange" | "red" | "yellow" | "gray"

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

interface StatTileGroupProps {
  children: React.ReactNode
  /** 데스크톱 한 줄 칸 수 (기본 4) */
  columns?: 3 | 4 | 7
}

const GROUP_COLUMNS: Record<NonNullable<StatTileGroupProps["columns"]>, string> = {
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  7: "grid-cols-4 lg:grid-cols-7",
}

export function StatTileGroup({ children, columns = 4 }: StatTileGroupProps) {
  return <div className={`grid ${GROUP_COLUMNS[columns]} gap-2 sm:gap-3 mb-6 sm:mb-8`}>{children}</div>
}
