"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Check, X, Edit, Trash2, Eye, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Campaign } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DateCell } from "@/components/data-table"
import { StatusBadgeCell } from "@/components/data-table/cells/StatusBadgeCell"
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_VARIANTS } from "@/constants/campaign"
import { canEditCampaign as canEditCampaignByRole } from "@/lib/campaignPermissions"
import AdminListActionMenu from "@/components/admin/AdminListActionMenu"
import { getCampaignRecruitTarget, isCampaignAlwaysOpen, isCampaignUnlimitedRecruitment } from "@/lib/campaignUtils"

interface CampaignColumnContext {
    onApprove?: (id: number, title: string) => void
    onReject?: (id: number, title: string) => void
    onEdit?: (id: number) => void
    onDelete?: (id: number, title: string) => void
    onView?: (id: number) => void
    onExtend?: (id: number, title: string) => void
    isAdmin?: boolean
    currentUserId?: string | null
    currentUserRole?: string | null
}

// 캠페인 정보 셀
function CampaignInfoCell({ campaign, isAdmin }: { campaign: Campaign; isAdmin?: boolean }) {
    // 제목 클릭 시 신청자 관리 페이지로 이동
    const managePath = isAdmin
        ? `/dashboard/admin/campaigns/${campaign.id}`
        : `/dashboard/advertiser/campaigns/${campaign.id}`;

    return (
        <div className="flex items-center gap-3 max-w-[240px] sm:max-w-[360px] lg:max-w-none overflow-hidden">
            {campaign.main_image_url && (
                <Image
                    src={campaign.main_image_url}
                    alt={campaign.title}
                    width={48}
                    height={48}
                    className="hidden sm:block w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
            )}
            <div className="min-w-0 flex-1">
                <Link
                    href={managePath}
                    title={campaign.title}
                    className="block text-sm font-medium leading-6 text-gray-900 hover:text-primary transition-colors cursor-pointer break-keep line-clamp-2 lg:line-clamp-1"
                >
                    {campaign.title}
                </Link>
            </div>
        </div>
    );
}

