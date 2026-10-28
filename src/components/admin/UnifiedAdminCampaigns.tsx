"use client"

import * as React from "react"
import type { RowSelectionState } from "@tanstack/react-table"
import { Campaign } from "@/types/database"
import { CampaignDataTable } from "./CampaignDataTable"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import ConfirmDialog from "@/components/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { CAMPAIGN_ACTION_LABELS, canApplyCampaignAction } from "@/lib/campaignActionTypes"
import type { CampaignAction, CampaignActionResult, CampaignBulkResponse } from "@/lib/campaignActionTypes"

interface UnifiedAdminCampaignsProps { initialData: Campaign[] }

export function UnifiedAdminCampaigns({ initialData }: UnifiedAdminCampaignsProps) {
  const [data, setData] = React.useState<Campaign[]>(initialData)
  const [isLoading, setIsLoading] = React.useState(false)
  const busyRef = React.useRef(false)
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [report, setReport] = React.useState<{ results: CampaignActionResult[]; excluded: number; cacheWarning?: string } | null>(null)
  const [requestError, setRequestError] = React.useState<string | null>(null)
  const router = useRouter()
  React.useEffect(() => { setData(initialData) }, [initialData])
  const resetSelection = React.useCallback(() => setRowSelection({}), [])
  const selected = data.filter(campaign => rowSelection[String(campaign.id)])

  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void;
    type: "info" | "danger" | "warning"; confirmText?: string;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {}, type: "info" })

  const executeAction = async (action: CampaignAction, campaigns: Campaign[], excluded: number) => {
    if (busyRef.current) return
    busyRef.current = true
    setIsLoading(true)
    setRequestError(null)
    setReport(null)
    try {
      const response = await fetch('/api/campaigns/bulk-actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, campaignIds: campaigns.map(campaign => campaign.id) }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : '캠페인 처리에 실패했습니다.')
      if (!Array.isArray(payload.results)) throw new Error('처리 결과를 확인할 수 없습니다.')
      const result = payload as CampaignBulkResponse
      setReport({ ...result, excluded })
      const applied = result.results.filter(item => item.campaign)
      const changes = new Map(applied.map(item => [item.id, item.campaign!]))
      setData(previous => previous.map(campaign => {
        const change = changes.get(campaign.id)
        return change ? { ...campaign, status: change.status, end_date: change.end_date } : campaign
      }))
      setRowSelection(previous => Object.fromEntries(Object.entries(previous).filter(([id]) => !changes.has(Number(id)))))
      if (result.results.every(item => item.outcome === 'SUCCESS') && !result.cacheWarning) {
        toast.success(`${applied.length}개 캠페인 ${CAMPAIGN_ACTION_LABELS[action]} 완료`)
      } else {
        toast.warning('일부 항목은 확인이 필요합니다. 처리 결과를 확인해 주세요.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '캠페인 처리 결과를 확인할 수 없습니다.'
      setRequestError(`${message} 자동 재실행하지 않았습니다. 새로 조회된 목록과 결제·알림 상태를 확인해 주세요.`)
      toast.error(message)
    } finally {
      // Also refresh after a lost response: a request may already have reached the server.
      router.refresh()
      busyRef.current = false
      setIsLoading(false)
      setConfirmModal(previous => ({ ...previous, isOpen: false }))
    }
  }

  const confirmAction = (action: CampaignAction, candidates: Campaign[]) => {
    if (busyRef.current) return
    const targets = candidates.filter(campaign => canApplyCampaignAction(action, campaign.status))
    if (!targets.length) { toast.error('현재 상태에서 처리할 수 있는 캠페인이 없습니다.'); return }
    if (targets.length > 100) { toast.error('한 번에 최대 100개까지 처리할 수 있습니다.'); return }
    const label = CAMPAIGN_ACTION_LABELS[action]
    const excluded = candidates.length - targets.length
    const impact = action === 'APPROVE'
      ? '승인 후 모집 일정이 활성화됩니다. 연결된 대기 결제는 PAID로 전환되고 승인 알림이 생성됩니다.'
      : action === 'CLOSE' ? '마감 후 공개 모집·신규 신청이 중단되고 마감/완료로 이동합니다.' : '선택한 요청을 거절합니다.'
    setConfirmModal({
      isOpen: true, title: `캠페인 ${label}`, type: action === 'REJECT' ? 'danger' : action === 'CLOSE' ? 'warning' : 'info',
      confirmText: `${targets.length}개 ${label}하기`,
      message: `대상 ${targets.length}개 / 상태가 맞지 않아 제외 ${excluded}개\n\n${targets.map(campaign => `• ${campaign.title}`).join('\n')}\n\n${impact}`,
      onConfirm: () => { void executeAction(action, targets, excluded) },
    })
  }

  const singleAction = (action: CampaignAction, id: number) => {
    const campaign = data.find(item => item.id === id)
    if (campaign) confirmAction(action, [campaign])
  }
  const handleApprove = (id: number) => singleAction('APPROVE', id)
  const handleReject = (id: number) => singleAction('REJECT', id)
  const handleClose = (id: number) => singleAction('CLOSE', id)
  const handleView = (id: number) => router.push(`/dashboard/admin/campaigns/${id}`)
  const handleEdit = (id: number) => router.push(`/dashboard/campaign/new?id=${id}`)

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


  const bulkActions = selected.length > 0 ? (
    <div role="region" aria-label="선택 캠페인 일괄 작업" className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/60 p-3 mx-4 sm:mx-0">
      <span className="mr-2 text-sm font-bold text-gray-900">선택 {selected.length}개</span>
      {(['APPROVE', 'REJECT', 'CLOSE'] as const).map(action => {
        const count = selected.filter(campaign => canApplyCampaignAction(action, campaign.status)).length
        return <Button key={action} size="sm" variant={action === 'REJECT' ? 'destructive' : 'outline'}
          disabled={isLoading || count === 0} onClick={() => confirmAction(action, selected)}>
          일괄 {CAMPAIGN_ACTION_LABELS[action]} {count}개
        </Button>
      })}
      <Button size="sm" variant="ghost" disabled={isLoading} onClick={resetSelection}>선택 해제</Button>
    </div>
  ) : null

  return (
    <>
      {requestError && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{requestError}</div>}
      {report && <div role="status" className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
        <p className="font-bold">처리 결과: 성공 {report.results.filter(item => item.outcome === 'SUCCESS').length}개 / 연동 확인 {report.results.filter(item => item.outcome === 'WARNING').length}개 / 실패 {report.results.filter(item => item.outcome === 'FAILED').length}개 / 제외 {report.excluded + report.results.filter(item => item.outcome === 'SKIPPED').length}개</p>
        {report.cacheWarning && <p className="mt-2 text-amber-800">{report.cacheWarning}</p>}
        <ul className="mt-2 max-h-64 overflow-y-auto space-y-1">
          {report.results.filter(item => item.outcome !== 'SUCCESS').map(item => <li key={item.id}>
            {item.title || `캠페인 #${item.id}`}: {item.message}
            {item.warnings?.map(warning => <p key={warning} className="text-amber-800">{warning}</p>)}
          </li>)}
        </ul>
      </div>}
      <CampaignDataTable data={data} isAdmin={true} onApprove={handleApprove} onReject={handleReject}
        onView={handleView} onEdit={handleEdit} onDelete={handleDelete} onClose={handleClose} isLoading={isLoading}
        rowSelection={rowSelection} onRowSelectionStateChange={setRowSelection} onResetSelection={resetSelection} bulkActions={bulkActions} />
      <ConfirmDialog isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(previous => ({ ...previous, isOpen: false }))}
        onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message}
        type={confirmModal.type} confirmText={confirmModal.confirmText} />
    </>
  )
}
