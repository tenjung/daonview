"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Check, X, Edit, Trash2, Eye, Clock, MoreHorizontal, ExternalLink, Settings, ChevronDown } from "lucide-react"
import Link from "next/link"
import { Campaign } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DateCell } from "@/components/data-table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CampaignColumnContext {
    onApprove?: (id: number, title: string) => void
    onReject?: (id: number, title: string) => void
    onEdit?: (id: number) => void
    onDelete?: (id: number, title: string) => void
    onView?: (id: number) => void
    onExtend?: (id: number, title: string) => void
    isAdmin?: boolean
}

// 캠페인 상태 Badge
function CampaignStatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
        PENDING: { label: '요청중', variant: 'outline' },
        RECRUITING: { label: '모집중', variant: 'default' },
        ONGOING: { label: '진행중', variant: 'default' },
        COMPLETED: { label: '완료', variant: 'secondary' },
        DRAFT: { label: '임시저장', variant: 'secondary' },
    };

    const config = statusConfig[status?.toUpperCase()] || { label: status, variant: 'secondary' };

    return (
        <Badge variant={config.variant} className="whitespace-nowrap">
            {config.label}
        </Badge>
    );
}

// 캠페인 정보 셀 (이미지 + 제목 + 카테고리)
function CampaignInfoCell({ campaign, isAdmin }: { campaign: Campaign; isAdmin?: boolean }) {
    // 제목 클릭 시 신청자 관리 페이지로 이동
    const managePath = isAdmin 
        ? `/dashboard/admin/campaigns/${campaign.id}` 
        : `/dashboard/advertiser/campaigns/${campaign.id}`;

    return (
        <div className="flex items-center gap-3">
            {campaign.main_image_url && (
                <img
                    src={campaign.main_image_url}
                    alt={campaign.title}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
            )}
            <div className="min-w-0">
                <Link 
                    href={managePath}
                    className="font-bold text-gray-900 truncate hover:text-primary transition-colors cursor-pointer block"
                >
                    {campaign.title}
                </Link>
                {campaign.category && (
                    <div className="text-xs text-gray-500">
                        {campaign.category}
                    </div>
                )}
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
        },
        // 캠페인 정보
        {
            accessorKey: "title",
            header: "캠페인 정보",
            cell: ({ row }) => <CampaignInfoCell campaign={row.original} isAdmin={context.isAdmin} />,
            enableSorting: false,
        },
    ];

    // 관리자 전용: 광고주 정보
    if (context.isAdmin) {
        columns.push({
            accessorKey: "advertiser",
            header: "광고주",
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
        });
    }

    // 모집인원
    columns.push({
        id: "recruitment",
        header: "모집인원",
        cell: ({ row }) => {
            const campaign = row.original;
            const applicationsCount = campaign.applications?.[0]?.count || 0;
            const recruitCount = campaign.recruit_count || 0;
            const percentage = recruitCount > 0 ? Math.round((applicationsCount / recruitCount) * 100) : 0;

            return (
                <div className="text-sm whitespace-nowrap">
                    <div className="font-bold text-gray-900">
                        {applicationsCount} / {recruitCount}명
                    </div>
                    <div className="text-xs text-gray-500">
                        {percentage}% 달성
                    </div>
                </div>
            );
        },
        enableSorting: false,
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
        cell: ({ row }) => <CampaignStatusBadge status={row.getValue("status")} />,
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
        cell: ({ row }) => <DateCell date={row.getValue("created_at")} />,
    });

    // 진행 일정 (시안 3: 배지 레이블형)
    columns.push({
        id: "schedule",
        header: "진행 일정",
        cell: ({ row }) => {
            const campaign = row.original;
            const startDate = campaign.recruitment_start_date || campaign.created_at;
            const isAlwaysRecruiting = campaign.recruit_count && campaign.recruit_count >= 999;
            
            return (
                <div className="flex flex-col gap-1.5 py-1">
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-black leading-none shrink-0">시작</span>
                        <span className="text-[11px] font-bold text-slate-700">
                            {startDate ? new Date(startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\s/g, '').replace(/\.$/, '') : '-'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-rose-50 text-rose-500 text-[10px] font-black leading-none shrink-0">마감</span>
                        {isAlwaysRecruiting ? (
                            <span className="text-[11px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full animate-pulse border border-rose-100">상시모집</span>
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
    });

    // 관리 (액션 버튼)
    columns.push({
        id: "actions",
        header: () => <div className="text-center w-full whitespace-nowrap">캠페인 설정</div>,
        cell: ({ row }) => {
            const campaign = row.original;
            const isPending = campaign.status?.toUpperCase() === 'PENDING';

            return (
                <div className="flex justify-center items-center w-full">
                    <div className="flex justify-center gap-1.5 flex-nowrap">
                        {/* 관리자 전용: 대기 중인 캠페인 승인/거절 버튼 (주요 액션으로 노출) */}
                        {context.isAdmin && isPending && (
                            <>
                                <Button
                                    size="sm"
                                    onClick={() => context.onApprove?.(campaign.id, campaign.title)}
                                    className="bg-green-600 hover:bg-green-700 whitespace-nowrap h-8"
                                >
                                    <Check size={14} className="mr-1" /> 승인
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => context.onReject?.(campaign.id, campaign.title)}
                                    className="whitespace-nowrap h-8"
                                >
                                    <X size={14} className="mr-1" /> 거절
                                </Button>
                            </>
                        )}

                        {/* 시안 1: 텍스트 버튼 + 드롭다운 (가장 직관적) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold gap-1 h-8 px-2.5">
                                    관리/설정
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuLabel>캠페인 관리</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => context.onView?.(campaign.id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span>신청자 관리</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`/campaigns/${campaign.id}`, '_blank')}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    <span>상세 보기 (공개)</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => context.onEdit?.(campaign.id)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>캠페인 수정</span>
                                </DropdownMenuItem>
                                
                                {!context.isAdmin && (campaign.status === 'RECRUITING' || campaign.status === 'ONGOING') && (
                                    <DropdownMenuItem onClick={() => context.onExtend?.(campaign.id, campaign.title)}>
                                        <Clock className="mr-2 h-4 w-4" />
                                        <span>기간 연장</span>
                                    </DropdownMenuItem>
                                )}
                                
                                {!context.isAdmin && (
                                    <DropdownMenuItem 
                                        onClick={() => context.onDelete?.(campaign.id, campaign.title)}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>캠페인 삭제</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            );
        },
        enableSorting: false,
        enableHiding: false,
    });

    return columns;
}
