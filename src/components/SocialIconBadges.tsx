import { detectSocialPlatforms } from '@/lib/socialUtils';
import { cn } from '@/lib/utils';

interface SocialIconBadgesProps {
    snsUrl: string | null | undefined;
    size?: 'sm' | 'md' | 'lg';
}

// 브랜드별 고퀄리티 SVG 아이콘 정의
const BrandIcons = {
    naver: (className: string) => (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
        </svg>
    ),
    instagram: (className: string) => (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
    ),
    youtube: (className: string) => (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
    ),
    tiktok: (className: string) => (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.9-.39-2.81-.12-1.07.32-2 1.1-2.42 2.11-.42.94-.44 2.05-.06 3.01.31.97 1.15 1.7 2.13 1.99.96.28 2.02.2 2.81-.39.87-.64 1.25-1.72 1.25-2.79l.06-13.33z" />
        </svg>
    ),
    default: (className: string) => (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
    )
};

export default function SocialIconBadges({ snsUrl, size = 'md' }: SocialIconBadgesProps) {
    if (!snsUrl) {
        return <span className="text-[11px] font-bold text-gray-300 tracking-tight">SNS 미등록</span>;
    }

    const platforms = detectSocialPlatforms(snsUrl);

    const sizeClasses = {
        sm: 'w-6 h-6 p-1.5',
        md: 'w-7 h-7 p-1.5',
        lg: 'w-8 h-8 p-2'
    };

    const iconSizeClasses = {
        sm: 'w-full h-full',
        md: 'w-full h-full',
        lg: 'w-full h-full'
    };

    const getPlatformStyles = (name: string) => {
        const lowerName = name.toLowerCase();
        // 한글 이름과 영문 이름 모두 체크
        if (lowerName.includes('naver') || lowerName.includes('네이버')) return { 
            bg: 'bg-[#03C75A]', 
            icon: BrandIcons.naver,
            shadow: 'shadow-[#03C75A]/20'
        };
        if (lowerName.includes('instagram') || lowerName.includes('인스타그램')) return { 
            bg: 'bg-gradient-to-tr from-[#FFB800] via-[#FF0069] to-[#7600EC]', 
            icon: BrandIcons.instagram,
            shadow: 'shadow-pink-500/20'
        };
        if (lowerName.includes('youtube') || lowerName.includes('유튜브')) return { 
            bg: 'bg-[#FF0000]', 
            icon: BrandIcons.youtube,
            shadow: 'shadow-[#FF0000]/20'
        };
        if (lowerName.includes('tiktok') || lowerName.includes('틱톡')) return { 
            bg: 'bg-[#000000]', 
            icon: BrandIcons.tiktok,
            shadow: 'shadow-black/20'
        };
        return { 
            bg: 'bg-slate-400', 
            icon: BrandIcons.default,
            shadow: 'shadow-slate-400/20'
        };
    };

    return (
        <div className="flex items-center gap-1.5">
            {platforms.map((platform, idx) => {
                const style = getPlatformStyles(platform.name);
                return (
                    <a
                        key={idx}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            sizeClasses[size],
                            style.bg,
                            style.shadow,
                            "rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-md group border border-white/10"
                        )}
                        title={platform.name}
                    >
                        <div className="w-full h-full flex items-center justify-center">
                            {style.icon(iconSizeClasses[size])}
                        </div>
                    </a>
                );
            })}
        </div>
    );
}
