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

interface ColumnContext {
    onApprove: (id: number, name: string, email: string) => void
    onReject: (id: number, name: string) => void
    onOpenReview: (userId: string, name: string) => void
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
        // 연락처
        {
            accessorKey: "user.phone_number",
            header: "연락처",
            cell: ({ row }) => <PhoneCell phone={row.original.user?.phone_number} />,
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
                if (app.tracking_company && app.tracking_number) {
                    return (
                        <div className="text-sm whitespace-nowrap">
                            <div className="font-medium">{app.tracking_company}</div>
                            <div className="text-gray-500">{app.tracking_number}</div>
                        </div>
                    );
                }
                return <span className="text-xs text-gray-400 italic">미등록</span>;
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
                const isPending = app.status?.toUpperCase() === 'PENDING';

                return (
                    <div className="flex justify-center gap-1.5 flex-nowrap">
                        {isPending ? (
                            <>
                                <Button
                                    size="sm"
                                    onClick={() => context.onApprove(app.id, user?.nickname || '사용자', user?.email || '')}
                                    className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
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
