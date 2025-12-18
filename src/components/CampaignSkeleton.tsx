import React from 'react';

const CampaignSkeleton = () => (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white h-full shadow-sm">
        <div className="aspect-[4/3] bg-rose-50 animate-pulse relative">
            <div className="absolute inset-0 flex items-center justify-center text-rose-200">
                <span className="text-4xl opacity-20 font-black">Coming Soon</span>
            </div>
        </div>
        <div className="p-5 space-y-3">
            <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-12 h-6 rounded bg-gray-100 animate-pulse" />
            </div>
            <div className="w-3/4 h-5 bg-gray-100 rounded animate-pulse" />
            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between">
                <div className="w-12 h-4 bg-gray-100 rounded animate-pulse" />
                <div className="w-12 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
        </div>
    </div>
);

export default CampaignSkeleton;
