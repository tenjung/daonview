"use client"

import * as React from "react"
import { Campaign } from "@/types/database"
import { CampaignDataTable } from "./CampaignDataTable"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import ConfirmDialog from "@/components/ConfirmDialog"
import { useRouter } from "next/navigation"

interface UnifiedAdminCampaignsProps {
  initialData: Campaign[]
}

export function UnifiedAdminCampaigns({ initialData }: UnifiedAdminCampaignsProps) {
  const [data, setData] = React.useState<Campaign[]>(initialData)
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  // Confirm Dialog State
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    type: "info" | "danger" | "warning"
    confirmText?: string
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
    type: "info",
  })

  // 승인 처리
  const handleApprove = (id: number, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: "캠페인 승인",
      message: `"${title}" 캠페인을 승인하시겠습니까?\n승인 후 모집 일정이 활성화됩니다.`,
      type: "info",
      confirmText: "승인하기",
      onConfirm: async () => {
        setIsLoading(true)
        const { error } = await supabase
          .from("campaigns")
          .update({ status: "RECRUITING" })
          .eq("id", id)

        if (error) {
          toast.error("승인 처리 중 오류가 발생했습니다.")
          console.error(error)
        } else {
          toast.success("캠페인이 승인되었습니다.")
          
          // [추가] 캠페인 승인 알림 생성
          try {
            // 캠페인 생성자 정보 조회
            const { data: campaignData, error: campaignError } = await supabase
              .from("campaigns")
              .select("created_by")
              .eq("id", id)
              .single();
            
            if (!campaignError && campaignData?.created_by) {
              await supabase.from("notifications").insert([{
                user_id: campaignData.created_by,
                type: 'CAMPAIGN_APPROVED',
                title: '캠페인 승인 완료',
                content: `"${title}" 캠페인이 승인되어 모집이 시작되었습니다.`,
                link: '/dashboard/advertiser/campaigns'
              }]);
            }
          } catch (notiError) {
            console.error("Notification Error:", notiError);
          }

          // 로컬 상태 업데이트
          setData(prev => prev.map(c => c.id === id ? { ...c, status: "RECRUITING" } : c))
        }
        setIsLoading(false)
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      },
    })
  }

  // 거절 처리
  const handleReject = (id: number, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: "캠페인 거절",
      message: `"${title}" 캠페인을 거절하시겠습니까?`,
      type: "danger",
      confirmText: "거절하기",
      onConfirm: async () => {
        setIsLoading(true)
        const { error } = await supabase
          .from("campaigns")
          .update({ status: "REJECTED" })
          .eq("id", id)

        if (error) {
          toast.error("거절 처리 중 오류가 발생했습니다.")
          console.error(error)
        } else {
          toast.success("캠페인이 거절되었습니다.")
          // 로컬 상태 업데이트
          setData(prev => prev.map(c => c.id === id ? { ...c, status: "REJECTED" } : c))
        }
        setIsLoading(false)
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      },
    })
  }

  // 상세 보기 (광고주 신청자 관리로 이동)
  const handleView = (id: number) => {
    router.push(`/dashboard/admin/campaigns/${id}`)
  }

  // 캠페인 수정
  const handleEdit = (id: number) => {
    router.push(`/dashboard/campaign/new?id=${id}`)
  }

  // 캠페인 삭제
  const handleDelete = (id: number, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: "캠페인 삭제",
      message: `"${title}" 캠페인을 영구적으로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      type: "danger",
      confirmText: "삭제하기",
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

  return (
    <>
      <CampaignDataTable
        data={data}
        isAdmin={true}
        onApprove={handleApprove}
        onReject={handleReject}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
      />
    </>
  )
}
