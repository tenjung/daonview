"use client"

import * as React from "react"
import { Campaign } from "@/types/database"
import { CampaignDataTable } from "./CampaignDataTable"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import ConfirmDialog from "@/components/ConfirmDialog"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

interface UnifiedAdvertiserCampaignsProps {
  initialData: Campaign[]
}

export function UnifiedAdvertiserCampaigns({ initialData }: UnifiedAdvertiserCampaignsProps) {
  const [data, setData] = React.useState<Campaign[]>(initialData)
  const [isLoading, setIsLoading] = React.useState(false)
  const [showExtendModal, setShowExtendModal] = React.useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<number | null>(null)
  const router = useRouter()
  const { user, profile } = useAuthStore()

  // Confirm Dialog State (Delete)
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    type: "info" | "danger" | "warning"
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "info",
  })

  // 삭제 처리
  const handleDelete = (id: number, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: "캠페인 삭제",
      message: `"${title}" 캠페인을 정말 삭제하시겠습니까? 삭제된 캠페인은 복구할 수 없습니다.`,
      type: "danger",
      onConfirm: async () => {
        setIsLoading(true)
        const { error } = await supabase
          .from("campaigns")
          .delete()
          .eq("id", id)

        if (error) {
          toast.error("삭제 중 오류가 발생했습니다.")
          console.error(error)
        } else {
          toast.success("캠페인이 삭제되었습니다.")
          setData(prev => prev.filter(c => c.id !== id))
        }
        setIsLoading(false)
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      },
    })
  }

  // 수정 페이지로 이동
  const handleEdit = (id: number) => {
    router.push(`/dashboard/campaign/new?id=${id}`)
  }

  // 상세 보기
  const handleView = (id: number) => {
    router.push(`/campaigns/${id}`)
  }

  // 기간 연장 모달 열기
  const handleExtend = (id: number) => {
    setSelectedCampaignId(id)
    setShowExtendModal(true)
  }

  // 기간 연장 처리
  const processExtend = async (days: number) => {
    if (!selectedCampaignId) return
    
    setIsLoading(true)
    try {
        const response = await fetch('/api/campaigns/extend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: selectedCampaignId, days }),
        })

        const payload = await response.json().catch(() => ({} as Record<string, unknown>))
        if (!response.ok) {
          const errorMessage = typeof payload.error === 'string' ? payload.error : '기간 연장 요청에 실패했습니다.'
          throw new Error(errorMessage)
        }

        const endDate = typeof payload.endDate === 'string' ? payload.endDate : ''
        if (!endDate) throw new Error('연장 결과(endDate)를 받지 못했습니다.')

        toast.success(`모집 기간이 ${days}일 연장되었습니다!`)
        setShowExtendModal(false)
        
        // 로컬 상태 업데이트
        setData(prev => prev.map(c => 
            c.id === selectedCampaignId ? { ...c, end_date: endDate } : c
        ))
    } catch (error) {
        console.error('기간 연장 오류:', error)
        toast.error(error instanceof Error ? error.message : '기간 연장 중 오류가 발생했습니다.')
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <>
      <CampaignDataTable
        data={data}
        isAdmin={false}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExtend={handleExtend}
        onView={handleView}
        isLoading={isLoading}
        currentUserId={user?.id || null}
        currentUserRole={profile?.role || null}
      />

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="삭제하기"
      />

      {/* 기간 연장 모달 (shadcn/ui로 교체해도 되지만 일단 기존 로직 유지) */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 italic">D-Day Extend</h3>
                <p className="text-gray-600 mb-8">
                    캠페인의 모집 기간을 연장하시겠습니까? <br/>
                    연장된 기간은 즉시 적용됩니다.
                </p>

                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[3, 7, 14].map(days => (
                        <button
                            key={days}
                            onClick={() => processExtend(days)}
                            className="group flex flex-col items-center justify-center gap-1 p-4 bg-gray-50 border-2 border-transparent rounded-2xl hover:bg-rose-50 hover:border-rose-200 transition-all"
                        >
                            <span className="text-lg font-bold text-gray-900 group-hover:text-primary">+{days}일</span>
                            <span className="text-[10px] text-gray-400">연장하기</span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowExtendModal(false)}
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-all text-sm"
                    >
                        창 닫기
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  )
}
