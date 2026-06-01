"use client"

import * as React from "react"
import { Campaign } from "@/types/database"
import { DataTable } from "@/components/ui/data-table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { createCampaignColumns } from "./campaigns-columns"
import { useSearchParams } from "next/navigation"

interface CampaignDataTableProps {
  data: Campaign[]
  isAdmin?: boolean
  onApprove?: (id: number, title: string) => void
  onReject?: (id: number, title: string) => void
  onEdit?: (id: number) => void
  onDelete?: (id: number, title: string) => void
  onExtend?: (id: number, title: string) => void
  onClose?: (id: number, title: string) => void
  onView?: (id: number) => void
  isLoading?: boolean
  currentUserId?: string | null
  currentUserRole?: string | null
}

export function CampaignDataTable({
  data = [],
  isAdmin = false,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onExtend,
  onClose,
  onView,
  isLoading = false,
  currentUserId,
  currentUserRole,
}: CampaignDataTableProps) {
  const searchParams = useSearchParams()
  const initialFilter = React.useMemo(() => {
    const requestedFilter = (searchParams.get("tab") || searchParams.get("status") || "active").toLowerCase()
    const allowedFilters = new Set(["all", "pending", "upcoming", "active", "completed", "draft"])
    return allowedFilters.has(requestedFilter) ? requestedFilter : "active"
  }, [searchParams])
  const [filter, setFilter] = React.useState<string>(initialFilter)

  React.useEffect(() => {
    setFilter(initialFilter)
  }, [initialFilter])

  // 필터링된 데이터
  const filteredData = React.useMemo(() => {
    if (filter === "all") return data
    if (filter === "upcoming") {
        const today = new Date().toISOString().split('T')[0];
        return data.filter(c => c.status === 'RECRUITING' && (c.recruitment_start_date || c.created_at || "").split('T')[0] > today)
    }
    if (filter === "active") {
        const today = new Date().toISOString().split('T')[0];
        return data.filter(c => 
            c.status === 'ONGOING' || 
            (c.status === 'RECRUITING' && (c.recruitment_start_date || c.created_at || "").split('T')[0] <= today)
        )
    }
    return data.filter((item) => item.status?.toUpperCase() === filter.toUpperCase())
  }, [data, filter])

  // 통계 및 탭 카운트 데이터
  const counts = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      all: data.length,
      pending: data.filter(c => c.status === 'PENDING').length,
      upcoming: data.filter(c => c.status === 'RECRUITING' && (c.recruitment_start_date || c.created_at || "").split('T')[0] > today).length,
      active: data.filter(c => c.status === 'ONGOING' || (c.status === 'RECRUITING' && (c.recruitment_start_date || c.created_at || "").split('T')[0] <= today)).length,
      completed: data.filter(c => c.status === 'COMPLETED').length,
      draft: data.filter(c => c.status === 'DRAFT').length,
    }
  }, [data])

  // 컬럼 정의
  const columns = React.useMemo(
    () => createCampaignColumns({
      isAdmin,
      onApprove,
      onReject,
      onEdit,
      onDelete,
      onExtend,
      onClose,
      onView,
      currentUserId,
      currentUserRole,
    }),
    [isAdmin, onApprove, onReject, onEdit, onDelete, onExtend, onClose, onView, currentUserId, currentUserRole]
  )

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* 필터 탭 */}
      <div className="flex items-center justify-between w-full px-4 sm:px-0">
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <div className="overflow-x-auto w-full pb-2 -mb-2 custom-scrollbar">
            <TabsList className="bg-gray-100/50 p-1 h-auto min-w-max flex">
              <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                진행중 <Badge variant="secondary" className="bg-green-100 text-green-600 border-none px-1.5 h-5 min-w-[20px] flex justify-center">{counts.active}</Badge>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                  요청중 <Badge variant="default" className="bg-orange-500 text-white border-none px-1.5 h-5 min-w-[20px] flex justify-center">{counts.pending}</Badge>
                </TabsTrigger>
              )}
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                진행전 <Badge variant="secondary" className="bg-blue-100 text-blue-600 border-none px-1.5 h-5 min-w-[20px] flex justify-center">{counts.upcoming}</Badge>
              </TabsTrigger>
              {!isAdmin && (
                <TabsTrigger value="draft" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                  임시저장 <Badge variant="secondary" className="bg-gray-200 text-gray-600 border-none px-1.5 h-5 min-w-[20px] flex justify-center">{counts.draft}</Badge>
                </TabsTrigger>
              )}
              <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                마감/완료 <Badge variant="secondary" className="bg-purple-100 text-purple-600 border-none px-1.5 h-5 min-w-[20px] flex justify-center">{counts.completed}</Badge>
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                전체 <Badge variant="secondary" className="bg-gray-200 text-gray-600 border-none px-1.5 h-5 min-w-[20px] flex justify-center">{counts.all}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* 데이터 테이블 */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchKey="title"
        searchPlaceholder="캠페인 제목으로 검색..."
        isLoading={isLoading}
        enableRowSelection={true}
      />
    </div>
  )
}
