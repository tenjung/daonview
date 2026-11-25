"use client"

import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import Link from 'next/link'
import { Application } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { DateCell } from "@/components/data-table"
import { isOptimizableImageSrc } from "@/lib/utils"

export const influencerApplicationColumns: ColumnDef<any>[] = [
    {
        accessorKey: "campaigns.title",
        header: "캠페인 정보",
        cell: ({ row }) => {
            const campaign = row.original.campaigns;
            const canOptimizeThumbnail = isOptimizableImageSrc(campaign?.thumbnail_url);
            return (
                <div className="flex items-center gap-3">
                    {campaign?.thumbnail_url && (
                        canOptimizeThumbnail ? (
                            <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                                <Image
                                    src={campaign.thumbnail_url}
                                    alt={campaign.title}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <img
                                src={campaign.thumbnail_url}
                                alt={campaign.title}
                                className="w-10 h-10 rounded-lg object-cover"
                            />
                        )
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
            return <StatusBadge domain="INFLUENCER_APPLICATION" status={status} />;
        }
    }
];
