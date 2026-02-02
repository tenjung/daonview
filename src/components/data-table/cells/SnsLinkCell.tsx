import { Instagram, ExternalLink } from 'lucide-react';

interface SnsLinkCellProps {
    url: string | null | undefined;
    platform?: 'instagram' | 'blog' | 'other';
}

export function SnsLinkCell({ url, platform = 'instagram' }: SnsLinkCellProps) {
    if (!url) {
        return <span className="text-xs text-gray-400 italic">미등록</span>;
    }

    const Icon = platform === 'instagram' ? Instagram : ExternalLink;
    const label = platform === 'instagram' ? 'Instagram' : platform === 'blog' ? '블로그' : 'SNS';

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline whitespace-nowrap"
        >
            <Icon size={14} className="flex-shrink-0" />
            <span>{label} 보기</span>
        </a>
    );
}
