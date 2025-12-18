'use client';

import { useState, useMemo, useEffect } from 'react';
import CampaignCard from '@/components/CampaignCard';
import { Filter, X, ChevronDown, ChevronUp, ChevronRight, Radio, Tag, MapPin, Search } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { mapCampaignToCard } from '@/lib/campaignUtils';

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
    {
        name: "경상/부산/대구",
        value: "경상/부산/대구",
        children: [
            { name: "대구 전체", value: "대구/전체" },
            { name: "대구 수성구", value: "대구/수성구" },
            { name: "대구 중구", value: "대구/중구" },
            { name: "대구 동구", value: "대구/동구" },
            { name: "대구 서구", value: "대구/서구" },
            { name: "대구 남구", value: "대구/남구" },
            { name: "대구 북구", value: "대구/북구" },
            { name: "대구 달서구", value: "대구/달서구" },
            { name: "대구 달성군", value: "대구/달성군" },
            { name: "부산 전체", value: "부산/전체" },
            { name: "부산 해운대구", value: "부산/해운대구" },
            { name: "부산 진구", value: "부산/진구" },
            { name: "부산 수영구", value: "부산/수영구" },
            { name: "부산 남구", value: "부산/남구" },
            { name: "부산 동래구", value: "부산/동래구" },
            { name: "부산 사하구", value: "부산/사하구" },
        ]
    },
    { name: "충청/대전", value: "충청/대전" },
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

// Placeholder for empty slots to make the grid look full
const PlaceholderCard = () => (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white h-full shadow-sm opacity-40 select-none pointer-events-none">
        <div className="aspect-[4/3] bg-gray-50 relative">
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-200 tracking-widest uppercase">Coming Soon</span>
            </div>
        </div>
        <div className="p-5 space-y-4">
            <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100" />
                <div className="w-12 h-6 rounded bg-gray-100" />
            </div>
            <div className="w-3/4 h-5 bg-gray-100 rounded" />
            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between">
                <div className="w-12 h-4 bg-gray-50 rounded" />
                <div className="w-12 h-4 bg-gray-50 rounded" />
            </div>
        </div>
    </div>
);

