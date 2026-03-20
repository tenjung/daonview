"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface AdminListActionMenuItem {
    key: string
    label: string
    icon?: ReactNode
    onSelect?: () => void
    href?: string
    external?: boolean
    variant?: "default" | "destructive" | "success"
    disabled?: boolean
    separatorBefore?: boolean
    groupLabel?: string
}

interface AdminListActionMenuProps {
    label: string
    items: AdminListActionMenuItem[]
    buttonText?: string
    align?: "start" | "center" | "end"
    widthClass?: string
}

const itemVariantClass: Record<NonNullable<AdminListActionMenuItem["variant"]>, string> = {
    default: "",
    destructive: "text-red-600 focus:text-red-600 focus:bg-red-50",
    success: "text-emerald-700 focus:text-emerald-700",
}

export default function AdminListActionMenu({
    label,
    items,
    buttonText = "설정",
    align = "end",
    widthClass = "w-[160px]",
}: AdminListActionMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 whitespace-nowrap border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                    {buttonText}
                    <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-slate-500" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className={widthClass}>
                <DropdownMenuLabel>{label}</DropdownMenuLabel>
                {items.map((item) => {
                    const variantClass = itemVariantClass[item.variant ?? "default"]

                    return (
                        <div key={item.key}>
                            {item.separatorBefore ? <DropdownMenuSeparator /> : null}
                            {item.groupLabel ? (
                                <DropdownMenuLabel className="text-[10px] text-gray-400 uppercase">
                                    {item.groupLabel}
                                </DropdownMenuLabel>
                            ) : null}
                            {item.href && !item.external ? (
                                <DropdownMenuItem asChild disabled={item.disabled} className={variantClass}>
                                    <Link href={item.href} className="flex items-center">
                                        {item.icon ? <span className="mr-2">{item.icon}</span> : null}
                                        <span>{item.label}</span>
                                    </Link>
                                </DropdownMenuItem>
                            ) : item.href && item.external ? (
                                <DropdownMenuItem asChild disabled={item.disabled} className={variantClass}>
                                    <a href={item.href} target="_blank" rel="noreferrer" className="flex items-center">
                                        {item.icon ? <span className="mr-2">{item.icon}</span> : null}
                                        <span>{item.label}</span>
                                    </a>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    disabled={item.disabled}
                                    onClick={item.onSelect}
                                    className={variantClass}
                                >
                                    {item.icon ? <span className="mr-2">{item.icon}</span> : null}
                                    <span>{item.label}</span>
                                </DropdownMenuItem>
                            )}
                        </div>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
