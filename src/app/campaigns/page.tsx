'use client';

import { useState, useMemo, useEffect } from 'react';
import CampaignCard from '@/components/CampaignCard';
import { Filter, X, ChevronDown, ChevronUp, ChevronRight, Radio, Tag, MapPin, Search } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { mapCampaignToCard } from '@/lib/campaignUtils';

// Extended Dummy Data
// Dummy Data removed
const ALL_CAMPAIGNS: any[] = [];

// Define static options

// 지역 계층 구조 데이터
interface RegionData {
    name: string;
    value: string;
    children?: { name: string; value: string }[];
}

const REGION_HIERARCHY: RegionData[] = [
    {
        name: "서울",
        value: "서울",
        children: [
            { name: "강남구", value: "강남구" },
            { name: "강동구", value: "강동구" },
            { name: "강북구", value: "강북구" },
            { name: "강서구", value: "강서구" },
            { name: "관악구", value: "관악구" },
            { name: "광진구", value: "광진구" },
            { name: "구로구", value: "구로구" },
            { name: "금천구", value: "금천구" },
            { name: "노원구", value: "노원구" },
            { name: "도봉구", value: "도봉구" },
            { name: "동대문구", value: "동대문구" },
            { name: "동작구", value: "동작구" },
            { name: "마포구", value: "마포구" },
            { name: "서대문구", value: "서대문구" },
            { name: "서초구", value: "서초구" },
            { name: "성동구", value: "성동구" },
            { name: "성북구", value: "성북구" },
            { name: "송파구", value: "송파구" },
            { name: "양천구", value: "양천구" },
            { name: "영등포구", value: "영등포구" },
            { name: "용산구", value: "용산구" },
            { name: "은평구", value: "은평구" },
            { name: "종로구", value: "종로구" },
            { name: "중구", value: "중구" },
            { name: "중랑구", value: "중랑구" },
        ]
    },
    {
        name: "경기/인천",
        value: "경기/인천",
        children: [
            { name: "일산/파주", value: "일산/파주" },
            { name: "용인/분당/수원", value: "용인/분당/수원" },
            { name: "인천/부천", value: "인천/부천" },
            { name: "남양주/구리/하남", value: "남양주/구리/하남" },
            { name: "안양/안산/광명", value: "안양/안산/광명" },
        ]
    },
    { name: "충청/대전", value: "충청/대전" },
    { name: "경상/부산/대구", value: "경상/부산/대구" },
    { name: "전라/광주", value: "전라/광주" },
    { name: "강원/제주", value: "강원/제주" },
];

const PLATFORMS = ["BLOG", "INSTAGRAM", "YOUTUBE", "REELS", "TIKTOK"];

// Skeleton matching the representative placeholder color
const SkeletonCard = () => (
    <div className="border border-border rounded-xl overflow-hidden bg-white h-full shadow-sm">
        <div className="aspect-[4/3] bg-gradient-to-br from-rose-100 to-amber-50 animate-pulse relative">
            <div className="absolute inset-0 flex items-center justify-center text-rose-300">
                <span className="text-4xl opacity-20">Loading</span>
            </div>
        </div>
        <div className="p-5 space-y-3">
            <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 animate-pulse" />
                <div className="w-12 h-6 rounded bg-rose-50 animate-pulse" />
            </div>
            <div className="w-3/4 h-5 bg-rose-50 rounded animate-pulse" />
            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between">
                <div className="w-12 h-4 bg-rose-50 rounded animate-pulse" />
                <div className="w-12 h-4 bg-rose-50 rounded animate-pulse" />
            </div>
        </div>
    </div>
);

