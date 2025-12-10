'use client';

import { useState, useMemo } from 'react';
import CampaignCard from '@/components/CampaignCard';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

// Extended Dummy Data
const ALL_CAMPAIGNS = [
    // --- 방문형 (VISIT) ---
    { id: 101, title: "강남 프리미엄 오마카세 2인 식사권", platform: "BLOG", type: "VISIT", applicants: 15, total: 20, dday: "D-3", category: "맛집", region: "서울" },
    { id: 102, title: "성수 힙한 감성 카페 디저트 세트", platform: "REELS", type: "VISIT", applicants: 22, total: 5, dday: "D-5", category: "맛집", region: "서울" },
    { id: 103, title: "해운대 오션뷰 호텔 1박 숙박권", platform: "BLOG", type: "VISIT", applicants: 120, total: 2, dday: "D-1", category: "여행", region: "경상" },
    { id: 104, title: "홍대 줄서는 라멘집 식사권", platform: "SHORTS", type: "VISIT", applicants: 50, total: 10, dday: "D-2", category: "맛집", region: "서울" },
    { id: 105, title: "청담동 고급 헤어살롱 염색/펌", platform: "INSTAGRAM", type: "VISIT", applicants: 30, total: 5, dday: "D-4", category: "뷰티", region: "서울" },
    { id: 106, title: "제주도 감성 독채 펜션 2박", platform: "BLOG", type: "VISIT", applicants: 200, total: 1, dday: "D-7", category: "여행", region: "제주" },
    { id: 107, title: "대전 유명 베이커리 빵지순례", platform: "YOUTUBE", type: "VISIT", applicants: 10, total: 5, dday: "D-6", category: "맛집", region: "충청" },
    { id: 108, title: "부산 광안리 요트 투어 체험", platform: "TIKTOK", type: "VISIT", applicants: 45, total: 10, dday: "D-3", category: "여행", region: "경상" },
    { id: 109, title: "이천 도자기 공방 원데이 클래스", platform: "BLOG", type: "VISIT", applicants: 8, total: 4, dday: "D-10", category: "기타", region: "경기/이천" },
    { id: 110, title: "강원도 서핑 강습 & 게스트하우스", platform: "REELS", type: "VISIT", applicants: 60, total: 8, dday: "D-5", category: "여행", region: "강원" },

    // --- 배송형 (DELIVERY) ---
    { id: 201, title: "촉촉한 수분 광채 세럼 리뷰", platform: "INSTAGRAM", type: "DELIVERY", applicants: 45, total: 50, dday: "D-1", category: "뷰티", region: "배송" },
    { id: 202, title: "가정용 미니 제습기 체험단", platform: "YOUTUBE", type: "DELIVERY", applicants: 8, total: 3, dday: "D-7", category: "생활", region: "배송" },
    { id: 203, title: "데일리 비타민 C 1개월분", platform: "INSTAGRAM", type: "DELIVERY", applicants: 30, total: 30, dday: "D-4", category: "푸드", region: "배송" },
    { id: 204, title: "다이어트 곤약 젤리 1box", platform: "BLOG", type: "DELIVERY", applicants: 89, total: 50, dday: "D-4", category: "푸드", region: "배송" },
    { id: 205, title: "무선 노이즈캔슬링 헤드폰", platform: "YOUTUBE", type: "DELIVERY", applicants: 120, total: 5, dday: "D-3", category: "IT", region: "배송" },
    { id: 206, title: "친환경 대나무 칫솔 세트", platform: "BLOG", type: "DELIVERY", applicants: 15, total: 20, dday: "D-8", category: "생활", region: "배송" },
    { id: 207, title: "프리미엄 밀키트 (스테이크)", platform: "INSTAGRAM", type: "DELIVERY", applicants: 55, total: 15, dday: "D-2", category: "푸드", region: "배송" },
    { id: 208, title: "게이밍 기계식 키보드", platform: "BLOG", type: "DELIVERY", applicants: 200, total: 3, dday: "D-5", category: "IT", region: "배송" },
    { id: 209, title: "유기농 아기 간식 세트", platform: "BLOG", type: "DELIVERY", applicants: 40, total: 20, dday: "D-6", category: "유아동", region: "배송" },
    { id: 210, title: "반려견 수제 간식 패키지", platform: "REELS", type: "DELIVERY", applicants: 35, total: 10, dday: "D-4", category: "반려동물", region: "배송" },

    // --- 구매형/기자단 (PURCHASE/REPORTERS) ---
    { id: 301, title: "스마트스토어 찜하기 & 구매평", platform: "BLOG", type: "PURCHASE", applicants: 10, total: 100, dday: "D-15", category: "생활", region: "배송" },
    { id: 302, title: "쿠팡 로켓배송 생필품 구매평", platform: "BLOG", type: "PURCHASE", applicants: 50, total: 50, dday: "D-2", category: "생활", region: "배송" },
    { id: 303, title: "신상 디저트 내돈내산 영수증 리뷰", platform: "INSTAGRAM", type: "PURCHASE", applicants: 20, total: 20, dday: "D-5", category: "맛집", region: "서울" },
];

// Define static options
const REGIONS = ["서울", "경기/이천", "인천", "강원", "충청", "전라", "경상", "제주", "배송"];
const PLATFORMS = ["BLOG", "INSTAGRAM", "YOUTUBE", "REELS", "TIKTOK"];

export default function CampaignsPage() {
    const [activeTab, setActiveTab] = useState<'ALL' | 'VISIT' | 'DELIVERY' | 'PURCHASE'>('ALL');
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
        return ALL_CAMPAIGNS.filter(item => {
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
    }, [activeTab, selectedCategories, selectedPlatforms, selectedRegions, sortBy, showRegionFilter]);

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

                {filteredData.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredData.map(item => (
                            <CampaignCard
                                key={item.id}
                                {...item}
                                imageUrl=""
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
