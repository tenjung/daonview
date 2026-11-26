// 관리자·광고주·인플루언서 대시보드 공통 페이지 제목 영역 (시안 A: 아이콘 + 제목 + 설명 + 오른쪽 액션)
import type { ComponentType, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DashboardPageHeaderProps {
  title: ReactNode
  description?: ReactNode
  icon?: ComponentType<{ className?: string }>
  /** 오른쪽 버튼 영역 */
  actions?: ReactNode
  /** 제목 위 보조 영역 (뒤로가기 링크 등) */
  eyebrow?: ReactNode
  className?: string
}

export default function DashboardPageHeader({
  title,
  description,
  icon: Icon,
  actions,
  eyebrow,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 px-4 pt-4 sm:px-0 sm:pt-0",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3 tracking-tight">
          {Icon && <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />}
          <span className="min-w-0 break-keep">{title}</span>
        </h1>
        {description && (
          <p className="text-gray-500 mt-1 sm:mt-1.5 font-medium text-xs sm:text-sm break-keep">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">{actions}</div>}
    </div>
  )
}
