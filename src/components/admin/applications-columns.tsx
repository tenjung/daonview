"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Check, Star, X } from "lucide-react"
import { Application } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import {
    UserInfoCell,
    PhoneCell,
    SnsLinkCell,
    DateCell,
    StatusBadgeCell,
} from "@/components/data-table"
import ApplicationStatusBadge from "@/components/admin/ApplicationStatusBadge"
import AdminListActionMenu from "@/components/admin/AdminListActionMenu"

import { SatisfactionLevel } from "@/types/review"

interface ColumnContext {
    onApprove: (app: Application) => void
    onReject: (id: number, name: string) => void
    onCancel: (id: number, name: string) => void
    onOpenReview: (userId: string, name: string) => void
    onOpenReputation: (userId: string, name: string) => void
    onResendNotification?: (app: Application) => void
    onReassignLink?: (app: Application) => void
    onUpdateTracking?: (id: number, company: string, number: string) => void
    onHandleExtension?: (id: number, action: 'APPROVED' | 'REJECTED') => void
    influencerStats?: Map<string, {
        tags: string[];
        cancellations: number;
        satisfaction: SatisfactionLevel[];
        daonIndex?: number;
    }>;
    reviewedInfluencerIds?: Set<string>;
    campaignType?: string;
    productUrlIndividual?: boolean;
}

