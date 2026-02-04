"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from 'next/link'
import { Application } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { DateCell } from "@/components/data-table"

export const influencerApplicationColumns: ColumnDef<any>[] = [
    {
        accessorKey: "campaigns.title",
        header: "캠페인 정보",
        cell: ({ row }) => {
            const campaign = row.original.campaigns;
            return (
                <div className="flex items-center gap-3">
                    {campaign?.thumbnail_url && (
                        <img 
                            src={campaign.thumbnail_url} 
                            alt={campaign.title} 
                            className="w-10 h-10 rounded-lg object-cover"
                        />
                    )}
                    <Link 
                        href={`/campaigns/${campaign?.id}`}
                        className="font-bold text-gray-900 hover:text-primary transition-colors truncate max-w-[300px]"
                    >
                        {campaign?.title}
                    </Link>
                </div>
            );
        }
    },
    {
        accessorKey: "campaigns.platform",
        header: "플랫폼",
        cell: ({ row }) => (
            <Badge variant="outline" className="font-medium">
                {row.original.campaigns?.platform}
            </Badge>
        )
    },
    {
        accessorKey: "created_at",
        header: "신청일",
        cell: ({ row }) => <DateCell date={row.getValue("created_at")} />
    },
    {
        accessorKey: "status",
        header: "상태",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            const statusConfig: Record<string, { label: string; color: string }> = {
                PENDING: { label: '심사중', color: 'bg-orange-100 text-orange-600' },
                APPROVED: { label: '선정됨', color: 'bg-green-100 text-green-600' },
                SELECTED: { label: '선정됨', color: 'bg-green-100 text-green-600' },
                REJECTED: { label: '미선정', color: 'bg-red-100 text-red-600' },
                COMPLETED: { label: '완료', color: 'bg-blue-100 text-blue-600' },
            };
            const config = statusConfig[status?.toUpperCase()] || { label: status, color: 'bg-gray-100 text-gray-600' };
            
            return (
                <Badge className={`${config.color} border-none font-bold`}>
                    {config.label}
                </Badge>
            );
        }
    },
    {
        id: "note",
        header: "비고",
        cell: ({ row }) => {
            const status = row.original.status?.toUpperCase();
            if (status === 'APPROVED' || status === 'SELECTED') return <span className="text-xs text-primary font-bold">가이드 확인 필요</span>;
            if (status === 'REJECTED') return <span className="text-xs text-gray-400">아쉽게도 선정되지 않았습니다.</span>;
            return <span className="text-gray-400">-</span>;
        }
    }
];
