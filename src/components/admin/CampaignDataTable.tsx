"use client"

import * as React from "react"
import { Campaign } from "@/types/database"
import { DataTable } from "@/components/ui/data-table"
import { StatsCards, StatCard } from "@/components/data-table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { createCampaignColumns } from "./campaigns-columns"
import { Megaphone, Clock, CheckCircle, XCircle, FileText } from "lucide-react"

interface CampaignDataTableProps {
  data: Campaign[]
  isAdmin?: boolean
  onApprove?: (id: number, title: string) => void
  onReject?: (id: number, title: string) => void
  onEdit?: (id: number) => void
  onDelete?: (id: number, title: string) => void
  onExtend?: (id: number, title: string) => void
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
  onView,
  isLoading = false,
  currentUserId,
  currentUserRole,
}: CampaignDataTableProps) {
  const [filter, setFilter] = React.useState<string>("all")

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

  const stats: StatCard[] = React.useMemo(() => {
    const baseStats = [
        { title: "전체", value: counts.all, icon: Megaphone },
        { title: "진행중", value: counts.active, icon: Clock },
        { title: "완료", value: counts.completed, icon: CheckCircle },
    ];

    if (isAdmin) {
        return [
            ...baseStats,
            { title: "승인대기", value: counts.pending, icon: FileText },
        ];
    }

    return [
        ...baseStats,
        { title: "임시저장", value: counts.draft, icon: FileText },
    ];
  }, [counts, isAdmin])

  // 컬럼 정의
  const columns = React.useMemo(
    () => createCampaignColumns({
      isAdmin,
      onApprove,
      onReject,
      onEdit,
      onDelete,
      onExtend,
      onView,
      currentUserId,
      currentUserRole,
    }),
    [isAdmin, onApprove, onReject, onEdit, onDelete, onExtend, onView, currentUserId, currentUserRole]
  )

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* 상단 통계 */}
      <StatsCards stats={stats} />

      {/* 필터 탭 */}
      <div className="flex items-center justify-between w-full px-4 sm:px-0">
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <div className="overflow-x-auto w-full pb-2 -mb-2 custom-scrollbar">
            <TabsList className="bg-gray-100/50 p-1 h-auto min-w-max flex">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                전체 <Badge variant="secondary" className="bg-gray-200 text-gray-600 border-none px-1.5 h-5 min-w-[20px] flex justify-center">{counts.all}</Badge>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                  요청중 <Badge variant="default" className="bg-orange-500 text-white border-none px-1.5 h-5 min-w-[20px] flex justify-center">{counts.pending}</Badge>
                </TabsTrigger>
              )}
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                진행전 <Badge variant="secondary" className="bg-blue-100 text-blue-600 border-none px-1.5 h-5 min-w-[20px] flex justify-center">{counts.upcoming}</Badge>
              </TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                진행중 <Badge variant="secondary" className="bg-green-100 text-green-600 border-none px-1.5 h-5 min-w-[20px] flex justify-center">{counts.active}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                완료 <Badge variant="secondary" className="bg-purple-100 text-purple-600 border-none px-1.5 h-5 min-w-[20px] flex justify-center">{counts.completed}</Badge>
              </TabsTrigger>
              <TabsTrigger value="draft" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                임시저장 <Badge variant="secondary" className="bg-gray-200 text-gray-600 border-none px-1.5 h-5 min-w-[20px] flex justify-center">{counts.draft}</Badge>
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
