'use client';

import React from 'react';
import { CircleAlert } from 'lucide-react';

interface HelpTooltipProps {
  content: string;
  size?: number;
  className?: string;
}

export function HelpTooltip({ content, size = 15, className = "" }: HelpTooltipProps) {
  return (
    <div className={`relative group/tooltip inline-flex items-center ${className}`}>
      <div className="text-primary hover:text-rose-600 transition-all duration-200 cursor-help p-0.5 active:scale-90 flex items-center justify-center">
        <CircleAlert size={size} strokeWidth={2.5} />
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[280px] p-3 bg-slate-900/95 text-white text-[12px] font-semibold rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 transform translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-pre-wrap leading-relaxed border border-white/10 backdrop-blur-md">
        <div className="relative z-10">
          {content}
        </div>
        {/* Pointer Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-slate-900/95"></div>
      </div>
    </div>
  );
}