export function createCampaignColumns(context: CampaignColumnContext): ColumnDef<Campaign>[] {
    const columns: ColumnDef<Campaign>[] = [
        // 체크박스
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="모두 선택"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="행 선택"
                />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 50,
        },
        // 캠페인 정보
        {
            accessorKey: "title",
            header: "캠페인 정보",
            meta: { columnLabel: "캠페인 정보" },
            cell: ({ row }) => <CampaignInfoCell campaign={row.original} isAdmin={context.isAdmin} />,
            enableSorting: false,
            size: 460,
        },
    ];

    // 관리자 전용: 광고주 정보
    if (context.isAdmin) {
        columns.push({
            accessorKey: "advertiser",
            header: "광고주",
            meta: { columnLabel: "광고주" },
            cell: ({ row }) => {
                const advertiser = row.original.advertiser;
                return (
                    <div className="text-sm">
                        <div className="font-medium text-gray-900">
                            {advertiser?.company_name || advertiser?.nickname || '정보 없음'}
                        </div>
                        {advertiser?.email && (
                            <div className="text-xs text-gray-500">{advertiser.email}</div>
                        )}
                    </div>
                );
            },
            enableSorting: false,
            size: 200,
        });
    }

    // 모집인원
    columns.push({
        id: "recruitment",
        header: "모집인원",
        meta: { columnLabel: "모집인원" },
        cell: ({ row }) => {
            const campaign = row.original;
            const applicationsCount = campaign.applications?.[0]?.count || 0;
            const recruitCount = getCampaignRecruitTarget(campaign);
            const isInfinite = isCampaignUnlimitedRecruitment(campaign);
            const percentage = typeof recruitCount === 'number' && recruitCount > 0 ? Math.round((applicationsCount / recruitCount) * 100) : 0;

            return (
                <div className="text-sm whitespace-nowrap">
                    <div className="font-bold text-gray-900">
                        {applicationsCount} / {isInfinite ? <span className="text-indigo-600 font-bold text-base">∞</span> : `${recruitCount ?? 0}명`}
                    </div>
                    <div className="text-xs text-gray-500">
                        {isInfinite ? <span className="text-rose-500 font-bold">무제한 모집</span> : `${percentage}% 달성`}
                    </div>
                </div>
            );
        },
        enableSorting: false,
        size: 150,
    });

    // 상태
    columns.push({
        accessorKey: "status",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="whitespace-nowrap"
                >
                    상태
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        meta: { columnLabel: "상태" },
        cell: ({ row }) => (
            <StatusBadgeCell
                status={row.getValue("status")}
                customLabels={CAMPAIGN_STATUS_LABELS}
                customVariants={CAMPAIGN_STATUS_VARIANTS}
            />
        ),
        size: 100,
    });

    // 등록일
    columns.push({
        accessorKey: "created_at",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="whitespace-nowrap"
                >
                    등록일
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        meta: { columnLabel: "등록일" },
        cell: ({ row }) => <DateCell date={row.getValue("created_at")} />,
        size: 120,
    });

    // 진행 일정 (시안 3: 배지 레이블형)
    columns.push({
        id: "schedule",
        header: "진행 일정",
        meta: { columnLabel: "진행 일정" },
        cell: ({ row }) => {
            const campaign = row.original;
            const startDate = campaign.recruitment_start_date || campaign.created_at;
            const isAlwaysRecruiting = isCampaignAlwaysOpen(campaign);

            return (
                <div className="flex flex-col gap-1.5 py-1">
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-semibold leading-none shrink-0">시작</span>
                        <span className="text-[11px] font-bold text-slate-700">
                            {startDate ? new Date(startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\s/g, '').replace(/\.$/, '') : '-'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-rose-50 text-rose-500 text-[10px] font-semibold leading-none shrink-0">마감</span>
                        {isAlwaysRecruiting ? (
                            <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">상시모집</span>
                        ) : (
                            <span className="text-[11px] font-bold text-slate-700">
                                {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\s/g, '').replace(/\.$/, '') : '-'}
                            </span>
                        )}
                    </div>
                </div>
            );
        },
        enableSorting: false,
        size: 180,
    });

    // 관리 (액션 버튼)
    columns.push({
        id: "actions",
        header: () => <div className="text-center w-full whitespace-nowrap">설정</div>,
        meta: { columnLabel: "설정" },
        cell: ({ row }) => {
            const campaign = row.original;
            const isPending = campaign.status?.toUpperCase() === 'PENDING';
            const creatorField = campaign.created_by;
            const creatorId =
                typeof creatorField === 'object' && creatorField !== null && 'id' in creatorField
                    ? (creatorField as { id?: string | number | null }).id ?? null
                    : creatorField;
                
            const canEdit = Boolean(context.isAdmin) || canEditCampaignByRole({
                role: context.currentUserRole,
                userId: context.currentUserId,
                campaignCreatorId: creatorId,
            });

            return (
                <div className="flex justify-center items-center w-full">
                    <div className="flex justify-center gap-1.5 flex-nowrap">
                        <AdminListActionMenu
                            label="캠페인 관리"
                            items={[
                                ...(context.isAdmin && isPending
                                    ? [
                                        {
                                            key: "approve",
                                            label: "승인",
                                            icon: <Check className="h-4 w-4" />,
                                            onSelect: () => context.onApprove?.(campaign.id, campaign.title),
                                            variant: "success" as const,
                                        },
                                        {
                                            key: "reject",
                                            label: "거절",
                                            icon: <X className="h-4 w-4" />,
                                            onSelect: () => context.onReject?.(campaign.id, campaign.title),
                                        },
                                    ]
                                    : []),
                                {
                                    key: "view",
                                    label: "신청자 관리",
                                    icon: <Eye className="h-4 w-4" />,
                                    onSelect: () => context.onView?.(campaign.id),
                                    separatorBefore: context.isAdmin && isPending,
                                },
                                {
                                    key: "public-view",
                                    label: "상세 보기 (공개)",
                                    icon: <ExternalLink className="h-4 w-4" />,
                                    href: `/campaigns/${campaign.id}`,
                                    external: true,
                                },
                                ...(canEdit
                                    ? [{
                                        key: "edit",
                                        label: "캠페인 수정",
                                        icon: <Edit className="h-4 w-4" />,
                                        onSelect: () => context.onEdit?.(campaign.id),
                                        separatorBefore: true,
                                    }]
                                    : []),
                                ...(!context.isAdmin && (campaign.status === 'RECRUITING' || campaign.status === 'ONGOING')
                                    ? [{
                                        key: "extend",
                                        label: "기간 연장",
                                        icon: <Clock className="h-4 w-4" />,
                                        onSelect: () => context.onExtend?.(campaign.id, campaign.title),
                                    }]
                                    : []),
                                {
                                    key: "delete",
                                    label: "캠페인 삭제",
                                    icon: <Trash2 className="h-4 w-4" />,
                                    onSelect: () => context.onDelete?.(campaign.id, campaign.title),
                                    variant: "destructive",
                                    separatorBefore: canEdit || (!context.isAdmin && (campaign.status === 'RECRUITING' || campaign.status === 'ONGOING')),
                                },
                            ]}
                        />
                    </div>
                </div>
            );
        },
        enableSorting: false,
        enableHiding: false,
        size: 160,
    });

    return columns;
}
