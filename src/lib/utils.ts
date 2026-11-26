import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// tailwind.config.ts에 추가한 디자인 토큰(글자 2xs·body-sm·cta, 모서리 btn)을 알려 줘야
// 색 클래스(text-white 등)와 합칠 때 글자 크기가 지워지지 않는다(docs/rules/design.md 3.8).
const twMerge = extendTailwindMerge({
    extend: { theme: { text: ['2xs', 'body-sm', 'cta'], radius: ['btn'] } },
})

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const OPTIMIZABLE_IMAGE_HOST_PATTERNS = [
    /^whpyftpktolpaspeuocg\.supabase\.co$/i,
    /(^|\.)pstatic\.net$/i,
    /(^|\.)cdninstagram\.com$/i,
    /^lh3\.googleusercontent\.com$/i,
    /^i\.ytimg\.com$/i,
    /^yt3\.ggpht\.com$/i,
    /(^|\.)fbcdn\.net$/i,
];

export function isOptimizableImageSrc(src?: string | null): boolean {
    if (!src) return false;
    if (src.startsWith('/')) return true;

    try {
        const url = new URL(src);
        if (url.protocol !== 'https:') return false;
        return OPTIMIZABLE_IMAGE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname));
    } catch {
        return false;
    }
}

export function formatTimeAgo(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return "방금 전";
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}주 전`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}개월 전`;
    
    const years = Math.floor(days / 365);
    return `${years}년 전`;
}