export default function CampaignsPage() {
    const [activeTab, setActiveTab] = useState<'ALL' | 'VISIT' | 'DELIVERY' | 'PURCHASE'>('ALL');
    const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const { data, error } = await supabase.from('campaigns').select('*, applications(count)').order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching campaigns:', error);
                    setLoading(false);
                    return;
                }

                if (data) {
                    console.log('Fetched campaigns:', data);
                    const mappedData = data.map(c => mapCampaignToCard(c as any));
                    console.log('Mapped campaigns:', mappedData);
                    setAllCampaigns(mappedData);
                }
            } catch (err) {
                console.error('Exception in fetchCampaigns:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, []);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [openRegions, setOpenRegions] = useState<string[]>([]); // 아코디언 열림 상태
    const [activeRegionTab, setActiveRegionTab] = useState<string>('서울'); // 스플릿 뷰 활성 탭
    const [sortBy, setSortBy] = useState('new');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [purchaseReviewOnly, setPurchaseReviewOnly] = useState(false); // 구매평만 필터

    // Dynamic Options derived from activeTab
    const currentCategories = useMemo(() => {
        if (activeTab === 'VISIT') return ["맛집", "뷰티(샵)", "여행/숙박", "문화/전시", "기타"];
        if (activeTab === 'DELIVERY') return ["뷰티(제품)", "패션", "생활", "푸드", "IT/가전", "유아동", "반려동물"];
        // ALL or PURCHASE defaults
        return ["맛집", "뷰티", "여행", "생활", "푸드", "IT/가전", "패션", "유아동", "기타"];
    }, [activeTab]);

    const showRegionFilter = activeTab === 'VISIT' || activeTab === 'ALL';
    const showPurchaseReviewFilter = activeTab === 'DELIVERY'; // 배송형일 때 구매평만 필터 표시

    // Helpers
    const toggleFilter = (item: string, currentList: string[], setter: any) => {
        if (currentList.includes(item)) {
            setter(currentList.filter(i => i !== item));
        } else {
            setter([...currentList, item]);
        }
    };

    const resetFilters = () => {
        setSelectedCategories([]);
        setSelectedPlatforms([]);
        setSelectedRegions([]);
        setOpenRegions([]);
        setPurchaseReviewOnly(false);
    };

    const handleTabChange = (newTab: 'ALL' | 'VISIT' | 'DELIVERY' | 'PURCHASE') => {
        setActiveTab(newTab);
        resetFilters();
    };

    // 지역 필터 핸들러 (하이브리드 아코디언)
    const handleRegionClick = (region: RegionData) => {
        // Case A: 하위 지역이 있는 경우 - 아코디언 토글
        if (region.children && region.children.length > 0) {
            if (openRegions.includes(region.value)) {
                setOpenRegions(openRegions.filter(r => r !== region.value));
            } else {
                setOpenRegions([...openRegions, region.value]);
            }
        }
        // Case B: 하위 지역이 없는 경우 - 즉시 선택
        else {
            toggleFilter(region.value, selectedRegions, setSelectedRegions);
        }
    };

    // 하위 지역 선택 핸들러 (여러 개 선택 가능하도록 자동 닫기 제거)
    const handleSubRegionClick = (subRegionValue: string) => {
        toggleFilter(subRegionValue, selectedRegions, setSelectedRegions);
    };

    const filteredData = useMemo(() => {
        return allCampaigns.filter(item => {
            // 검색어 필터링 (제목, 지역, 제공내역, 상품)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = item.title?.toLowerCase().includes(query);
                const matchesRegion = item.region?.toLowerCase().includes(query);
                const matchesRewards = item.rewards?.toLowerCase().includes(query);
                const matchesProduct = item.productName?.toLowerCase().includes(query);
                if (!matchesTitle && !matchesRegion && !matchesRewards && !matchesProduct) return false;
            }

            if (activeTab !== 'ALL' && item.type !== activeTab) return false;
            if (selectedCategories.length > 0 && item.category) {
                const itemCat = item.category;
                const matched = selectedCategories.some(selected => selected.includes(itemCat));
                if (!matched) return false;
            }
            if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(item.platform)) return false;
            if (showRegionFilter && selectedRegions.length > 0 && item.region && !selectedRegions.includes(item.region)) return false;

            // 배송형: 구매평만 필터
            if (purchaseReviewOnly && item.requiresPurchase !== true) return false;

            return true;
        }).sort((a, b) => {
            if (sortBy === 'deadline') return a.dday.localeCompare(b.dday);
            if (sortBy === 'popular') return b.applicants - a.applicants;
            return b.id - a.id;
        });
    }, [activeTab, selectedCategories, selectedPlatforms, selectedRegions, sortBy, showRegionFilter, allCampaigns, searchQuery, purchaseReviewOnly]);

    const activeFilterCount = selectedCategories.length + selectedPlatforms.length + selectedRegions.length;

    return (
        <div className="min-h-screen bg-white">
            {/* Top Filter Section */}
            <div className="sticky top-[70px] z-40 bg-white border-b border-border shadow-sm">
                <div className="container py-4">

                    {/* 1. Main Tabs */}
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                            {[
                                { label: '전체보기', value: 'ALL' },
                                { label: '방문형', value: 'VISIT' },
                                { label: '배송형', value: 'DELIVERY' },
                                { label: '서비스/기타', value: 'PURCHASE' },
                            ].map(tab => (
                                <button
                                    key={tab.value}
                                    onClick={() => handleTabChange(tab.value as any)}
                                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all min-w-[100px] ${activeTab === tab.value
                                        ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 1.5. 검색 바 */}
                    <div className="mb-4">
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="캠페인 제목, 지역, 제공내역, 상품명으로 검색..."
                                className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 2. Detailed Filter Toggle */}
                    <div className="flex justify-between items-center bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="flex items-center gap-2 font-bold text-gray-800 hover:text-primary transition-colors"
                            >
                                <Filter className="w-5 h-5" />
                                상세 필터
                                {isFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {activeFilterCount > 0 && (
                                <span className="text-xs font-bold text-primary bg-white px-2 py-0.5 rounded-full border border-primary/20">
                                    {activeFilterCount}개 선택됨
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={resetFilters}
                                className="text-xs text-gray-500 underline hover:text-red-500 flex items-center gap-1"
                            >
                                <X className="w-3 h-3" /> 초기화
                            </button>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="pl-2 pr-8 py-1.5 border border-border rounded-lg text-xs font-medium bg-white focus:outline-none focus:border-primary cursor-pointer"
                            >
                                <option value="new">최신순</option>
                                <option value="popular">인기순</option>
                                <option value="deadline">마감임박순</option>
                            </select>
                        </div>
                    </div>

                    {/* 3. Compact Inline Filters */}
                    {isFilterOpen && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                            {/* 통합 필터 - 한 줄 레이아웃 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* CHANNEL */}
                                <div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Channel</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PLATFORMS.map(plt => (
                                            <button
                                                key={plt}
                                                onClick={() => toggleFilter(plt, selectedPlatforms, setSelectedPlatforms)}
                                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${selectedPlatforms.includes(plt)
                                                    ? 'bg-slate-800 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {plt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* CATEGORY */}
                                <div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</div>
                                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                        {currentCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => toggleFilter(cat, selectedCategories, setSelectedCategories)}
                                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex-shrink-0 whitespace-nowrap ${selectedCategories.includes(cat)
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 배송형: 구매평만 필터 */}
                                {showPurchaseReviewFilter && (
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">구매평만</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            <button
                                                onClick={() => setPurchaseReviewOnly(!purchaseReviewOnly)}
                                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${purchaseReviewOnly
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {purchaseReviewOnly ? '✓ ' : ''}구매평만 보기
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 방문형/전체: AREA 필터 */}
                                {showRegionFilter && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Area</div>
                                            {selectedRegions.length > 0 && (
                                                <span className="text-xs text-blue-600 font-medium">
                                                    {selectedRegions.length}개
                                                </span>
                                            )}
                                        </div>

                                        {/* 모바일: 아코디언 (< md) */}
                                        <div className="md:hidden space-y-1">
                                            {REGION_HIERARCHY.map((region) => {
                                                const hasChildren = region.children && region.children.length > 0;
                                                const isOpen = openRegions.includes(region.value);
                                                const isSelected = selectedRegions.includes(region.value);

                                                return (
                                                    <div key={region.value}>
                                                        <button
                                                            onClick={() => handleRegionClick(region)}
                                                            className={`w-full px-3 py-2 rounded text-sm font-medium transition-all flex items-center justify-between ${isSelected
                                                                ? 'bg-blue-600 text-white'
                                                                : isOpen
                                                                    ? 'bg-blue-50 text-blue-700'
                                                                    : 'bg-gray-100 text-gray-600'
                                                                }`}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                {isSelected && !hasChildren && <span>✓</span>}
                                                                {region.name}
                                                            </span>
                                                            {hasChildren && (
                                                                <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                                                            )}
                                                        </button>

                                                        {hasChildren && isOpen && (
                                                            <div className="mt-1 ml-3 space-y-1">
                                                                {region.children!.map((subRegion) => {
                                                                    const isSubSelected = selectedRegions.includes(subRegion.value);
                                                                    return (
                                                                        <button
                                                                            key={subRegion.value}
                                                                            onClick={() => handleSubRegionClick(subRegion.value)}
                                                                            className={`w-full px-3 py-2 rounded text-sm font-medium transition-all text-left ${isSubSelected
                                                                                ? 'bg-blue-600 text-white'
                                                                                : 'bg-gray-100 text-gray-600'
                                                                                }`}
                                                                        >
                                                                            {isSubSelected && '✓ '}
                                                                            {subRegion.name}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* 데스크톱: 스플릿 뷰 (>= md) */}
                                        <div className="hidden md:block border border-gray-200 rounded overflow-hidden" style={{ height: '120px' }}>
                                            <div className="flex h-full">
                                                {/* Left: 상위 지역 */}
                                                <div className="w-2/5 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                                                    {REGION_HIERARCHY.map((region) => {
                                                        const hasChildren = region.children && region.children.length > 0;
                                                        const isActive = activeRegionTab === region.value;
                                                        const isSelected = selectedRegions.includes(region.value);

                                                        return (
                                                            <button
                                                                key={region.value}
                                                                onClick={() => {
                                                                    if (hasChildren) {
                                                                        setActiveRegionTab(region.value);
                                                                    } else {
                                                                        toggleFilter(region.value, selectedRegions, setSelectedRegions);
                                                                    }
                                                                }}
                                                                className={`w-full px-2 py-1.5 text-left text-xs font-medium transition-all border-b border-gray-100 ${isActive
                                                                    ? 'bg-white text-blue-600 border-l-2 border-l-blue-600'
                                                                    : isSelected
                                                                        ? 'bg-blue-50 text-blue-600'
                                                                        : 'text-gray-600 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                <span className="flex items-center justify-between">
                                                                    <span className="flex items-center gap-1">
                                                                        {isSelected && !hasChildren && <span className="text-blue-600 text-[10px]">✓</span>}
                                                                        {region.name}
                                                                    </span>
                                                                    {hasChildren && <ChevronRight className="w-3 h-3" />}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Right: 하위 지역 */}
                                                <div className="flex-1 bg-white p-2 overflow-y-auto">
                                                    {(() => {
                                                        const activeRegion = REGION_HIERARCHY.find(r => r.value === activeRegionTab);

                                                        if (!activeRegion?.children) {
                                                            return (
                                                                <div className="flex items-center justify-center h-full text-gray-400 text-[10px]">
                                                                    선택하세요
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div className="grid grid-cols-2 gap-1">
                                                                {activeRegion.children.map((subRegion) => {
                                                                    const isSubSelected = selectedRegions.includes(subRegion.value);
                                                                    return (
                                                                        <button
                                                                            key={subRegion.value}
                                                                            onClick={() => handleSubRegionClick(subRegion.value)}
                                                                            className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${isSubSelected
                                                                                ? 'bg-blue-600 text-white'
                                                                                : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
                                                                                }`}
                                                                        >
                                                                            {isSubSelected && '✓ '}
                                                                            {subRegion.name}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 선택된 필터 요약 (카테고리별 아이콘 구분) */}
                            {(selectedPlatforms.length > 0 || selectedCategories.length > 0 || selectedRegions.length > 0) && (
                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-gray-400">선택됨:</span>

                                    {/* Channel - Slate (Radio 아이콘) */}
                                    {selectedPlatforms.map(item => (
                                        <span
                                            key={item}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium"
                                        >
                                            <Radio className="w-3 h-3" />
                                            {item}
                                            <button
                                                onClick={() => toggleFilter(item, selectedPlatforms, setSelectedPlatforms)}
                                                className="hover:bg-slate-200 rounded-full"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </span>
                                    ))}

                                    {/* Category - Pink (Tag 아이콘) */}
                                    {selectedCategories.map(item => (
                                        <span
                                            key={item}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs font-medium"
                                        >
                                            <Tag className="w-3 h-3" />
                                            {item}
                                            <button
                                                onClick={() => toggleFilter(item, selectedCategories, setSelectedCategories)}
                                                className="hover:bg-pink-200 rounded-full"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </span>
                                    ))}

                                    {/* Area - Blue (MapPin 아이콘) */}
                                    {selectedRegions.map(item => (
                                        <span
                                            key={item}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                                        >
                                            <MapPin className="w-3 h-3" />
                                            {item}
                                            <button
                                                onClick={() => toggleFilter(item, selectedRegions, setSelectedRegions)}
                                                className="hover:bg-blue-200 rounded-full"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Main Grid Content */}
            <div className="container py-8">
                <h2 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
                    검색 결과 <span className="text-primary">{filteredData.length}</span>
                </h2>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filteredData.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredData.map(item => (
                            <CampaignCard
                                key={item.id}
                                {...item}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-32 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500">
                        <div className="text-5xl mb-4 opacity-50">🔍</div>
                        <p className="text-xl font-bold text-gray-900 mb-2">원하시는 캠페인을 찾지 못했어요</p>
                        <p className="text-sm text-gray-500">선택하신 필터 조건을 변경하여 다시 검색해보세요.</p>
                        <button onClick={resetFilters} className="mt-6 px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                            모든 필터 해제하기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
