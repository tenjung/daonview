'use client';

import type { ReactNode } from 'react';

interface InfluencerMobileHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function InfluencerMobileHeader({
  icon,
  title,
  subtitle,
  action,
}: InfluencerMobileHeaderProps) {
  return (
    <div className="border-y border-gray-100 bg-white px-4 py-5 sm:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-primary">
            {icon}
            <span className="text-xs font-black uppercase tracking-[0.24em]">Influencer</span>
          </div>
          <h1 className="text-[2rem] font-black leading-[0.92] tracking-tight text-gray-900">
            {title}
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            {subtitle}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
