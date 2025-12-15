'use client';

import { useState, useMemo, useEffect } from 'react';
import CampaignCard from '@/components/CampaignCard';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { mapCampaignToCard } from '@/lib/campaignUtils';

// Extended Dummy Data
// Dummy Data removed
const ALL_CAMPAIGNS: any[] = [];

// Define static options
const REGIONS = ["서울", "경기/이천", "인천", "강원", "충청", "전라", "경상", "제주", "배송"];
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
            const { data } = await supabase.from('campaigns').select('*, applications(count)').order('created_at', { ascending: false });
            if (data) {
                setAllCampaigns(data.map(c => mapCampaignToCard(c as any)));
            }
            setLoading(false);
        };
        fetchCampaigns();
    }, []);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('new');
    const [isFilterOpen, setIsFilterOpen] = useState(true);

    // Dynamic Options derived from activeTab
    const currentCategories = useMemo(() => {
        if (activeTab === 'VISIT') return ["맛집", "뷰티(샵)", "여행/숙박", "문화/전시", "기타"];
        if (activeTab === 'DELIVERY') return ["뷰티(제품)", "패션", "생활", "푸드", "IT/가전", "유아동", "반려동물"];
        // ALL or PURCHASE defaults
        return ["맛집", "뷰티", "여행", "생활", "푸드", "IT/가전", "패션", "유아동", "기타"];
    }, [activeTab]);

    const showRegionFilter = activeTab === 'VISIT' || activeTab === 'ALL';

    // Helpers
    const handleTabChange = (newTab: 'ALL' | 'VISIT' | 'DELIVERY' | 'PURCHASE') => {
        setActiveTab(newTab);
        resetFilters();
    };

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
    };

    const filteredData = useMemo(() => {
        return allCampaigns.filter(item => {
            if (activeTab !== 'ALL' && item.type !== activeTab) return false;
            if (selectedCategories.length > 0 && item.category) {
                const itemCat = item.category;
                const matched = selectedCategories.some(selected => selected.includes(itemCat));
                if (!matched) return false;
            }
            if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(item.platform)) return false;
            if (showRegionFilter && selectedRegions.length > 0 && item.region && !selectedRegions.includes(item.region)) return false;
            return true;
        }).sort((a, b) => {
            if (sortBy === 'deadline') return a.dday.localeCompare(b.dday);
            if (sortBy === 'popular') return b.applicants - a.applicants;
            return b.id - a.id;
        });
    }, [activeTab, selectedCategories, selectedPlatforms, selectedRegions, sortBy, showRegionFilter, allCampaigns]);

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
                                { label: '기자단/구매평', value: 'PURCHASE' },
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

                    {/* 3. Dropdown Filters */}
                    {isFilterOpen && (
                        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                            {/* Categories */}
                            <div className="flex flex-wrap gap-2 items-center border-b border-gray-100 pb-4">
                                <span className="text-xs font-bold text-gray-400 w-16 uppercase tracking-wider">Category</span>
                                {currentCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => toggleFilter(cat, selectedCategories, setSelectedCategories)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedCategories.includes(cat)
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Platform & Region Row */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex flex-wrap gap-2 items-center flex-1">
                                    <span className="text-xs font-bold text-gray-400 w-16 uppercase tracking-wider">Channel</span>
                                    {PLATFORMS.map(plt => (
                                        <button
                                            key={plt}
                                            onClick={() => toggleFilter(plt, selectedPlatforms, setSelectedPlatforms)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedPlatforms.includes(plt)
                                                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {plt}
                                        </button>
                                    ))}
                                </div>

                                {showRegionFilter && (
                                    <div className="flex flex-wrap gap-2 items-center flex-1 border-l border-gray-100 md:pl-4">
                                        <span className="text-xs font-bold text-gray-400 w-10 uppercase tracking-wider">Area</span>
                                        {REGIONS.map(reg => (
                                            <button
                                                key={reg}
                                                onClick={() => toggleFilter(reg, selectedRegions, setSelectedRegions)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedRegions.includes(reg)
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {reg}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
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