export function createApplicationColumns(context: ColumnContext): ColumnDef<Application>[] {
    return [
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
        // 신청일시
        {
            accessorKey: "created_at",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="whitespace-nowrap"
                    >
                        신청일시
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            meta: { columnLabel: "신청일시" },
            cell: ({ row }) => <DateCell date={row.getValue("created_at")} showTime={true} />,
            size: 160,
        },
        // 인플루언서 정보
        {
            accessorKey: "user",
            header: "인플루언서 정보",
            meta: { columnLabel: "인플루언서 정보" },
            cell: ({ row }) => {
                const userId = row.original.user_id;
                const stats = context.influencerStats?.get(userId);
                const daonIndex = stats?.daonIndex;
                
                return (
                    <div className="flex flex-col gap-1.5 py-1">
                        <UserInfoCell user={row.original.user} />
                        <div className="pl-12">
                            {daonIndex !== undefined ? (() => {
                                // 이전 거대 점수(수만 단위)와의 하위 호환성 대응
                                let stars = daonIndex;
                                if (daonIndex > 5) {
                                    if (daonIndex <= 1000) stars = 1;
                                    else if (daonIndex <= 5000) stars = 2;
                                    else if (daonIndex <= 20000) stars = 3;
                                    else if (daonIndex <= 50000) stars = 4;
                                    else stars = 5;
                                }
                                
                                return (
                                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-slate-50 to-gray-50 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 shadow-sm" title={`블로그 영향력 지수 (최저 1 ~ 최고 5)`}>
                                        지수: <span className="tracking-widest text-[#FFB800] text-[11px] drop-shadow-sm">
                                            {"★".repeat(stars || 1)}
                                        </span>
                                    </span>
                                );
                            })() : row.original.user?.sns_url ? (
                                <TooltipProvider>
                                    <Tooltip delayDuration={300}>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200 cursor-help">
                                                ⏳ 지수 수집 중..
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="p-3 max-w-[250px] space-y-1.5">
                                            <p className="text-xs font-bold text-slate-700">지수 수집 대기 중</p>
                                            <p className="text-[11px] text-slate-500 leading-snug">
                                                신규 회원이거나 블로그 URL이 대기열에 등록된 상태입니다. 수집 봇이 데이터를 순차적으로 분석하고 있습니다. (보통 몇 분 내 완료)
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : null}
                        </div>
                    </div>
                );
            },
            enableSorting: false,
            size: 250,
        },
        {
            accessorKey: "user.phone_number",
            header: "연락처",
            meta: { columnLabel: "연락처" },
            cell: ({ row }) => {
                const phone = row.original.user?.phone_number;
                if (!phone || phone.trim().length < 10) {
                    return <span className="text-red-500 font-bold animate-pulse">미등록</span>;
                }
                return <PhoneCell phone={phone} />;
            },
            enableSorting: false,
            size: 130,
        },
        // SNS
        {
            accessorKey: "user.sns_url",
            header: "SNS",
            meta: { columnLabel: "SNS" },
            cell: ({ row }) => (
                <SnsLinkCell 
                    url={row.original.user?.sns_url} 
                    platform={row.original.user?.sns_url?.includes('instagram') ? 'instagram' : 'blog'}
                />
            ),
            enableSorting: false,
            size: 110,
        },
        // 신청 옵션
        {
            accessorKey: "selected_option",
            header: "신청 옵션",
            meta: { columnLabel: "신청 옵션" },
            cell: ({ row }) => {
                const option = row.getValue("selected_option") as string;
                if (!option) return '-';

                const options = option.split('|').map(s => s.trim());
                
                return (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="max-w-[220px] flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 cursor-help">
                                    <span className="flex-1 truncate">{options[0]}</span>
                                    {options.length > 1 && (
                                        <span className="shrink-0 text-[10px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full font-black leading-none">
                                            +{options.length - 1}
                                        </span>
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="p-0 overflow-hidden border-2 border-blue-100 shadow-2xl rounded-2xl w-[320px]">
                                <div className="bg-blue-600 px-3 py-2">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                        Selected Options
                                    </span>
                                </div>
                                <div className="p-4 space-y-3 bg-white">
                                    {options.map((opt, i) => (
                                        <div key={i} className="flex gap-3 items-start group">
                                            <div className="shrink-0 w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[11px] font-black border border-blue-100 border-dashed group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] font-bold text-blue-400 mb-0.5">
                                                    {i + 1}순위 희망
                                                </div>
                                                <div className="text-[12px] font-semibold text-slate-700 leading-snug">
                                                    {opt.replace(/^[1-9]지망:\s*/, '')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            },
            enableSorting: false,
            size: 250,
        },
        // 신청 메시지
        {
            accessorKey: "application_message",
            header: "신청 메시지",
            meta: { columnLabel: "신청 메시지" },
            cell: ({ row }) => {
                const message = row.getValue("application_message") as string;
                if (!message) return <div className="text-sm text-gray-400">-</div>;

                return (
                    <TooltipProvider>
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                                <div className="max-w-[250px] truncate text-sm text-gray-700 cursor-help hover:text-gray-900">
                                    {message}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent 
                                side="bottom" 
                                align="start"
                                className="max-w-[400px] z-50 p-4 border border-gray-100 shadow-xl rounded-xl"
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap word-break break-all">
                                    {message}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            },
            enableSorting: false,
            size: 300,
        },
        // 송장 정보 (배송체험일 경우에만 표시)
        ...(context.campaignType === 'DELIVERY' ? [{
            id: "tracking",
            header: "송장 정보",
            meta: { columnLabel: "송장 정보" },
            cell: ({ row }: { row: any }) => {
                const app = row.original;
                const isSelected = (app.status?.toUpperCase() === 'APPROVED' || app.status?.toUpperCase() === 'SELECTED');
                
                return (
                    <div className="flex flex-col gap-1 min-w-[100px]">
                        {app.tracking_company && app.tracking_number ? (
                            <div className="text-sm">
                                <div className="font-medium text-blue-600">{app.tracking_company}</div>
                                <div className="text-gray-500 font-mono text-[10px]">{app.tracking_number}</div>
                            </div>
                        ) : (
                            <span className="text-xs text-gray-400 italic">미등록</span>
                        )}
                        {isSelected && (
                            <button 
                                onClick={() => context.onUpdateTracking?.(app.id, app.tracking_company || '', app.tracking_number || '')}
                                className="text-[10px] text-primary hover:underline w-fit"
                            >
                                {app.tracking_number ? '수정' : '입력'}
                            </button>
                        )}
                    </div>
                );
            },
            enableSorting: false,
            size: 150,
        }] : []),
        // 리뷰 마감/연장
        {
            id: "deadline",
            header: "리뷰 마감",
            meta: { columnLabel: "리뷰 마감" },
            cell: ({ row }) => {
                const app = row.original;
                if (!app.review_deadline) return <span className="text-gray-400">-</span>;
                
                return (
                    <div className="flex flex-col gap-1">
                        <DateCell date={app.review_deadline} />
                        {app.extension_status === 'PENDING' && (
                            <div className="bg-orange-50 p-1.5 rounded border border-orange-100 mt-1">
                                <div className="text-[9px] text-orange-600 font-bold mb-1">연장 요청됨</div>
                                <div className="text-[9px] text-gray-500 line-clamp-2 italic">"{app.extension_reason}"</div>
                                <div className="flex gap-1 mt-1">
                                    <button 
                                        onClick={() => context.onHandleExtension?.(app.id, 'APPROVED')}
                                        className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-bold"
                                    >
                                        승인
                                    </button>
                                    <button 
                                        onClick={() => context.onHandleExtension?.(app.id, 'REJECTED')}
                                        className="text-[8px] bg-gray-400 text-white px-1.5 py-0.5 rounded font-bold"
                                    >
                                        거절
                                    </button>
                                </div>
                            </div>
                        )}
                        {app.extension_status === 'APPROVED' && <span className="text-[9px] text-green-600 font-bold">연장됨 (+7일)</span>}
                    </div>
                );
            },
            enableSorting: false,
            size: 150,
        },
        // 평판 정보
        {
            id: "influencer_rep",
            header: ({ column }) => (
                <div className="whitespace-nowrap text-center font-bold px-2">
                    평판
                </div>
            ),
            meta: { columnLabel: "평판" },
            cell: ({ row }) => {
                const userId = row.original.user_id;
                const stats = context.influencerStats?.get(userId);
                
                const satisfaction = stats?.satisfaction || [];
                const satisfiedCount = satisfaction.filter(s => s.toUpperCase() === 'SATISFIED').length;
                const normalCount = satisfaction.filter(s => s.toUpperCase() === 'NORMAL').length;
                const dissatisfiedCount = satisfaction.filter(s => s.toUpperCase() === 'DISSATISFIED').length;

                const hasIssue = (stats?.cancellations || 0) > 0 || stats?.tags.some(t => t.toUpperCase().includes('느려요') || t.toUpperCase().includes('지연'));

                return (
                    <div className="flex justify-center min-w-[80px]">
                        <button 
                            onClick={() => context.onOpenReputation(userId, row.original.user?.nickname || '인플루언서')}
                            className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-full transition-all border border-transparent hover:border-gray-200 group"
                        >
                            <div className="flex items-center -space-x-1">
                                {satisfiedCount > 0 && <span className="text-[14px]">😊</span>}
                                {normalCount > 0 && <span className="text-[14px]">😐</span>}
                                {dissatisfiedCount > 0 && <span className="text-[14px]">😡</span>}
                                {satisfaction.length === 0 && <span className="text-[10px] font-bold text-gray-300">없음</span>}
                            </div>
                            
                            {hasIssue && (
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" title="특이사항(취소/지연) 있음" />
                            )}

                            <span className="text-[9px] font-black text-gray-400 group-hover:text-primary transition-colors hidden group-hover:inline ml-1 whitespace-nowrap">
                                상세
                            </span>
                        </button>
                    </div>
                );
            },
            enableSorting: false,
            size: 100,
        },
        // 상태
        {
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
            cell: ({ row }) => <ApplicationStatusBadge status={row.getValue("status")} />,
            size: 120,
        },
        // 관리
        {
            id: "actions",
            header: () => <div className="text-center w-full">관리</div>,
            meta: { columnLabel: "관리" },
            cell: ({ row }) => {
                const app = row.original;
                const user = app.user;
                const hasPhoneNumber = user?.phone_number && user.phone_number.trim().length >= 10;
                const isPending = app.status?.toUpperCase() === 'PENDING';
                const isSelected = app.status?.toUpperCase() === 'APPROVED' || app.status?.toUpperCase() === 'SELECTED';
                const isReviewed = context.reviewedInfluencerIds?.has(app.user_id);

                return (
                    <div className="flex justify-center items-center gap-1 flex-nowrap w-full">
                        {isPending ? (
                            <AdminListActionMenu
                                label="신청 관리"
                                widthClass="w-36"
                                items={[
                                    {
                                        key: "approve",
                                        label: "승인",
                                        icon: <Check size={14} />,
                                        onSelect: () => context.onApprove(app),
                                        variant: "success",
                                        disabled: !hasPhoneNumber,
                                    },
                                    {
                                        key: "reject",
                                        label: "거절",
                                        icon: <X size={14} />,
                                        onSelect: () => context.onReject(app.id, user?.nickname || '사용자'),
                                    },
                                ]}
                            />
                        ) : isSelected ? (
                            <div className="flex gap-1 items-center justify-center">
                                {isReviewed ? (
                                    <div className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1 whitespace-nowrap">
                                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                                        평가완료
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() => context.onOpenReview(app.user_id, user?.nickname || '인플루언서')}
                                        className="bg-yellow-500 hover:bg-yellow-600 whitespace-nowrap h-7 px-2 shadow-sm text-[11px]"
                                    >
                                        <Star size={12} className="mr-1 fill-white" /> 평가
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => context.onResendNotification?.(app)}
                                    className="border-blue-500 text-blue-600 hover:bg-blue-50 whitespace-nowrap h-7 px-2 text-[11px]"
                                >
                                    재발송
                                </Button>
                                {context.productUrlIndividual && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => context.onReassignLink?.(app)}
                                        className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 whitespace-nowrap h-7 px-2 text-[11px]"
                                    >
                                        링크
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => context.onCancel(app.id, user?.nickname || '인플루언서')}
                                    className="border-orange-500 text-orange-600 hover:bg-orange-50 whitespace-nowrap h-7 px-2 text-[11px]"
                                >
                                    <X size={12} className="mr-1" /> 취소
                                </Button>
                            </div>
                        ) : (
                            isReviewed ? (
                                <div className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1 whitespace-nowrap">
                                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                                    평가완료
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={() => context.onOpenReview(app.user_id, user?.nickname || '인플루언서')}
                                    className="bg-yellow-500 hover:bg-yellow-600 whitespace-nowrap h-8 px-2.5 shadow-sm"
                                >
                                    <Star size={14} className="mr-1 fill-white" /> 평가
                                </Button>
                            )
                        )}
                    </div>
                );
            },
            enableSorting: false,
            enableHiding: false,
            size: 130,
        },
    ];
}
