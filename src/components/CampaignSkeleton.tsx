import React from 'react';
import { Heart } from 'lucide-react';

interface CampaignSkeletonProps {
    variant?: 'default' | 'favorite';
}

const CampaignSkeleton = ({ variant = 'default' }: CampaignSkeletonProps) => (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white h-full shadow-sm">
        <div className="aspect-[4/3] bg-rose-50/50 animate-pulse relative">
            <div className="absolute inset-0 flex items-center justify-center text-rose-200">
                {variant === 'favorite' ? (
                    <div className="flex flex-col items-center gap-2">
                        <Heart size={48} className="opacity-20 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-30 px-3 py-1 bg-white rounded-full">Empty Slot</span>
                    </div>
                ) : (
                    <span className="text-4xl opacity-20 font-black text-center">Coming Soon</span>
                )}
            </div>
        </div>
        <div className="p-5 space-y-3">
            <div className="flex gap-2">
                <div className="w-16 h-6 rounded-lg bg-gray-50 animate-pulse" />
                <div className="w-12 h-6 rounded-lg bg-gray-50 animate-pulse" />
            </div>
            <div className="w-full h-5 bg-gray-50 rounded-lg animate-pulse" />
            <div className="w-2/3 h-4 bg-gray-50/50 rounded-lg animate-pulse" />
            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between">
                <div className="w-12 h-4 bg-gray-50 rounded-lg animate-pulse" />
                <div className="w-12 h-4 bg-gray-50 rounded-lg animate-pulse" />
            </div>
        </div>
    </div>
);

export default CampaignSkeleton;
