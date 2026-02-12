"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Mail, Phone, Calendar, Building2, MoreHorizontal, ChevronDown, UserCog, ShieldAlert, Trash2 } from "lucide-react"
import { Profile } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar } from "@/components/ui/avatar"
import { DateCell } from "@/components/data-table"
import SocialIconBadges from "@/components/SocialIconBadges"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserColumnContext {
    onRoleChange?: (id: string, newRole: string) => void
    onDelete?: (id: string, email: string) => void
    isAdmin?: boolean
}

// 등급 Badge
function RoleBadge({ role }: { role: string }) {
    const baseClass = "px-1.5 py-0 rounded text-[10px] font-black border whitespace-nowrap uppercase";
    switch (role?.toUpperCase()) {
        case 'ADMIN':
            return <span className={`${baseClass} bg-violet-100 text-violet-700 border-violet-200`}>관리자</span>;
        case 'ADVERTISER':
            return <span className={`${baseClass} bg-blue-100 text-blue-700 border-blue-200`}>광고주</span>;
        case 'INFLUENCER':
            return <span className={`${baseClass} bg-rose-100 text-rose-700 border-rose-200`}>인플루언서</span>;
        default:
            return <span className={`${baseClass} bg-gray-100 text-gray-700 border-gray-200`}>{role}</span>;
    }
}

// 회원 정보 셀
function UserInfoCell({ user }: { user: Profile }) {
    return (
        <div className="flex items-center gap-4">
            <Avatar
                src={user.avatar_url}
                fallback={user.nickname?.[0] || user.email?.[0]}
                className="h-10 w-10 border border-border shadow-sm shrink-0"
            />
            <div className="flex flex-col min-w-0">
                <span className="font-bold text-gray-900 truncate">
                    {user.nickname || '닉네임 없음'}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail size={12} className="text-gray-400" />
                    {user.email}
                </span>
            </div>
        </div>
    );
}

export function createUserColumns(context: UserColumnContext): ColumnDef<Profile>[] {
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
        // 회원 정보
        {
            accessorKey: "nickname",
            header: "회원 정보",
            cell: ({ row }) => <UserInfoCell user={row.original} />,
            enableSorting: true,
        },
        // 역할/등급
        {
            accessorKey: "role",
            header: "역할/등급",
            cell: ({ row }) => {
                const user = row.original;
                const role = row.getValue("role") as string;
                return (
                    <div className="flex flex-col gap-1 items-start min-h-[38px] justify-center">
                        <RoleBadge role={role} />
                        {role?.toUpperCase() === 'ADVERTISER' && user.company_name && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 ml-0.5 mt-0.5">
                                <Building2 size={10} className="opacity-70" />
                                {user.company_name}
                            </span>
                        )}
                    </div>
                );
            },
        },
        // 연락처
        {
            accessorKey: "phone_number",
            header: "연락처",
            cell: ({ row }) => (
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5 whitespace-nowrap">
                    <Phone size={14} className="text-gray-400" />
                    {row.getValue("phone_number") || '미등록'}
                </span>
            ),
        },
        // 활동채널 (SNS)
        {
            id: "sns",
            header: "활동채널",
            cell: ({ row }) => (
                <div className="flex items-center">
                    <SocialIconBadges snsUrl={row.original.sns_url} />
                </div>
            ),
        },
        // 가입일
        {
            accessorKey: "created_at",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="whitespace-nowrap"
                    >
                        가입일
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
                    <Calendar size={14} className="text-gray-400" />
                    {new Date(row.getValue("created_at")).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }).replace(/\s/g, '').replace(/\.$/, '')}
                </div>
            ),
        },
        // 회원 설정 (관리 액션)
        {
            id: "actions",
            header: () => <div className="text-center w-full whitespace-nowrap">회원 설정</div>,
            cell: ({ row }) => {
                const user = row.original;

                return (
                    <div className="flex justify-center items-center w-full">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold gap-1 h-8 px-2.5">
                                    설정/관리
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px]">
                                <DropdownMenuLabel>회원 설정</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-[10px] text-gray-400 uppercase">등급 변경</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => context.onRoleChange?.(user.id, 'INFLUENCER')}>
                                    <div className="w-2 h-2 rounded-full bg-rose-500 mr-2"></div>
                                    <span>인플루언서로 변경</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => context.onRoleChange?.(user.id, 'ADVERTISER')}>
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                    <span>광고주로 변경</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => context.onRoleChange?.(user.id, 'ADMIN')}>
                                    <div className="w-2 h-2 rounded-full bg-violet-500 mr-2"></div>
                                    <span>관리자로 변경</span>
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={() => context.onDelete?.(user.id, user.email || '')}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>회원 강제 탈퇴</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];
}
