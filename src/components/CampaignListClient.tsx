'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useSearchParams } from 'next/navigation';
import CampaignCard from '@/components/CampaignCard';
import CampaignSkeleton from '@/components/CampaignSkeleton';
import { Filter, X, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface CampaignListClientProps {
    initialCampaigns: CampaignListItem[];
}

type CampaignTab = 'ALL' | 'VISIT' | 'DELIVERY' | 'PURCHASE_REVIEW' | 'STEADY';
type SortBy = 'new' | 'popular' | 'steady' | 'deadline';

type CampaignListItem = {
    id?: number | string;
    title: string;
    platform: string;
    type?: string;
    applicants: number;
    total: number;
    dday: string;
    imageUrl?: string;
    category?: string | null;
    provision?: string | null;
    region?: string | null;
    includeReview?: boolean;
    includeNaver?: boolean;
    includeInstagram?: boolean;
    is_unlimited_recruitment?: boolean;
    scheduleType?: string | null;
    sub_region?: string | null;
    end_date?: string | null;
    created_at?: string | null;
};

const PLATFORMS = ["BLOG", "INSTAGRAM", "YOUTUBE", "REELS", "TIKTOK"];
const CAMPAIGN_TABS: CampaignTab[] = ['ALL', 'STEADY', 'VISIT', 'DELIVERY', 'PURCHASE_REVIEW'];
const SORT_OPTIONS: { label: string; value: SortBy }[] = [
    { label: '최신순', value: 'new' },
    { label: '인기순', value: 'popular' },
    { label: '빠른모집 우선', value: 'steady' },
    { label: '마감임박순', value: 'deadline' }
];

const REGION_HIERARCHY = [
    { name: "전체", value: "" },
    {
        name: "서울",
        value: "서울",
        children: [
            { name: "강남/역삼/삼성", value: "강남" },
            { name: "신사/압구정", value: "신사" },
            { name: "서초/교대", value: "서초" },
            { name: "잠실/신천", value: "잠실" },
            { name: "홍대/합정/망원", value: "홍대" },
            { name: "종로/대학로", value: "종로" },
            { name: "건대/광진", value: "건대" },
            { name: "여의도/영등포", value: "여의도" }
        ]
    },
    {
        name: "경기",
        value: "경기",
        children: [
            { name: "수원/인계", value: "수원" },
            { name: "분당/판교", value: "분당" },
            { name: "일산/고양", value: "일산" },
            { name: "부천", value: "부천" },
            { name: "안양/평촌", value: "안양" }
        ]
    },
    { name: "인천", value: "인천" },
    { name: "부산", value: "부산" },
    { name: "대구", value: "대구" },
    { name: "광주", value: "광주" },
    { name: "대전", value: "대전" },
    { name: "울산", value: "울산" },
    { name: "세종", value: "세종" },
    { name: "강원", value: "강원" },
    { name: "충청", value: "충청" },
    { name: "전라", value: "전라" },
    { name: "경상", value: "경상" },
    { name: "제주", value: "제주" },
];

function CampaignListContent({ initialCampaigns }: CampaignListClientProps) {
    const searchParams = useSearchParams();
    const [campaigns, setCampaigns] = useState(initialCampaigns);
    const [activeTab, setActiveTab] = useState<CampaignTab>('ALL');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [selectedMajorRegion, setSelectedMajorRegion] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [sortBy, setSortBy] = useState<SortBy>('new');

    // URL 파라미터 감지 (예: ?sort=steady)
    useEffect(() => {
        const sort = searchParams.get('sort');
        if (sort === 'steady') {
            setActiveTab('STEADY');
            setSortBy('steady');
        } else if (sort === 'popular') {
            setSortBy('popular');
        } else if (sort === 'new') {
            setSortBy('new');
        }
    }, [searchParams]);

    // initialCampaigns가 변경될 때마다 campaigns 상태 업데이트
    useEffect(() => {
        setCampaigns(initialCampaigns);
    }, [initialCampaigns]);

    // Scroll to top when tab changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    const filteredData = useMemo(() => {
        return campaigns.filter(item => {
            if (activeTab === 'PURCHASE_REVIEW') {
                // 구매평 포함 여부 확인 (신규 includeReview 플래그 또는 레거시 platform/type 체크)
                if (!(item.includeReview || item.platform === 'PURCHASE' || item.type === 'PURCHASE')) return false;
            } else if (activeTab === 'STEADY') {
                if (item.scheduleType !== 'FAST') return false;
            } else if (activeTab !== 'ALL') {
                // 일반 탭 (VISIT, DELIVERY 등) 필터링
                if (item.type !== activeTab) return false;
            }

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match = 
                    item.title?.toLowerCase().includes(q) || 
                    item.region?.toLowerCase().includes(q) ||
                    item.sub_region?.toLowerCase().includes(q);
                if (!match) return false;
            }

            if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(item.platform)) return false;

            if (selectedRegions.length > 0) {
                const match = selectedRegions.some(r => 
                    (item.region && item.region.includes(r)) || 
                    (item.sub_region && item.sub_region.includes(r))
                );
                if (!match) return false;
            } else if (selectedMajorRegion && (item.region || item.sub_region)) {
                // 광역 지역 키워드 매핑 (경상 -> 경북/경남 등)
                const regionKeywordMap: Record<string, string[]> = {
                    '경상': ['경상', '경북', '경남'],
                    '충청': ['충청', '충북', '충남'],
                    '전라': ['전라', '전북', '전남']
                };
                
                const searchKeywords = regionKeywordMap[selectedMajorRegion] || [selectedMajorRegion];
                const match = searchKeywords.some(k => 
                    (item.region && item.region.includes(k)) || 
                    (item.sub_region && item.sub_region.includes(k))
                );
                if (!match) return false;
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === 'popular') return b.applicants - a.applicants;
            if (sortBy === 'steady') {
                const aFast = a.scheduleType === 'FAST';
                const bFast = b.scheduleType === 'FAST';
                if (aFast && !bFast) return -1;
                if (!aFast && bFast) return 1;
                return new Date(a.end_date ?? 0).getTime() - new Date(b.end_date ?? 0).getTime();
            }
            if (sortBy === 'deadline') {
                const dateA = new Date(a.end_date ?? 0).getTime();
                const dateB = new Date(b.end_date ?? 0).getTime();
                return dateA - dateB;
            }
            const timeA = new Date(a.created_at ?? 0).getTime();
            const timeB = new Date(b.created_at ?? 0).getTime();
            return timeB - timeA;
        });
    }, [activeTab, campaigns, searchQuery, selectedPlatforms, selectedRegions, selectedMajorRegion, sortBy]);

    const toggleFilter = (item: string, list: string[], setter: Dispatch<SetStateAction<string[]>>) => {
        setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const hasActiveFilters = selectedPlatforms.length > 0 || selectedRegions.length > 0 || selectedMajorRegion !== '' || searchQuery !== '';

    const clearAllFilters = () => {
        setSelectedPlatforms([]);
        setSelectedRegions([]);
        setSelectedMajorRegion('');
        setSearchQuery('');
    };

    return (
        <>
            <div className={`sticky top-[70px] z-40 w-full bg-white border-b border-slate-100 shadow-md transition-all ${isFilterOpen ? 'py-4 md:py-5' : 'py-2 md:py-2.5'}`}>
                <div className="max-w-[1200px] mx-auto px-4 md:px-10">
                    <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
                        <div className="flex bg-slate-100 p-1 rounded-full w-full md:w-auto overflow-x-auto custom-scrollbar">
                            {CAMPAIGN_TABS.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 sm:flex-none flex justify-center items-center px-2 sm:px-5 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-rose-500 shadow-sm ring-1 ring-slate-200 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab === 'ALL' ? <><span className="sm:hidden">전체</span><span className="hidden sm:inline">전체보기</span></> : 
                                     tab === 'STEADY' ? <><span className="sm:hidden">빠른</span><span className="hidden sm:inline">빠른모집</span></> : 
                                     tab === 'VISIT' ? <><span className="sm:hidden">방문</span><span className="hidden sm:inline">방문형</span></> : 
                                     tab === 'DELIVERY' ? <><span className="sm:hidden">배송</span><span className="hidden sm:inline">배송형</span></> : 
                                     <><span className="sm:hidden">구매평</span><span className="hidden sm:inline">구매평만</span></>}
                                </button>
                            ))}
                        </div>

                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="캠페인 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-2 bg-slate-50 border-2 border-transparent focus:border-rose-500 focus:bg-white rounded-full text-sm font-medium transition-all outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                            {hasActiveFilters && (
                                <button
                                    onClick={clearAllFilters}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs transition-all bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white shadow-sm"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">전체 초기화</span>
                                </button>
                            )}

                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-all ${isFilterOpen ? 'bg-slate-900 text-white shadow-lg' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                            >
                                <Filter className="w-4 h-4" />
                                <span className="hidden lg:inline">상세설정</span>
                                {isFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all group"
                                >
                                    <span className="text-sm font-semibold text-slate-700">
                                        {sortBy === 'new' ? '최신순' : sortBy === 'popular' ? '인기순' : sortBy === 'steady' ? '빠른모집 우선' : '마감임박순'}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isSortOpen && (
                                    <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        {SORT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => {
                                                    setSortBy(opt.value);
                                                    setIsSortOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 rounded-xl text-xs font-medium transition-all ${sortBy === opt.value ? 'bg-rose-50 text-rose-500 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isFilterOpen && (
                        <div className="mt-8 pt-8 border-t border-slate-50">
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Channels</p>
                                    <div className="flex flex-wrap gap-2">
                                        {PLATFORMS.map(p => (
                                            <button key={p} onClick={() => toggleFilter(p, selectedPlatforms, setSelectedPlatforms)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${selectedPlatforms.includes(p) ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{p}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Regions</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {REGION_HIERARCHY.map(r => (
                                            <button
                                                key={r.name}
                                                onClick={() => {
                                                    if (r.value === "") {
                                                        setSelectedRegions([]);
                                                        setSelectedMajorRegion("");
                                                    } else {
                                                        setSelectedMajorRegion(r.value);
                                                        // 광역 지역 클릭 시 상세 지역 선택은 초기화하여 키워드 맵핑 검색이 작동하도록 함
                                                        setSelectedRegions([]);
                                                    }
                                                }}
                                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${selectedMajorRegion === r.value || (r.value === "" && selectedRegions.length === 0) ? 'bg-rose-500 text-white shadow-md shadow-rose-200 font-semibold' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            >
                                                {r.name}
                                            </button>
                                        ))}
                                    </div>

                                    {selectedMajorRegion && REGION_HIERARCHY.find(r => r.value === selectedMajorRegion)?.children && (
                                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl">
                                            {REGION_HIERARCHY.find(r => r.value === selectedMajorRegion)?.children?.map(c => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => toggleFilter(c.value, selectedRegions, setSelectedRegions)}
                                                    className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedRegions.includes(c.value) ? 'bg-slate-900 text-white font-semibold' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
                                                >
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-3 md:px-10 py-12">
                <div className="flex items-center gap-3 mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">캠페인 목록</h2>
                    <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-semibold">{filteredData.length}</span>
                </div>

                {filteredData.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 xl:gap-6">
                        {filteredData.map(item => (
                            <CampaignCard key={item.id} {...item} density="compact" />
                        ))}
                        {[...Array(Math.max(15 - filteredData.length, (5 - (filteredData.length % 5)) % 5))].map((_, i) => (
                            <CampaignSkeleton key={`skel-fill-${i}`} density="compact" />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <p className="text-4xl mb-4">🔍</p>
                        <p className="text-xl font-black text-slate-900">찾으시는 캠페인이 없어요</p>
                        <p className="text-slate-500 mt-2">필터를 초기화하거나 다른 검색어를 입력해보세요.</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default function CampaignListClient(props: CampaignListClientProps) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <CampaignListContent {...props} />
        </Suspense>
    );
}
