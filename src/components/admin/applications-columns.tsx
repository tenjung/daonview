"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Check, X, Star, ExternalLink } from "lucide-react"
import { Application } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    UserInfoCell,
    PhoneCell,
    SnsLinkCell,
    DateCell,
    StatusBadgeCell,
} from "@/components/data-table"
import ApplicationStatusBadge from "@/components/admin/ApplicationStatusBadge"

import { SatisfactionLevel } from "@/types/review"

interface ColumnContext {
    onApprove: (id: number, name: string, email: string) => void
    onReject: (id: number, name: string) => void
    onCancel: (id: number, name: string) => void
    onOpenReview: (userId: string, name: string) => void
    onOpenReputation: (userId: string, name: string) => void
    onUpdateTracking?: (id: number, company: string, number: string) => void
    onHandleExtension?: (id: number, action: 'APPROVED' | 'REJECTED') => void
    influencerStats?: Map<string, {
        tags: string[];
        cancellations: number;
        satisfaction: SatisfactionLevel[];
    }>
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
            cell: ({ row }) => <DateCell date={row.getValue("created_at")} showTime={true} />,
        },
        // 인플루언서 정보
        {
            accessorKey: "user",
            header: "인플루언서 정보",
            cell: ({ row }) => <UserInfoCell user={row.original.user} />,
            enableSorting: false,
        },
        {
            accessorKey: "user.phone_number",
            header: "연락처",
            cell: ({ row }) => {
                const phone = row.original.user?.phone_number;
                if (!phone || phone.trim().length < 10) {
                    return <span className="text-red-500 font-bold animate-pulse">미등록</span>;
                }
                return <PhoneCell phone={phone} />;
            },
            enableSorting: false,
        },
        // SNS
        {
            accessorKey: "user.sns_url",
            header: "SNS",
            cell: ({ row }) => (
                <SnsLinkCell 
                    url={row.original.user?.sns_url} 
                    platform={row.original.user?.sns_url?.includes('instagram') ? 'instagram' : 'blog'}
                />
            ),
            enableSorting: false,
        },
        // 신청 메시지
        {
            accessorKey: "message",
            header: "신청 메시지",
            cell: ({ row }) => {
                const message = row.getValue("message") as string;
                return (
                    <div className="max-w-[250px] truncate text-sm text-gray-700">
                        {message || '-'}
                    </div>
                );
            },
            enableSorting: false,
        },
        // 송장 정보
        {
            id: "tracking",
            header: "송장 정보",
            cell: ({ row }) => {
                const app = row.original;
                const canEditTracking = (app.status?.toUpperCase() === 'APPROVED' || app.status?.toUpperCase() === 'SELECTED') && app.campaigns?.type === 'DELIVERY';
                
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
                        {canEditTracking && (
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
        },
        // 리뷰 마감/연장
        {
            id: "deadline",
            header: "리뷰 마감",
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
        },
        // 평판 정보
        {
            id: "influencer_rep",
            header: ({ column }) => (
                <div className="whitespace-nowrap text-center font-bold px-2">
                    평판
                </div>
            ),
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
            cell: ({ row }) => <ApplicationStatusBadge status={row.getValue("status")} />,
        },
        // 관리
        {
            id: "actions",
            header: "관리",
            cell: ({ row }) => {
                const app = row.original;
                const user = app.user;
                const hasPhoneNumber = user?.phone_number && user.phone_number.trim().length >= 10;
                const isPending = app.status?.toUpperCase() === 'PENDING';
                const isSelected = app.status?.toUpperCase() === 'APPROVED' || app.status?.toUpperCase() === 'SELECTED';

                return (
                    <div className="flex justify-center gap-1.5 flex-nowrap">
                        {isPending ? (
                            <>
                                <Button
                                    size="sm"
                                    disabled={!hasPhoneNumber}
                                    onClick={() => context.onApprove(app.id, user?.nickname || '사용자', user?.email || '')}
                                    className={`whitespace-nowrap ${hasPhoneNumber ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
                                    title={!hasPhoneNumber ? "연락처가 등록되지 않은 유저는 승인할 수 없습니다." : ""}
                                >
                                    <Check size={14} className="mr-1" /> 승인
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => context.onReject(app.id, user?.nickname || '사용자')}
                                    className="whitespace-nowrap"
                                >
                                    <X size={14} className="mr-1" /> 거절
                                </Button>
                            </>
                        ) : isSelected ? (
                            <div className="flex gap-1.5">
                                <Button
                                    size="sm"
                                    onClick={() => context.onOpenReview(app.user_id, user?.nickname || '인플루언서')}
                                    className="bg-yellow-500 hover:bg-yellow-600 whitespace-nowrap"
                                >
                                    <Star size={14} className="mr-1" /> 평가
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => context.onCancel(app.id, user?.nickname || '인플루언서')}
                                    className="border-orange-500 text-orange-600 hover:bg-orange-50 whitespace-nowrap"
                                >
                                    <X size={14} className="mr-1" /> 취소
                                </Button>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => context.onOpenReview(app.user_id, user?.nickname || '인플루언서')}
                                className="bg-yellow-500 hover:bg-yellow-600 whitespace-nowrap"
                            >
                                <Star size={14} className="mr-1" /> 평가
                            </Button>
                        )}
                    </div>
                );
            },
            enableSorting: false,
            enableHiding: false,
        },
    ];
}
