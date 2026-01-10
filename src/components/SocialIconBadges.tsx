import { detectSocialPlatforms } from '@/lib/socialUtils';

interface SocialIconBadgesProps {
    snsUrl: string | null | undefined;
    size?: 'sm' | 'md' | 'lg';
}

export default function SocialIconBadges({ snsUrl, size = 'md' }: SocialIconBadgesProps) {
    if (!snsUrl) {
        return <span className="text-xs text-gray-400">SNS 미등록</span>;
    }

    const platforms = detectSocialPlatforms(snsUrl);

    const sizeClasses = {
        sm: 'w-6 h-6 text-[10px]',
        md: 'w-7 h-7 text-xs',
        lg: 'w-8 h-8 text-sm'
    };

    return (
        <div className="flex items-center gap-1.5">
            {platforms.map((platform, idx) => (
                <a
                    key={idx}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${sizeClasses[size]} rounded-full ${platform.color} flex items-center justify-center text-white hover:scale-110 transition-transform shadow-sm`}
                    title={platform.name}
                >
                    <span>{platform.icon}</span>
                </a>
            ))}
        </div>
    );
}
