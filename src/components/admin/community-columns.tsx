"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Calendar, MoreHorizontal, ChevronDown, Trash2, ExternalLink, User, MessageSquare, MoveRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar } from "@/components/ui/avatar"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export interface Post {
    id: number;
    created_at: string;
    title: string;
    content: string;
    type: 'NOTICE' | 'FREE' | 'EVENT' | 'ACADEMY' | 'FAQ' | 'GUIDE' | string;
    view_count: number;
    user_id: string;
    profiles?: {
        nickname: string;
        name: string;
        avatar_url?: string;
    };
}

interface CommunityColumnContext {
    onDelete?: (id: number) => void
    onMove?: (id: number, newType: string) => void
}

const typeLabels: Record<string, string> = {
    '공지': '공지사항',
    '이벤트': '이벤트',
    'NOTICE': '공지사항',
    'FREE': '자유게시판',
    'EVENT': '이벤트',
    'ACADEMY': '아카데미',
    'ACADEMY_ADVERTISER': '광고주 칼럼',
    'ACADEMY_INFLUENCER': '인플루언서 칼럼',
    'FAQ': '자주묻는질문',
    'GUIDE': '가이드'
};

const typeColors: Record<string, string> = {
    '공지': 'bg-violet-100 text-violet-700 border-violet-200',
    '이벤트': 'bg-rose-100 text-rose-700 border-rose-200',
    'NOTICE': 'bg-violet-100 text-violet-700 border-violet-200',
    'FREE': 'bg-blue-100 text-blue-700 border-blue-200',
    'EVENT': 'bg-rose-100 text-rose-700 border-rose-200',
    'ACADEMY': 'bg-amber-100 text-amber-700 border-amber-200',
    'ACADEMY_ADVERTISER': 'bg-amber-100 text-amber-700 border-amber-200',
    'ACADEMY_INFLUENCER': 'bg-amber-100 text-amber-700 border-amber-200',
    'FAQ': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'GUIDE': 'bg-slate-100 text-slate-700 border-slate-200'
};

const navTypeMap: Record<string, string> = {
    '공지': 'NOTICE',
    '이벤트': 'EVENT',
    'FREE': 'FREE',
    'BLOG_INTRO': 'BLOG_INTRO',
    'ACADEMY_ADVERTISER': 'ACADEMY_ADVERTISER',
    'ACADEMY_INFLUENCER': 'ACADEMY_INFLUENCER',
    'FAQ': 'FAQ',
    'GUIDE': 'GUIDE'
};

export function createCommunityColumns(context: CommunityColumnContext): ColumnDef<Post>[] {
    return [
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
        {
            accessorKey: "type",
            header: "게시판",
            cell: ({ row }) => {
                const type = row.getValue("type") as string;
                const label = typeLabels[type] || type;
                return (
                    <Badge variant="outline" className={`${typeColors[type] || 'bg-gray-100 text-gray-700'} font-bold`}>
                        {label}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: "title",
            header: "제목",
            cell: ({ row }) => {
                const post = row.original;
                const type = post.type;
                
                // 테이블별 경로 처리
                // notices 테이블 (공지, 이벤트)
                // posts 테이블 (나머지)
                let viewHref = `/community/${post.id}`;
                if (type === '공지' || type === 'NOTICE') viewHref = `/community/notice/${post.id}`;
                else if (type === '이벤트' || type === 'EVENT') viewHref = `/community/event/${post.id}`;

                return (
                    <div className="flex flex-col max-w-[400px]">
                        <Link 
                            href={viewHref}
                            className="font-bold text-gray-900 hover:text-primary transition-colors truncate flex items-center gap-1.5"
                        >
                            {post.title}
                            <ExternalLink size={12} className="text-gray-400" />
                        </Link>
                        <span className="text-xs text-gray-500 truncate mt-1 opacity-70">
                            {[...post.content.replace(/<[^>]*>?/gm, '')].slice(0, 50).join('')}...
                        </span>
                    </div>
                );
            },
        },
        {
            id: "author",
            header: "작성자",
            cell: ({ row }) => {
                const profile = row.original.profiles;
                return (
                    <div className="flex items-center gap-2">
                        <Avatar 
                            src={profile?.avatar_url} 
                            fallback={profile?.nickname?.[0] || profile?.name?.[0] || '?'} 
                            className="h-6 w-6"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            {profile?.nickname || profile?.name || '익명'}
                        </span>
                    </div>
                );
            }
        },
        {
            accessorKey: "view_count",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    조회수
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="text-center font-medium text-gray-500">
                    {row.getValue("view_count")}
                </div>
            )
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    작성일
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
                    <Calendar size={14} className="text-gray-400" />
                    {new Date(row.getValue("created_at")).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    })}
                </div>
            ),
        },
        {
            id: "actions",
            header: () => <div className="text-center w-full">관리</div>,
            cell: ({ row }) => {
                const post = row.original;
                const editType = navTypeMap[post.type] || post.type;

                return (
                    <div className="flex justify-center items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px]">
                                <DropdownMenuLabel>글 관리</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem asChild>
                                    <Link href={`/community/write?type=${editType}&edit=${post.id}`} className="flex items-center">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        <span>글 수정</span>
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-[10px] text-gray-400 uppercase">게시판 이동</DropdownMenuLabel>
                                {Object.entries(typeLabels).map(([type, label]) => (
                                    type !== post.type && (
                                        <DropdownMenuItem key={type} onClick={() => context.onMove?.(post.id, type)}>
                                            <MoveRight className="mr-2 h-3.5 w-3.5 text-gray-400" />
                                            <span className="text-xs">{label}</span>
                                        </DropdownMenuItem>
                                    )
                                ))}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={() => context.onDelete?.(post.id)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>글 삭제</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];
}
