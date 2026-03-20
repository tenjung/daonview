'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

interface InfluencerMobileListCardProps {
  href?: string;
  thumbnail?: ReactNode;
  title: string;
  badge?: ReactNode;
  meta?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function InfluencerMobileListCard({
  href,
  thumbnail,
  title,
  badge,
  meta,
  subtitle,
  actions,
}: InfluencerMobileListCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-colors hover:border-primary/30 hover:bg-rose-50/20">
      <div className="flex items-start gap-3">
        {thumbnail ? (
          href ? <Link href={href} className="shrink-0">{thumbnail}</Link> : <div className="shrink-0">{thumbnail}</div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {href ? (
              <Link href={href} className="line-clamp-2 text-sm font-bold leading-5 text-gray-900">
                {title}
              </Link>
            ) : (
              <p className="line-clamp-2 text-sm font-bold leading-5 text-gray-900">{title}</p>
            )}
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>
          {meta ? <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">{meta}</div> : null}
          {subtitle ? <div className="mt-2 text-xs text-gray-500">{subtitle}</div> : null}
          {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
