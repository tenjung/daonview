import type { ReactNode } from 'react';

export default function AutoLinkText({ text }: { text: string }) {
    const content: ReactNode[] = [];
    let cursor = 0;

    for (const match of text.matchAll(/https?:\/\/[^\s<>"'`]+/gi)) {
        const start = match.index;
        let url = match[0].replace(/[.,!?;:。，！？；：]+$/u, '');

        // Keep balanced URL parentheses, but leave surrounding prose punctuation outside the link.
        for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
            while (url.endsWith(close) && url.split(close).length > url.split(open).length) {
                url = url.slice(0, -1);
            }
        }

        try {
            const parsed = new URL(url);
            if (!parsed.hostname) continue;
        } catch {
            continue;
        }

        content.push(text.slice(cursor, start));
        content.push(
            <a
                key={start}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-blue-600 underline underline-offset-2 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
                {url}
            </a>
        );
        cursor = start + url.length;
    }

    content.push(text.slice(cursor));
    return <>{content}</>;
}