export default function CampaignsPage() {
    const [activeTab, setActiveTab] = useState<'ALL' | 'VISIT' | 'DELIVERY' | 'PURCHASE'>('ALL');
    const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchCampaigns = async () => {
            console.log('🔄 캠페인 데이터 불러오기 시작...');
            // 만약 10초 이상 걸리면 강제로 로딩을 종료하여 사용자가 새로고침할 수 있게 함
            const timeout = setTimeout(() => {
                if (isMounted && loading) {
                    console.warn('⚠️ 데이터 로딩 시간이 너무 길어 강제로 로딩 상태를 종료합니다.');
                    setLoading(false);
                }
            }, 10000);

            try {
                const { data, error } = await supabase
                    .from('campaigns')
                    .select('*, applications(count)')
                    .in('status', ['RECRUITING', 'ONGOING'])
                    .order('created_at', { ascending: false });

                if (!isMounted) return;

                if (error) {
                    console.error('❌ 캠페인 목록 조회 실패:', error);
                    return;
                }

                if (data && data.length > 0) {
                    console.log(`✅ ${data.length}개의 캠페인을 불러왔습니다.`);
                    const mappedData = data.map(c => mapCampaignToCard(c as any));
                    setAllCampaigns(mappedData);
                } else {
                    console.log('ℹ️ 조회된 캠페인이 없습니다.');
                    setAllCampaigns([]);
                }
            } catch (err) {
                console.error('⚠️ 데이터 처리 중 예외 발생:', err);
            } finally {
                clearTimeout(timeout);
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchCampaigns();
        return () => { isMounted = false; };
    }, []);

    const manualRefresh = () => {
        setLoading(true);
        // window.location.reload() 대신 상태를 초기화하고 강제 리페치 유도 가능하지만
        // 여기서는 단순하게 다시 fetch 로직을 돌리는게 좋으나, useEffect dependencies가 []이므로
        // 간단하게 페이지 새로고침을 제안하거나 fetch 함수를 외부로 뺍니다.
        window.location.reload(); 
    };
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
                const matchesTitle = item.title?.toLowerCase()?.includes(query);
                const matchesRegion = item.region?.toLowerCase()?.includes(query);
                const matchesProvision = item.provision?.toLowerCase()?.includes(query);
                const matchesProduct = item.productName?.toLowerCase()?.includes(query);
                if (!matchesTitle && !matchesRegion && !matchesProvision && !matchesProduct) return false;
            }

            if (activeTab !== 'ALL' && item.type !== activeTab) return false;
            if (selectedCategories.length > 0 && item.category) {
                const itemCat = item.category;
                const matched = selectedCategories.some(selected => selected.includes(itemCat));
                if (!matched) return false;
            }
            if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(item.platform)) return false;
            if (showRegionFilter && selectedRegions.length > 0 && item.region) {
                const isMatched = selectedRegions.some(selected => {
                    // '/' 가 포함된 필터값(예: '대구/수성구')인 경우 조각내서 검색
                    if (selected.includes('/')) {
                        const parts = selected.split('/');
                        // '대구/전체' 같은 경우 '대구'만 포함되면 매칭
                        if (parts[1] === '전체') return item.region.includes(parts[0]);
                        // '대구/수성구' 같은 경우 '수성구'가 포함되면 매칭
                        return item.region.includes(parts[1]);
                    }
                    
                    // 1. 선택된 필터가 캠페인 지역 텍스트에 포함되는지 확인
                    if (item.region.includes(selected)) return true;
                    
                    // 2. 상위 지역(시/도) 필터가 선택된 경우 (예: '서울', '전라/광주')
                    const mainRegion = REGION_HIERARCHY.find(r => r.name === selected || r.value === selected);
                    if (mainRegion && mainRegion.children) {
                        return mainRegion.children.some(child => {
                            const subVal = child.value.includes('/') ? child.value.split('/')[1] : child.value;
                            return item.region.includes(subVal);
                        });
                    }
                    return false;
                });
                if (!isMatched) return false;
            }

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
            <div className="sticky top-[70px] z-40 bg-white border-b border-border shadow-sm">
                <div className="container py-3">
                    {/* 1. Top Row: Tabs (Left) & Search (Right) */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-3">
                        {/* Main Tabs */}
                        <div className="flex bg-gray-100 p-1 rounded-xl w-full lg:w-auto overflow-x-auto scrollbar-hide">
                            {[
                                { label: '전체보기', value: 'ALL' },
                                { label: '방문형', value: 'VISIT' },
                                { label: '배송형', value: 'DELIVERY' },
                                { label: '서비스/기타', value: 'PURCHASE' },
                            ].map(tab => (
                                <button
                                    key={tab.value}
                                    onClick={() => handleTabChange(tab.value as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-1 lg:flex-none lg:min-w-[90px] ${activeTab === tab.value
                                        ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full lg:w-[350px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="캠페인, 지역, 제공내역 검색..."
                                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 2. Bottom Row: Filter Toggle, Chips & Sort */}
                    <div className="flex items-center justify-between gap-4 border-t border-gray-50 pt-3">
                        <div className="flex items-center gap-2 flex-1 overflow-hidden">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                                    isFilterOpen ? 'bg-primary text-white shadow-sm' : 'bg-rose-50 text-primary border border-rose-100 hover:bg-rose-100'
                                }`}
                            >
                                <Filter className="w-4 h-4" />
                                상세 필터
                                {activeFilterCount > 0 && (
                                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${isFilterOpen ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                                        {activeFilterCount}
                                    </span>
                                )}
                                {isFilterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {/* Filter Chips - Hidden on small mobile, scrollable on larger */}
                            <div className="hidden md:flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
                                {selectedPlatforms.map(item => (
                                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-[11px] font-medium whitespace-nowrap">
                                        {item}
                                        <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter(item, selectedPlatforms, setSelectedPlatforms)} />
                                    </span>
                                ))}
                                {selectedCategories.map(item => (
                                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded text-[11px] font-medium whitespace-nowrap">
                                        {item}
                                        <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter(item, selectedCategories, setSelectedCategories)} />
                                    </span>
                                ))}
                                {selectedRegions.map(item => (
                                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-[11px] font-medium whitespace-nowrap">
                                        {item}
                                        <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter(item, selectedRegions, setSelectedRegions)} />
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={resetFilters}
                                    className="text-[11px] text-gray-400 underline hover:text-red-500 whitespace-nowrap"
                                >
                                    초기화
                                </button>
                            )}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="pl-2 pr-8 py-1.5 border border-border rounded-lg text-xs font-bold bg-white focus:outline-none focus:border-primary cursor-pointer h-[34px]"
                            >
                                <option value="new">최신순</option>
                                <option value="popular">인기순</option>
                                <option value="deadline">마감임박</option>
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

                                {/* 방문형/전체: AREA 필터 (이중 드롭다운 방식) */}
                                {showRegionFilter && (
                                    <div className="md:col-span-1">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Area (지역 선택)</div>
                                        <div className="flex gap-2">
                                            {/* 1차 지역 선택 (시/도) */}
                                            <select
                                                value={activeRegionTab}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setActiveRegionTab(val);
                                                    // 1차 지역 선택 시 바로 필터에 추가하고 싶어하시므로 반영
                                                    // 단, 중복 방지 및 깔끔한 관리를 위해 '서울' 같은 대분류로 추가
                                                    if (val && !selectedRegions.includes(val)) {
                                                        // 기존에 선택된 상위 지역이 있다면 교체하거나 추가 (여기서는 추가)
                                                        setSelectedRegions(prev => [...prev.filter(r => r !== val), val]);
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                            >
                                                <option value="">지역 선택 (시/도)</option>
                                                {REGION_HIERARCHY.map(r => (
                                                    <option key={r.value} value={r.value}>{r.name}</option>
                                                ))}
                                            </select>

                                            {/* 2차 지역 선택 (구/군) */}
                                            <select
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val) {
                                                        // 대분류가 선택되어 있으면 대분류 필터는 지우고 상세 필터로 대체하거나 유지
                                                        // 사용성상 상세를 고르면 상세가 우선되도록 처리
                                                        handleSubRegionClick(val);
                                                        e.target.value = ''; 
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={!activeRegionTab || !REGION_HIERARCHY.find(r => r.value === activeRegionTab)?.children}
                                            >
                                                <option value="">상세 지역 (선택사항)</option>
                                                {activeRegionTab && (
                                                    <option value={activeRegionTab}>
                                                        {activeRegionTab} 전체
                                                    </option>
                                                )}
                                                {REGION_HIERARCHY.find(r => r.value === activeRegionTab)?.children?.map(sub => (
                                                    <option 
                                                        key={sub.value} 
                                                        value={sub.value}
                                                        disabled={selectedRegions.includes(sub.value)}
                                                    >
                                                        {sub.name} {selectedRegions.includes(sub.value) ? '(선택됨)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mt-2 text-[10px] text-gray-400">
                                            * 지역을 선택하면 아래에 필터가 추가됩니다.
                                        </div>
                                    </div>
                                )}


                            </div>

                            {/* Area - Blue (MapPin 아이콘) */}
                            {selectedRegions.map((item, idx) => (
                                <span
                                    key={`${item}-${idx}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                                >
                                    <MapPin className="w-3 h-3" />
                                    {item.includes('/') ? item.split('/').join(' ') : item}
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
            </div>

            {/* Main Grid Content */}
            <div className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                        검색 결과 <span className="text-primary">{filteredData.length}</span>
                    </h2>
                    <button 
                        onClick={manualRefresh}
                        className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
                    >
                        <Search className="w-3 h-3" /> 데이터 새로고침
                    </button>
                </div>

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
                        {/* 빈 자리를 Coming Soon 카드로 채워줌 (최소 10개 유지) */}
                        {[...Array(Math.max(0, 10 - filteredData.length))].map((_, i) => (
                            <PlaceholderCard key={`filler-${i}`} />
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
