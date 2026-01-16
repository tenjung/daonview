'use client';

import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import CampaignCard from './CampaignCard';
import CampaignSkeleton from './CampaignSkeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CampaignCarouselProps {
    campaigns: any[];
    maxItems?: number;
    showNavigation?: boolean;
}

export default function CampaignCarousel({
    campaigns,
    maxItems = 4,
    showNavigation = false
}: CampaignCarouselProps) {
    // Hydration 에러 방지: 클라이언트 마운트 확인
    const [isMounted, setIsMounted] = useState(false);

    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        containScroll: 'trimSnaps',
        dragFree: true,
        slidesToScroll: 1,
    });

    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    // 클라이언트 마운트 감지
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 스크롤 가능 여부 업데이트
    const onSelect = () => {
        if (!emblaApi) return;
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
    };

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi]);

    const scrollPrev = () => emblaApi?.scrollPrev();
    const scrollNext = () => emblaApi?.scrollNext();

    // 스켈레톤 개수 계산
    const skeletonCount = Math.max(0, maxItems - campaigns.length);

    // 서버 렌더링 시: 모든 디바이스에 동일한 그리드 제공 (Hydration 에러 방지)
    if (!isMounted) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {campaigns.map((cam) => (
                    <CampaignCard key={cam.id} {...cam} />
                ))}
                {[...Array(skeletonCount)].map((_, i) => (
                    <CampaignSkeleton key={`skel-initial-${i}`} />
                ))}
            </div>
        );
    }

    // 클라이언트 마운트 후: 통합 캐러셀 적용
    return (
        <div className="relative group/carousel">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex -ml-4">
                    {campaigns.map((cam) => (
                        <div
                            key={cam.id}
                            className="pl-4 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 min-w-0 shrink-0 grow-0"
                        >
                            <CampaignCard {...cam} />
                        </div>
                    ))}
                    {[...Array(skeletonCount)].map((_, i) => (
                        <div
                            key={`skel-${i}`}
                            className="pl-4 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 min-w-0 shrink-0 grow-0"
                        >
                            <CampaignSkeleton />
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons - visible on hover or if forced */}
            {(showNavigation || campaigns.length > 2) && (
                <>
                    <button
                        onClick={scrollPrev}
                        disabled={!canScrollPrev}
                        className={`absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg border border-gray-100 flex items-center justify-center transition-all ${canScrollPrev
                            ? 'opacity-0 group-hover/carousel:opacity-100 hover:bg-white hover:scale-110'
                            : 'opacity-0 pointer-events-none'
                            }`}
                        aria-label="이전 캠페인"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                        onClick={scrollNext}
                        disabled={!canScrollNext}
                        className={`absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg border border-gray-100 flex items-center justify-center transition-all ${canScrollNext
                            ? 'opacity-0 group-hover/carousel:opacity-100 hover:bg-white hover:scale-110'
                            : 'opacity-0 pointer-events-none'
                            }`}
                        aria-label="다음 캠페인"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                </>
            )}
        </div>
    );
}
