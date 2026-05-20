'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { ChevronRight, Plus, X, Users, Calendar as CalendarIcon, Save, GripVertical, Building2, Infinity, Info, Megaphone, ChevronDown } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import BrandSelect from './BrandSelect';
import { useAuthStore } from '@/store/authStore';
import { CampaignActionButtons } from './CampaignActionButtons';
import { useCampaignStore } from '@/store/campaignStore';
import { useSubscription } from '@/hooks/useSubscription';
import NaverMap from './NaverMap';
import { cn } from "@/lib/utils";
import { resolveCampaignPlatformState } from '@/lib/campaignUtils';
import {
    buildCampaignSchedule,
    CampaignScheduleType,
    formatKstDate,
    parseDateString,
} from '@/lib/campaignSchedule';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Step1Data {
    campaignType: 'DELIVERY' | 'VISIT' | 'PRESS' | null;
    // 배송체험단용: 구매평, 네이버, 인스타 토글
    includeReview: boolean;
    includeNaver: boolean;
    includeInstagram: boolean;
    // 배송체험단 제품 정보
    productUrl: string;
    productUrlPrivate: boolean; // 링크 비공개 설정
    productUrlIndividual: boolean; // 선정시 구매링크 개별전달
    purchaseLinkPools: PurchaseLinkPool[];
    productName: string;
    campaignTitle: string; // 캠페인 제목 동기화용 추가
    brandName: string;     // 브랜드명 (레거시 및 표시용)
    brandId: string | null; // 선택된 브랜드 ID
    productOptions: ProductOption[];
    productPrice: string;
    shippingCost: string;
    isCouponRequired: boolean; // 쿠폰 사용 필수 여부
    // 방문/기자단용: 플랫폼 선택
    platform: 'BLOG' | 'INSTAGRAM' | 'PURCHASE' | null;
    category?: string;  // 카테고리 (선택)
    region?: string;    // 지역 (방문형용, 선택)
    subRegion?: string; // 세부 지역 (방문형용, 선택)
    stores: Store[];
    contactPhone: string;
    advertiserWillContact: boolean; // 광고주가 직접 연락 (연락처 입력 불필요)
    visitTime: string;
    visitTimeNegotiable: boolean; // 방문 시간 조율 필요 (체크 시 visitTime 선택사항)
    visitDays: string[];
    visitNotes: string;
    experienceDetails: string;
    officialPrice: string;
    totalRecruitment: string;

    scheduleType: CampaignScheduleType;
    recruitmentStartDate: string;
    firstSelectionDate: string;
    reviewDeadline: string;
    reviewDeadlineDays: string; // 배송체험단용: 제품 배송 완료 후 며칠 이내
    optionConfig: {
        mode: 'SINGLE' | 'RANKED' | 'MULTI';
        maxSelect: number;
    };
}

interface ProductOption {
    id: string;
    optionName: string;
    optionPrice: string;
    recruitmentCount: string;
}

interface PurchaseLinkPool {
    optionLabel: string;
    links: string[];
}

interface Store {
    id: string;
    naverPlaceUrl: string;
    storeName: string;
    address: string;
    lat?: number;
    lng?: number;
}

interface CampaignStep1Props {
    onNext: (data?: Step1Data) => void;
    onSaveDraft?: () => void;
    submitTrigger?: number;
}

// Sortable Option Row Component
interface SortableOptionRowProps {
    option: ProductOption;
    index: number;
    campaignType: 'DELIVERY' | 'VISIT' | 'PRESS' | null;
    onUpdate: (id: string, field: keyof ProductOption, value: string) => void;
    onRemove: (id: string) => void;
}

function SortableOptionRow({ option, index, campaignType, onUpdate, onRemove }: SortableOptionRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: option.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors ${isDragging ? 'shadow-lg z-10' : ''}`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
                <GripVertical size={18} />
            </div>

            {/* Option Number */}
            <div className="w-8 text-center text-xs font-bold text-gray-500 flex-shrink-0">
                {index + 1}
            </div>

            {/* Option Name */}
            <div className="flex-1 min-w-0">
                <input
                    type="text"
                    value={option.optionName}
                    onChange={(e) => onUpdate(option.id, 'optionName', e.target.value)}
                    placeholder={campaignType === 'DELIVERY' ? "예: 아이폰 14 Pro 블루 / 256GB" : "예: 기본 서비스 A"}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Recruitment Count */}
            <div className="w-24 flex-shrink-0">
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        value={option.recruitmentCount}
                        onChange={(e) => onUpdate(option.id, 'recruitmentCount', e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-500">명</span>
                </div>
            </div>

            {/* Delete Button */}
            <button
                onClick={() => onRemove(option.id)}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="옵션 삭제"
            >
                <X size={16} />
            </button>
        </div>
    );
}

const DAYS_OF_WEEK = ['월', '화', '수', '목', '금', '토', '일'];
const CALENDAR_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface CalendarCell {
    date: string;
    dayNumber: number;
    isCurrentMonth: boolean;
}

interface CalendarWeek {
    key: string;
    cells: CalendarCell[];
}

interface CalendarSegment {
    startCol: number;
    endCol: number;
    label: string;
    tone: 'application' | 'selection' | 'experience';
}

function formatUtcDate(date: Date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function buildCalendarWeeks(startDate: string, endDate: string): CalendarWeek[] {
    const startRangeDate = parseDateString(startDate);
    const endRangeDate = parseDateString(endDate);
    const calendarStart = new Date(startRangeDate);
    calendarStart.setUTCDate(calendarStart.getUTCDate() - calendarStart.getUTCDay());
    const calendarEnd = new Date(endRangeDate);
    calendarEnd.setUTCDate(calendarEnd.getUTCDate() + (6 - calendarEnd.getUTCDay()));

    const weeks: CalendarWeek[] = [];
    let cursor = new Date(calendarStart);

    while (cursor <= calendarEnd) {
        const cells: CalendarCell[] = [];
        for (let index = 0; index < 7; index += 1) {
            cells.push({
                date: formatUtcDate(cursor),
                dayNumber: cursor.getUTCDate(),
                isCurrentMonth:
                    cursor.getUTCMonth() === startRangeDate.getUTCMonth()
                    || cursor.getUTCMonth() === endRangeDate.getUTCMonth(),
            });
            cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1));
        }

        weeks.push({
            key: cells[0].date,
            cells,
        });
    }

    return weeks;
}

function buildRangeSegment(week: CalendarWeek, start: string, end: string, tone: 'application' | 'experience', label: string): CalendarSegment | null {
    const matchingIndexes = week.cells
        .map((cell, index) => ({ cell, index }))
        .filter(({ cell }) => cell.date >= start && cell.date <= end)
        .map(({ index }) => index);

    if (matchingIndexes.length === 0) {
        return null;
    }

    return {
        startCol: matchingIndexes[0] + 1,
        endCol: matchingIndexes[matchingIndexes.length - 1] + 1,
        label,
        tone,
    };
}

function buildToneRangeSegment(
    week: CalendarWeek,
    start: string,
    end: string,
    tone: 'application' | 'selection' | 'experience',
    label: string
): CalendarSegment | null {
    const matchingIndexes = week.cells
        .map((cell, index) => ({ cell, index }))
        .filter(({ cell }) => cell.date >= start && cell.date <= end)
        .map(({ index }) => index);

    if (matchingIndexes.length === 0) {
        return null;
    }

    return {
        startCol: matchingIndexes[0] + 1,
        endCol: matchingIndexes[matchingIndexes.length - 1] + 1,
        label,
        tone,
    };
}

function buildSelectionSegment(week: CalendarWeek, targetDate: string): CalendarSegment | null {
    const index = week.cells.findIndex((cell) => cell.date === targetDate);
    if (index === -1) {
        return null;
    }

    return {
        startCol: index + 1,
        endCol: index + 1,
        label: '발표',
        tone: 'selection',
    };
}

function buildScheduleMonthTitle(startDate: string, endDate: string) {
    const start = parseDateString(startDate);
    const end = parseDateString(endDate);
    const startYear = start.getUTCFullYear();
    const endYear = end.getUTCFullYear();
    const startMonth = start.getUTCMonth() + 1;
    const endMonth = end.getUTCMonth() + 1;

    if (startYear === endYear && startMonth === endMonth) {
        return `${startYear}년 ${startMonth}월`;
    }

    if (startYear === endYear) {
        return `${startYear}년 ${startMonth}월 ~ ${endMonth}월`;
    }

    return `${startYear}년 ${startMonth}월 ~ ${endYear}년 ${endMonth}월`;
}

export default function CampaignStep1({ onNext, onSaveDraft, submitTrigger = 0 }: CampaignStep1Props) {
    // Zustand 스토어 사용
    const campaignStore = useCampaignStore();
    const formData = campaignStore; // 스토어 자체가 데이터를 포함하고 있음

    // 무제한 이용권 구독 상태
    const { isUnlimited } = useSubscription();

    // HUD 연동 트리거 감시
    const lastTrigger = useRef(submitTrigger);
    useEffect(() => {
        if (submitTrigger > 0 && submitTrigger !== lastTrigger.current) {
            lastTrigger.current = submitTrigger;
            handleNext();
        }
    }, [submitTrigger]);

    useEffect(() => {
        const baseDate = formData.recruitmentStartDate || formatKstDate();
        const nextSchedule = buildCampaignSchedule(formData.scheduleType, baseDate);

        if (
            formData.scheduleType !== nextSchedule.scheduleType ||
            formData.recruitmentStartDate !== nextSchedule.recruitmentStartDate ||
            formData.firstSelectionDate !== nextSchedule.firstSelectionDate ||
            formData.reviewDeadline !== nextSchedule.reviewDeadline
        ) {
            campaignStore.updateFields({
                scheduleType: nextSchedule.scheduleType,
                recruitmentStartDate: nextSchedule.recruitmentStartDate,
                firstSelectionDate: nextSchedule.firstSelectionDate,
                reviewDeadline: nextSchedule.reviewDeadline,
            });
        }
    }, [campaignStore, formData.firstSelectionDate, formData.recruitmentStartDate, formData.reviewDeadline, formData.scheduleType]);

    const { user, profile } = useAuthStore();
    const isAdmin = profile?.role === 'ADMIN';

    // 필드 업데이트 헬퍼
    const updateField = (field: string, value: any) => {
        campaignStore.setField(field as any, value);
    };

    const updateFields = (fields: Partial<Step1Data>) => {
        campaignStore.updateFields(fields as any);
    };

    const [showAddressModal, setShowAddressModal] = useState(false);
    const [currentStoreIndex, setCurrentStoreIndex] = useState<number | null>(null);
    const [tempNaverUrl, setTempNaverUrl] = useState('');
    const [showCouponTooltip, setShowCouponTooltip] = useState(false);

    // 모집 인원 조정
    const adjustRecruitmentCount = (amount: number) => {
        const currentCount = parseInt(formData.totalRecruitment) || 0;
        const newCount = Math.max(0, currentCount + amount);
        campaignStore.setField('totalRecruitment', newCount.toString());
    };

    // 실시간 유효성 검사 상태
    const [fieldValidation, setFieldValidation] = useState<Record<string, boolean>>({});

    // 매장 추가
    const addStore = () => {
        const newStore: Store = {
            id: Date.now().toString(),
            naverPlaceUrl: '',
            storeName: '',
            address: '',
        };
        campaignStore.setField('stores', [...formData.stores, newStore]);
    };

    // 매장 삭제
    const removeStore = (id: string) => {
        campaignStore.setField('stores', formData.stores.filter(store => store.id !== id));
    };

    // 대한민국 지역 데이터 (시/도 및 세부 시/군/구)
    const REGION_DATA: Record<string, string[]> = {
        '서울': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
        '경기': ['수원시', '용인시', '성남시', '부천시', '화성시', '안산시', '안양시', '평택시', '시흥시', '김포시', '광주시', '광명시', '군포시', '하남시', '오산시', '이천시', '안성시', '의왕시', '양평군', '여주시', '과천시', '고양시', '남양주시', '파주시', '의정부시', '양주시', '구리시', '포천시', '동두천시', '가평군', '연천군'],
        '인천': ['계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '중구', '강화군', '옹진군'],
        '대전': ['대덕구', '동구', '서구', '유성구', '중구'],
        '대구': ['남구', '달서구', '동구', '북구', '서구', '수성구', '중구', '달성군', '군위군'],
        '부산': ['강서구', '금정구', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구', '기장군'],
        '울산': ['남구', '동구', '북구', '중구', '울주군'],
        '광주': ['광산구', '남구', '동구', '북구', '서구'],
        '세종': ['세종시'],
        '강원': ['강릉시', '동해시', '삼척시', '속초시', '원주시', '춘천시', '태백시', '고성군', '양구군', '양양군', '영월군', '인제군', '정선군', '철원군', '평창군', '홍천군', '화천군', '횡성군'],
        '경북': ['경산시', '경주시', '구미시', '김천시', '문경시', '상주시', '안동시', '영주시', '영천시', '포항시', '고령군', '봉화군', '성주군', '영덕군', '영양군', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군'],
        '경남': ['거제시', '김해시', '밀양시', '사천시', '양산시', '진주시', '창원시', '통영시', '거창군', '고성군', '남해군', '남해군', '산청군', '의령군', '창녕군', '하동군', '함안군', '함양군', '합천군'],
        '충북': ['제천시', '청주시', '충주시', '괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '증평군', '진천군'],
        '충남': ['계룡시', '공주시', '논산시', '당진시', '보령시', '서산시', '아산시', '천안시', '금산군', '부여군', '서천군', '예산군', '청양군', '태안군', '홍성군'],
        '전북': ['군산시', '김제시', '남원시', '익산시', '전주시', '정읍시', '고창군', '무주군', '부안군', '순창군', '완주군', '임실군', '장수군', '진안군'],
        '전남': ['광양시', '나주시', '목포시', '순천시', '여수시', '강진군', '고흥군', '곡성군', '구례군', '담양군', '무안군', '보성군', '신안군', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
        '제주': ['제주시', '서귀포시']
    };

    // 주소에서 지역(시/도 및 세부 지역) 추출 유틸리티
    const extractRegionFromAddress = (address: string) => {
        if (!address) return { region: '', subRegion: '' };

        const regionMap: Record<string, string> = {
            '서울': '서울', '경기': '경기', '인천': '인천', '부산': '부산', '대구': '대구',
            '광주': '광주', '대전': '대전', '울산': '울산', '세종': '세종', '강원': '강원',
            '충북': '충북', '충청북도': '충북', '충남': '충남', '충청남도': '충남',
            '전북': '전북', '전라북도': '전북', '전남': '전남', '전라남도': '전남',
            '경북': '경북', '경상북도': '경북', '경남': '경남', '경상남도': '경남',
            '제주': '제주'
        };

        const parts = address.split(' ');
        const firstWord = parts[0];
        const secondWord = parts[1] || '';

        let detectedRegion = '';
        let detectedSubRegion = '';

        // 시/도 추출
        for (const [key, value] of Object.entries(regionMap)) {
            if (firstWord.includes(key)) {
                detectedRegion = value;
                break;
            }
        }

        // 세부 지역 추출
        if (detectedRegion && REGION_DATA[detectedRegion]) {
            const subRegions = REGION_DATA[detectedRegion];
            // 1. "안동시" 처럼 정확한 단어 매칭 시도
            const match = subRegions.find(sub => secondWord.includes(sub.replace(/시$|구$|군$/, '')));
            if (match) {
                detectedSubRegion = match;
            }
        }

        return { region: detectedRegion, subRegion: detectedSubRegion };
    };

    // 네이버 플레이스 정보 가져오기 (API 연동 구현)
    const fetchNaverPlaceInfo = async (url: string, storeId: string) => {
        if (!url) return;
        const loadingToast = toast.loading('네이버 플레이스 정보를 불러오는 중...');

        try {
            const response = await fetch('/api/naver-place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!response.ok) throw new Error('정보를 불러오는데 실패했습니다.');

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            if (!data.title && !data.address) {
                throw new Error('매장 정보를 찾을 수 없습니다. URL을 확인해 주세요.');
            }

            const storeData = {
                storeName: data.title || '이름 없는 매장',
                address: data.address || '주소 정보 없음',
                lat: data.lat || null,
                lng: data.lng || null,
            };

            const { region, subRegion } = extractRegionFromAddress(storeData.address);

            const latestStores = useCampaignStore.getState().stores;

            campaignStore.updateFields({
                region: (region && region !== '기타') ? region : formData.region,
                subRegion: (subRegion && subRegion !== '전체') ? subRegion : formData.subRegion,
                stores: latestStores.map(store =>
                    store.id === storeId
                        ? { ...store, naverPlaceUrl: url, ...storeData }
                        : store
                ),
            });

            if (region) {
                const regionText = subRegion ? `${region} ${subRegion}` : region;
                toast.success(`'${storeData.storeName}' 정보를 불러왔으며, 지역이 '${regionText}'(으)로 자동 설정되었습니다.`, { id: loadingToast });
            } else {
                toast.success(`'${storeData.storeName}' 정보를 성공적으로 불러왔습니다.`, { id: loadingToast });
            }
        } catch (error: any) {
            console.error('Fetch Naver Place Error:', error);

            // 실패 시 생성했던 빈 매장 항목 제거
            const currentStores = useCampaignStore.getState().stores;
            campaignStore.setField('stores', currentStores.filter(s => s.id !== storeId));

            toast.error(error.message || '정보를 불러오는데 실패했습니다.', { id: loadingToast });
        }
    };

    // 드래그 앤 드롭 센서 설정
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 옵션 순서 변경 핸들러
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = formData.productOptions.findIndex(opt => opt.id === active.id);
            const newIndex = formData.productOptions.findIndex(opt => opt.id === over.id);
            updateField('productOptions', arrayMove(formData.productOptions, oldIndex, newIndex));
        }
    };

    // 제품 옵션 추가
    const addProductOption = () => {
        const newOption: ProductOption = {
            id: Date.now().toString(),
            optionName: '',
            optionPrice: '0',
            recruitmentCount: '0',
        };
        updateField('productOptions', [...formData.productOptions, newOption]);
    };

    // 제품 옵션 삭제
    const removeProductOption = (id: string) => {
        updateField('productOptions', formData.productOptions.filter(opt => opt.id !== id));
    };

    // 제품 옵션 업데이트
    const updateProductOption = (id: string, field: keyof ProductOption, value: string) => {
        let finalValue = value;
        if (field === 'optionPrice') {
            finalValue = formatPrice(value);
        }

        updateField('productOptions', formData.productOptions.map(opt =>
            opt.id === id ? { ...opt, [field]: finalValue } : opt
        ));
    };

    const resolveLinkPoolOptionLabels = () => {
        const optionNames = formData.productOptions
            .map((option) => option.optionName?.trim())
            .filter(Boolean) as string[];

        if (optionNames.length > 0) {
            return Array.from(new Set(optionNames));
        }

        if (formData.productName?.trim()) {
            return [formData.productName.trim()];
        }

        return ['기본 옵션'];
    };

    const getPoolLinksText = (optionLabel: string) => {
        const pool = (formData.purchaseLinkPools || []).find(
            (item) => item.optionLabel.trim().toUpperCase() === optionLabel.trim().toUpperCase()
        );
        return (pool?.links || []).join('\n');
    };

    const updatePurchaseLinkPool = (optionLabel: string, inputValue: string) => {
        const links = inputValue
            .split(/\r?\n|,/)
            .map((value) => value.trim())
            .filter((value) => /^https?:\/\//i.test(value));

        const normalizedLabel = optionLabel.trim();
        const existing = (formData.purchaseLinkPools || []).filter(
            (item) => item.optionLabel.trim().toUpperCase() !== normalizedLabel.toUpperCase()
        );

        if (links.length === 0) {
            updateField('purchaseLinkPools', existing);
            return;
        }

        updateField('purchaseLinkPools', [
            ...existing,
            {
                optionLabel: normalizedLabel,
                links: Array.from(new Set(links)),
            },
        ]);
    };

    // 요일 토글
    const toggleDay = (day: string) => {
        updateField('visitDays', formData.visitDays.includes(day)
            ? formData.visitDays.filter(d => d !== day)
            : [...formData.visitDays, day]);
    };

    // 요일 빠른 선택
    const setWeekdaysOnly = () => {
        updateField('visitDays', ['월', '화', '수', '목', '금']);
    };

    const setNoWeekends = () => {
        updateField('visitDays', ['월', '화', '수', '목', '금']);
    };

    const setAllDays = () => {
        updateField('visitDays', ['월', '화', '수', '목', '금', '토', '일']);
    };

    // 입력 도우미: 전화번호 자동 포맷팅
    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/[^0-9]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        if (numbers.length <= 11) return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    // 입력 도우미: 가격 콤마 추가
    const formatPrice = (value: string) => {
        const numbers = value.replace(/[^0-9]/g, '');
        return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // 입력 도우미: URL https:// 자동 추가
    const formatUrl = (value: string) => {
        if (!value) return '';
        if (value.startsWith('http://') || value.startsWith('https://')) {
            return value;
        }
        return `https://${value}`;
    };

    // 전화번호 변경 핸들러
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        updateField('contactPhone', formatted);
    };

    // 가격 변경 핸들러
    const handlePriceChange = (field: 'productPrice' | 'shippingCost' | 'officialPrice', value: string) => {
        const formatted = formatPrice(value);
        updateField(field, formatted);
    };

    // 플랫폼 토글 (타입별 분기: 방문/기자단=단일선택, 배송체험단=다중선택)
    const toggleDeliveryPlatform = (plat: 'review' | 'naver' | 'instagram') => {
        const { campaignType } = formData;

        // ✅ 방문체험단 / 기자단: 라디오 버튼 방식 (단일 선택)
        if (campaignType === 'VISIT' || campaignType === 'PRESS') {
            if (plat === 'naver') {
                updateFields({
                    includeNaver: true,
                    includeInstagram: false,
                    includeReview: false,
                    platform: 'BLOG'
                });
            } else if (plat === 'instagram') {
                updateFields({
                    includeInstagram: true,
                    includeNaver: false,
                    includeReview: false,
                    platform: 'INSTAGRAM'
                });
            }
            return;
        }

        // ✅ 배송체험단: 구매평 토글 자유 / 네이버↔인스타 상호 배타 (동시선택 불가)
        const { includeReview, includeNaver, includeInstagram } = formData;
        let newReview = includeReview;
        let newNaver = includeNaver;
        let newInstagram = includeInstagram;

        if (plat === 'review') {
            newReview = !includeReview;
        } else if (plat === 'naver') {
            newNaver = !includeNaver;
            if (newNaver) newInstagram = false; // 네이버 선택 시 인스타 자동 해제
        } else if (plat === 'instagram') {
            newInstagram = !includeInstagram;
            if (newInstagram) newNaver = false; // 인스타 선택 시 네이버 자동 해제
        }

        const resolved = resolveCampaignPlatformState({
            type: 'DELIVERY',
            platform: formData.platform,
            step1Data: {
                includeReview: newReview,
                includeNaver: newNaver,
                includeInstagram: newInstagram,
                platform: formData.platform,
            },
        });

        updateFields({
            includeReview: resolved.includeReview,
            includeNaver: resolved.includeNaver,
            includeInstagram: resolved.includeInstagram,
            platform: resolved.resolvedPlatform === 'INSTAGRAM'
                ? 'INSTAGRAM'
                : resolved.resolvedPlatform === 'BLOG'
                    ? 'BLOG'
                    : 'PURCHASE'
        });
    };

    // 실시간 유효성 검사
    const validateField = (fieldName: string, value: any) => {
        let isValid = false;

        switch (fieldName) {
            case 'campaignType':
                isValid = value !== null;
                break;
            case 'totalRecruitment':
                isValid = value && parseInt(value) > 0;
                break;
            case 'recruitmentStartDate':
                isValid = value !== '';
                break;
            case 'contactPhone':
                // 광고주가 직접 연락하는 경우 연락처 필수 아님
                isValid = formData.advertiserWillContact || (value && value.length >= 12); // 010-1234-5678 형식
                break;
            case 'productUrl':
                // 개별전달 체크 시 링크 필수 아님
                isValid = formData.productUrlIndividual || (value && value.startsWith('http'));
                break;
            case 'productName':
                isValid = value && value.trim().length > 0;
                break;
            default:
                isValid = true;
        }

        setFieldValidation(prev => ({ ...prev, [fieldName]: isValid }));
        return isValid;
    };

    // 폼 유효성 검사
    const isFormValid = () => {
        if (!formData.brandId) return false;
        if (!formData.campaignType) return false;
        if (!formData.category) return false;

        // 배송체험단
        if (formData.campaignType === 'DELIVERY') {
            if (!formData.includeReview && !formData.includeNaver && !formData.includeInstagram) {
                return false;
            }
            if ((!formData.productUrlIndividual && !formData.productUrl) || !formData.productName) {
                return false;
            }
            // 구매평 체험단인 경우 공식 판매가와 상품 결제 금액 필수 (단, 쿠폰/옵션 기준 리워드 체크 시 예외)
            if ((formData.includeReview || formData.platform === 'PURCHASE') && !formData.isCouponRequired) {
                if (!formData.officialPrice || !formData.productPrice) {
                    return false;
                }
            }
        }

        // 방문체험단 또는 기자단
        if (formData.campaignType === 'VISIT' || formData.campaignType === 'PRESS') {
            if (!formData.platform) return false;
            if (formData.stores.length === 0) return false;
            if (!formData.advertiserWillContact && !formData.contactPhone) return false;
            if (!formData.visitTimeNegotiable && !formData.visitTime) return false;
            if (!formData.experienceDetails) return false;
        }

        if (!formData.totalRecruitment) return false;
        if (!formData.recruitmentStartDate) return false;

        return true;
    };

    const handleNext = () => {
        const scrollTo = (id: string, message: string) => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // 포커스 가능한 요소인 경우 포커스
                const input = el.querySelector('input, select, textarea, button') as HTMLElement;
                if (input) input.focus();
                else el.focus();
            }
            toast.error(message);
        };

        if (!formData.brandId) {
            return scrollTo('brand-section', '캠페인을 진행할 브랜드를 선택해주세요.');
        }

        if (!formData.campaignTitle) {
            return scrollTo('title-section', '캠페인 제목을 입력해주세요.');
        }

        if (!formData.category) {
            return scrollTo('category-section', '카테고리를 선택해주세요.');
        }

        if (!formData.campaignType) {
            return scrollTo('type-section', '진행 유형을 선택해주세요.');
        }

        const isDelivery = formData.campaignType === 'DELIVERY';
        const isVisitOrPress = formData.campaignType === 'VISIT' || formData.campaignType === 'PRESS';

        // 플랫폼 선택 확인
        if (isDelivery) {
            if (!formData.includeReview && !formData.includeNaver && !formData.includeInstagram) {
                return scrollTo('platform-section', '최소 하나의 리뷰 플랫폼을 선택해주세요.');
            }
        } else if (isVisitOrPress) {
            if (!formData.platform) {
                return scrollTo('platform-section', '플랫폼을 선택해주세요.');
            }
        }

        // 제품/매장 정보 확인
        if (isDelivery) {
            if (!formData.productUrlIndividual && !formData.productUrl) {
                return scrollTo('product-url', '상품 링크를 입력해주세요.');
            }
            if (!formData.productName) {
                return scrollTo('product-name', '상품명을 입력해주세요.');
            }
            // 구매평 체험단 유효성 검사 추가 (단, 쿠폰/옵션 기준 리워드 체크 시 예외)
            if ((formData.includeReview || formData.platform === 'PURCHASE') && !formData.isCouponRequired) {
                if (!formData.officialPrice) {
                    return scrollTo('official-price', '구매평 체험단은 리워드 지급을 위해 공식 판매가를 필수로 입력해야 합니다.');
                }
                if (!formData.productPrice) {
                    return scrollTo('product-price', '구매평 체험단은 리워드 지급을 위해 상품 결제 금액을 필수로 입력해야 합니다.');
                }
            }
        } else if (isVisitOrPress) {
            if (formData.stores.length === 0) {
                return scrollTo('store-section', '최소 1개의 매장을 추가해주세요.');
            }
            if (!formData.advertiserWillContact && !formData.contactPhone) {
                return scrollTo('contact-phone', '담당자 연락처를 입력해주세요.');
            }
            if (!formData.visitTimeNegotiable && !formData.visitTime) {
                return scrollTo('visit-time', '방문 가능 시간을 입력해주세요.');
            }
            if (!formData.experienceDetails) {
                return scrollTo('experience-details', '제공 내역을 입력해주세요.');
            }
        }

        // 공통 필수 항목
        if (!formData.totalRecruitment) {
            return scrollTo('recruitment-count', '총 모집 인원을 입력해주세요.');
        }
        if (!formData.recruitmentStartDate) {
            return scrollTo('start-date', '모집 시작일을 선택해주세요.');
        }

        if (isFormValid()) {
            onNext(formData);
        }
    };


    // Schedule type change handler
    const handleScheduleTypeChange = (type: CampaignScheduleType) => {
        const nextSchedule = buildCampaignSchedule(type, formatKstDate());
        campaignStore.updateFields({
            scheduleType: nextSchedule.scheduleType,
            recruitmentStartDate: nextSchedule.recruitmentStartDate,
            firstSelectionDate: nextSchedule.firstSelectionDate,
            reviewDeadline: nextSchedule.reviewDeadline,
        });
    };

    const handleOptionModeChange = (val: 'SINGLE' | 'RANKED' | 'MULTI') => {
        campaignStore.updateFields({
            optionConfig: {
                ...formData.optionConfig,
                mode: val,
                // If mode changes to SINGLE, reset maxSelect to 1
                maxSelect: val === 'SINGLE' ? 1 : formData.optionConfig.maxSelect
            }
        });
    };

    const todayDate = formatKstDate();
    const schedulePreview = buildCampaignSchedule(
        formData.scheduleType,
        formData.recruitmentStartDate || formatKstDate()
    );
    const isFlexibleSchedule = schedulePreview.scheduleType === 'FAST';
    const scheduleDescriptions: Record<CampaignScheduleType, string> = {
        DEFAULT: '오늘 시작, 1주 모집 후 신청 마지막날 발표하고 남은 1주 내 체험을 완료하는 기본 일정입니다.',
        FAST: '오늘 시작 후 2주 동안 노출되며, 캠페인이 종료될 때까지 자동 연장되고 신청 건별로 수시 선정 후 7일 이내 체험을 진행하는 빠른 일정입니다.',
    };
    const calendarWeeks = buildCalendarWeeks(
        schedulePreview.recruitmentStartDate,
        schedulePreview.reviewDeadline
    );
    const scheduleMonthTitle = buildScheduleMonthTitle(
        schedulePreview.recruitmentStartDate,
        schedulePreview.reviewDeadline
    );

    return (
        <div className="w-full space-y-8 pb-10">


            <section id="brand-section" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden outline-none" tabIndex={-1}>
                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Building2 size={20} className="text-rose-500" />
                        진행 브랜드 <span className="text-rose-500">*</span>
                    </h2>
                    {user ? (
                        <BrandSelect
                            userId={user.id}
                            value={formData.brandId}
                            onChange={(id, name) => campaignStore.updateFields({ brandId: id, brandName: name })}
                        />
                    ) : (
                        <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                            브랜드 정보를 불러오려면 로그인이 필요합니다.
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-start gap-3">
                    <Info size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                        이 캠페인을 진행할 브랜드를 선택하거나 새로 등록해주세요. 대행사의 경우 여러 클라이언트를 브랜드별로 나누어 관리할 수 있습니다.
                    </p>
                </div>
            </section>

            {/* 캠페인 제목 (모집글 제목) */}
            <section id="title-section" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden outline-none" tabIndex={-1}>
                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Megaphone size={20} className="text-rose-500" />
                        캠페인 제목 <span className="text-rose-500">*</span>
                    </h2>
                    <input
                        type="text"
                        value={formData.campaignTitle || ''}
                        onChange={(e) => campaignStore.setField('campaignTitle', e.target.value)}
                        placeholder="예시) [무료배송] 다온뷰 최고급 세안밴드 체험단 모집"
                        className="w-full h-12 px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-medium"
                    />
                </div>
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-start gap-3">
                    <Info size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                        인플루언서들이 모집 목록에서 보게 될 중요 제목입니다. 매력적인 제목으로 더 많은 참여를 유도해보세요.
                    </p>
                </div>
            </section>

            {/* 카테고리 선택 */}
            <section id="category-section" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4 outline-none" tabIndex={-1}>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                    카테고리 선택 <span className="text-red-500">*</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                    {['맛집', '뷰티', '숙박', '생활', '서비스', '유아동', '디지털/가전', '기타'].map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => campaignStore.setField('category', cat)}
                            className={`px-4 py-2 rounded-full border-2 transition-all font-medium ${formData.category === cat
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            {/* 진행 유형 선택 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">진행 유형 선택</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 배송체험단 */}
                    <button
                        onClick={() => campaignStore.updateFields({ campaignType: 'DELIVERY', platform: null })}
                        className={`p-6 rounded-lg border-2 transition-all ${formData.campaignType === 'DELIVERY'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        <div className="text-2xl mb-2">📦</div>
                        <h3 className="font-bold text-lg mb-1">배송체험단</h3>
                        <p className="text-sm text-gray-600">제품 배송 후 리뷰 작성</p>
                    </button>

                    {/* 방문체험단 */}
                    <button
                        onClick={() => campaignStore.updateFields({ campaignType: 'VISIT', includeReview: false, includeNaver: false, includeInstagram: false })}
                        className={`p-6 rounded-lg border-2 transition-all ${formData.campaignType === 'VISIT'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        <div className="text-2xl mb-2">🏪</div>
                        <h3 className="font-bold text-lg mb-1">방문체험단</h3>
                        <p className="text-sm text-gray-600">매장 방문 후 리뷰 작성</p>
                    </button>

                    {/* 기자단 */}
                    <button
                        onClick={() => campaignStore.updateFields({ campaignType: 'PRESS', includeReview: false, includeNaver: false, includeInstagram: false })}
                        className={`p-6 rounded-lg border-2 transition-all ${formData.campaignType === 'PRESS'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        <div className="text-2xl mb-2">✍️</div>
                        <h3 className="font-bold text-lg mb-1">기자단</h3>
                        <p className="text-sm text-gray-600">전문 리뷰 작성</p>
                    </button>
                </div>
            </section>
            {/* 배송체험단/방문체험단/기자단 - 플랫폼 선택 */}
            {formData.campaignType && (
                <section id="platform-section" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 outline-none" tabIndex={-1}>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">진행 방식 및 플랫폼 선택</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        {formData.campaignType === 'DELIVERY'
                            ? '원하는 리뷰 플랫폼을 선택하세요. 구매평 단독, 네이버/인스타 단독, 또는 구매평+SNS 조합이 가능합니다.'
                            : '리뷰를 작성할 플랫폼을 하나만 선택하세요.'
                        }
                    </p>

                    {/* ✅ 배송체험단: 다중선택 (기존 방식) */}
                    {formData.campaignType === 'DELIVERY' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 구매평 토글 */}
                            <button
                                onClick={() => toggleDeliveryPlatform('review')}
                                className={`p-4 rounded-lg border-2 transition-all ${formData.includeReview
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">구매평</h3>
                                    {formData.includeReview && (
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">쇼핑몰 구매평 작성</p>
                            </button>

                            {/* 네이버 블로그 토글 */}
                            <button
                                onClick={() => toggleDeliveryPlatform('naver')}
                                className={`p-4 rounded-lg border-2 transition-all ${formData.includeNaver
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-green-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">네이버 블로그</h3>
                                    {formData.includeNaver && (
                                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">네이버 블로그 포스팅</p>
                            </button>

                            {/* 인스타그램 토글 */}
                            <button
                                onClick={() => toggleDeliveryPlatform('instagram')}
                                className={`p-4 rounded-lg border-2 transition-all ${formData.includeInstagram
                                    ? 'border-pink-500 bg-pink-50'
                                    : 'border-gray-200 hover:border-pink-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">인스타그램</h3>
                                    {formData.includeInstagram && (
                                        <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">인스타그램 포스팅</p>
                            </button>
                        </div>
                    )}

                    {/* ✅ 방문체험단 / 기자단: 단일선택 (라디오 방식) */}
                    {(formData.campaignType === 'VISIT' || formData.campaignType === 'PRESS') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 네이버 블로그 - 라디오 */}
                            <button
                                onClick={() => toggleDeliveryPlatform('naver')}
                                className={`p-5 rounded-xl border-2 transition-all text-left ${
                                    formData.platform === 'BLOG'
                                        ? 'border-green-500 bg-green-50 shadow-sm'
                                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/30'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* 라디오 인디케이터 */}
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        formData.platform === 'BLOG'
                                            ? 'border-green-500 bg-green-500'
                                            : 'border-gray-300'
                                    }`}>
                                        {formData.platform === 'BLOG' && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">네이버 블로그</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">네이버 블로그 포스팅</p>
                                    </div>
                                </div>
                            </button>

                            {/* 인스타그램 - 라디오 */}
                            <button
                                onClick={() => toggleDeliveryPlatform('instagram')}
                                className={`p-5 rounded-xl border-2 transition-all text-left ${
                                    formData.platform === 'INSTAGRAM'
                                        ? 'border-pink-500 bg-pink-50 shadow-sm'
                                        : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/30'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* 라디오 인디케이터 */}
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        formData.platform === 'INSTAGRAM'
                                            ? 'border-pink-500 bg-pink-500'
                                            : 'border-gray-300'
                                    }`}>
                                        {formData.platform === 'INSTAGRAM' && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">인스타그램</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">인스타그램 포스팅</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* 선택된 조합 표시 */}
                    {(formData.includeReview || formData.includeNaver || formData.includeInstagram) && (
                        <div className="mt-4 space-y-3">
                            {/* 진행 방식 및 비용 - 2줄로 최적화 */}
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                {/* 라벨 행 */}
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-gray-600">선택된 진행 방식</p>
                                    <p className="text-sm text-gray-600">진행비용 (1건)</p>
                                </div>

                                {/* 내용 행 */}
                                <div className="flex items-center justify-between">
                                    {/* 플랫폼 태그 */}
                                    <div className="flex flex-wrap gap-2">
                                        {formData.includeReview && (
                                            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                📝 구매평
                                            </span>
                                        )}
                                        {formData.includeNaver && (
                                            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                📗 네이버 블로그
                                            </span>
                                        )}
                                        {formData.includeInstagram && (
                                            <span className="inline-flex items-center px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                                                📸 인스타그램
                                            </span>
                                        )}
                                    </div>

                                    {/* 진행비용 */}
                                    <div className="text-right ml-4">
                                        {isUnlimited ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <p className="text-2xl font-bold text-purple-600">0원</p>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                                    ∞ 무제한 이용권 혜택적용
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-2xl font-bold text-blue-600">
                                                {(() => {
                                                    if (formData.campaignType === 'VISIT' || formData.campaignType === 'PRESS') {
                                                        return '10,000원';
                                                    }
                                                    // 배송체험단 (DELIVERY)
                                                    if (formData.includeReview && !formData.includeNaver && !formData.includeInstagram) return '5,000원';
                                                    if (!formData.includeReview && (formData.includeNaver || formData.includeInstagram)) return '5,000원';
                                                    if (formData.includeReview && (formData.includeNaver || formData.includeInstagram)) return '9,000원';
                                                    return '0원';
                                                })()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 1석2조 안내: 배송체험단 전용 */}
                            {formData.campaignType === 'DELIVERY' && (
                                <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl flex items-start gap-3">
                                    <Info size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-bold text-indigo-950 mb-2 text-[14px]">
                                            1석2조 혜택! 구매평과 SNS를 함께 진행하세요
                                        </p>
                                        <ul className="text-[13px] text-indigo-700 space-y-1.5 font-medium">
                                            <li>• 제품비용 절약: 한 번의 제품 제공으로 2가지 리뷰 진행</li>
                                            <li>• 시간 효율: 동시 진행으로 캠페인 기간 단축</li>
                                            <li>• 다양한 노출: 쇼핑몰 + SNS 채널 동시 마케팅</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* 배송체험단 - 제품 정보 */}
            {formData.campaignType === 'DELIVERY' && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">체험 상품 · 모집 조건</h2>

                    {/* 진행할 쇼핑몰 상품 링크 */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            진행할 상품 링크(url)을 입력해 주세요 {!formData.productUrlIndividual && <span className="text-red-500">*</span>}
                            {fieldValidation.productUrl === true && (
                                <span className="ml-2 text-green-500 text-sm">✓</span>
                            )}
                            <HelpTooltip content={formData.productUrlIndividual ? "개별전달 설정 시 상품 링크 입력이 불필요합니다." : "https://로 시작하는 전체 URL을 입력해주세요"} />
                        </label>
                        <input
                            id="product-url"
                            type="url"
                            value={formData.productUrlIndividual ? '' : (formData.productUrl || '')}
                            onChange={(e) => campaignStore.setField('productUrl', e.target.value)}
                            onBlur={() => validateField('productUrl', formData.productUrl)}
                            disabled={formData.productUrlIndividual}
                            placeholder={formData.productUrlIndividual ? "선정된 인플루언서에게 개별적으로 전달됩니다." : "예시) https://smartcampaignStore.naver.com/"}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formData.productUrlIndividual ? 'bg-gray-50 border-gray-200 text-gray-400' : fieldValidation.productUrl === true ? 'border-green-300' : 'border-gray-300'
                                }`}
                        />

                        {/* 링크 비공개 / 개별전달 설정 */}
                        <div className="mt-3 flex flex-wrap gap-6">
                            {/* 링크 비공개 설정 */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.productUrlPrivate}
                                    onChange={(e) => campaignStore.setField('productUrlPrivate', e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                        링크 비공개 설정
                                    </span>
                                    <HelpTooltip content="링크는 체험 선정된 사람들에게만 보입니다." />
                                </div>
                            </label>

                            {/* 선정시 개별전달 */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.productUrlIndividual}
                                    onChange={(e) => campaignStore.updateFields({
                                        productUrlIndividual: e.target.checked,
                                        productUrl: e.target.checked ? formData.productUrl : formData.productUrl
                                    })}
                                    className="mt-0.5 w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                        선정시 구매링크 개별전달
                                    </span>
                                    <HelpTooltip content="체크 시 상품 링크를 입력하지 않아도 됩니다." />
                                </div>
                            </label>
                        </div>
                    </div>

                    {formData.productUrlIndividual && (
                        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-blue-900">옵션별 개별 구매링크 풀</p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        옵션별로 한 줄에 하나씩 링크를 입력하세요. 선정 시 최소사용우선으로 자동 배정됩니다.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {resolveLinkPoolOptionLabels().map((optionLabel) => (
                                    <div key={optionLabel} className="rounded-lg border border-blue-100 bg-white p-3">
                                        <p className="text-xs font-bold text-blue-700 mb-2">옵션: {optionLabel}</p>
                                        <textarea
                                            rows={4}
                                            placeholder={'https://example.com/link-1\nhttps://example.com/link-2'}
                                            value={getPoolLinksText(optionLabel)}
                                            onChange={(e) => updatePurchaseLinkPool(optionLabel, e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 상품명 */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            상품명 (체험 제품) <span className="text-red-500">*</span>
                            {fieldValidation.productName === true && (
                                <span className="ml-2 text-green-500 text-sm">✓</span>
                            )}
                            <HelpTooltip content="체험 받으실 상품의 정확한 명칭을 입력해주세요." />
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="product-name"
                                type="text"
                                value={formData.productName || ''}
                                onChange={(e) => campaignStore.setField('productName', e.target.value)}
                                onBlur={() => validateField('productName', formData.productName)}
                                placeholder="예시) 다온뷰 최고급 세안밴드"
                                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldValidation.productName === true ? 'border-green-300' : 'border-gray-300'
                                    }`}
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            💡 체험 전송받으실 정확한 상품명을 입력해 주세요. (예: [브랜드명] 상품명 옵션)
                        </p>
                    </div>
                </section>
            )}
            {/* 매장 정보 (방문체험단/기자단만) */}
            {(formData.campaignType === 'VISIT' || formData.campaignType === 'PRESS') && (
                <section id="store-section" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 outline-none" tabIndex={-1}>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        매장 정보 <span className="text-red-500">*</span>
                    </h2>

                    {/* 지역 설정 */}
                    <div className="mb-6 pb-6 border-b border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                            지역 선택 (시/도 및 시/군/구)
                            <HelpTooltip content="매장 주소를 불러오면 지역이 자동으로 선택됩니다. 필요 시 직접 선택도 가능합니다." />
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {/* 시/도 선택 */}
                            <Select
                                value={formData.region}
                                onValueChange={(val) => campaignStore.updateFields({ region: val, subRegion: '' })}
                            >
                                <SelectTrigger className="w-full md:w-[200px] h-12 rounded-xl border-gray-200">
                                    <SelectValue placeholder="시/도 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(REGION_DATA).map(reg => (
                                        <SelectItem key={reg} value={reg}>{reg}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* 시/군/구 선택 (시/도가 선택된 경우만 표시) */}
                            {formData.region && REGION_DATA[formData.region] && (
                                <Select
                                    value={formData.subRegion}
                                    onValueChange={(val) => campaignStore.setField('subRegion', val)}
                                >
                                    <SelectTrigger className="w-full md:w-[200px] h-12 rounded-xl border-gray-200 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <SelectValue placeholder="시/군/구 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REGION_DATA[formData.region].map(sub => (
                                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    {/* 네이버 플레이스 주소 입력 */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            네이버 플레이스 주소
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tempNaverUrl}
                                onChange={(e) => setTempNaverUrl(e.target.value)}
                                placeholder="https://map.naver.com/..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={async () => {
                                    if (tempNaverUrl.trim()) {
                                        const url = tempNaverUrl.trim();
                                        const storeId = Date.now().toString();

                                        // 1. 즉시 빈 매장 객체 추가 (UI에 카드가 먼저 보이게 함)
                                        const newStore = {
                                            id: storeId,
                                            naverPlaceUrl: url,
                                            storeName: '',
                                            address: '',
                                        };

                                        const currentStores = useCampaignStore.getState().stores;
                                        campaignStore.setField('stores', [...currentStores, newStore]);
                                        setTempNaverUrl('');

                                        // 2. 정보 서버에서 불러오기
                                        await fetchNaverPlaceInfo(url, storeId);
                                    }
                                }}
                                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium active:scale-95 disabled:opacity-50"
                            >
                                불러오기
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            네이버 지도에서 매장을 검색한 후 URL을 복사하여 붙여넣으세요.
                        </p>
                    </div>

                    {/* 불러온 매장 목록 */}
                    {formData.stores.length > 0 && (
                        <div className="space-y-4">
                            {formData.stores.map((sItem, index) => (
                                <div key={sItem.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900">매장 {index + 1}</h3>
                                        <button
                                            onClick={() => removeStore(sItem.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {!sItem.storeName ? (
                                            <div className="space-y-2 animate-pulse">
                                                <div className="h-4 bg-gray-200 rounded w-1/4" />
                                                <div className="h-10 bg-gray-100 rounded-lg w-full" />
                                                <div className="h-4 bg-gray-200 rounded w-1/4" />
                                                <div className="h-10 bg-gray-100 rounded-lg w-full" />
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        상호명
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={sItem.storeName}
                                                        onChange={(e) => {
                                                            const newValue = e.target.value;
                                                            campaignStore.setField('stores', formData.stores.map(s => s.id === sItem.id ? { ...s, storeName: newValue } : s));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        주소
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={sItem.address}
                                                        onChange={(e) => {
                                                            const newValue = e.target.value;
                                                            campaignStore.setField('stores', formData.stores.map(s => s.id === sItem.id ? { ...s, address: newValue } : s));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        네이버 플레이스 URL
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={sItem.naverPlaceUrl}
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600"
                                                    />
                                                </div>

                                                {/* 매장 지도 미리보기 추가 */}
                                                <div className="mt-3">
                                                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-tight">위치 미리보기</label>
                                                    <div className="rounded-xl overflow-hidden border border-slate-100 shadow-inner">
                                                        <NaverMap
                                                            address={sItem.address}
                                                            storeName={sItem.storeName}
                                                            lat={sItem.lat}
                                                            lng={sItem.lng}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* 체험 제공 내역 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">체험제공 정보</h2>

                {formData.campaignType !== 'DELIVERY' && (
                    <>
                        {/* 담당자 연락처 */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                담당자 연락처 {!formData.advertiserWillContact && <span className="text-red-500">*</span>}
                                {fieldValidation.contactPhone === true && (
                                    <span className="ml-2 text-green-500 text-sm">✓</span>
                                )}
                                {fieldValidation.contactPhone === false && (
                                    <span className="ml-2 text-red-500 text-sm">✗</span>
                                )}
                            </label>

                            {/* 광고주가 직접 연락 체크박스 */}
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.advertiserWillContact}
                                        onChange={(e) => campaignStore.updateFields({
                                            advertiserWillContact: e.target.checked,
                                            contactPhone: e.target.checked ? '' : formData.contactPhone
                                        })}
                                        className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-blue-900">광고주가 선정자에게 직접 연락</span>
                                        <p className="text-xs text-blue-700 mt-1">
                                            담당자가 여러 명이거나 연락처를 공개하고 싶지 않은 경우 체크하세요. 선정 후 광고주가 인플루언서에게 먼저 연락드립니다.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* 연락처 입력 필드 (광고주 직접 연락 체크 시 숨김) */}
                            {!formData.advertiserWillContact && (
                                <>
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <div className="flex-1">
                                            <input
                                                id="contact-phone"
                                                type="tel"
                                                value={formData.contactPhone || ''}
                                                onChange={handlePhoneChange}
                                                onBlur={() => validateField('contactPhone', formData.contactPhone)}
                                                placeholder="010-0000-0000"
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldValidation.contactPhone === false
                                                    ? 'border-red-300 bg-red-50'
                                                    : fieldValidation.contactPhone === true
                                                        ? 'border-green-300'
                                                        : 'border-gray-300'
                                                    }`}
                                            />
                                        </div>
                                        <div className="w-full md:w-[200px]">
                                            <Select
                                                value={formData.contactMethod || 'TEXT_ONLY'}
                                                onValueChange={(val: any) => campaignStore.setField('contactMethod', val)}
                                            >
                                                <SelectTrigger className="w-full h-10 rounded-lg border-gray-300">
                                                    <SelectValue placeholder="연락 방식 선택" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="TEXT_ONLY">문자예약 가능</SelectItem>
                                                    <SelectItem value="CALL_ONLY">전화예약 전용</SelectItem>
                                                    <SelectItem value="BOTH">문자/전화 모두 가능</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {fieldValidation.contactPhone === false && (
                                        <p className="mt-1 text-sm text-red-600">올바른 전화번호 형식을 입력해주세요 (예: 010-1234-5678)</p>
                                    )}

                                    <div className="mt-4 bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                                        <Info size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-[13px] text-indigo-700 leading-relaxed font-medium">
                                            연락처는 선정된 인플루언서에게만 안전하게 공개됩니다. 다온뷰는 광고주의 개인정보를 소중히 보호합니다.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* 방문 가능 시간 */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                방문 가능 시간 {!formData.visitTimeNegotiable && <span className="text-red-500">*</span>}
                            </label>

                            {/* 연락하여 조율 체크박스 */}
                            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.visitTimeNegotiable}
                                        onChange={(e) => campaignStore.updateFields({
                                            visitTimeNegotiable: e.target.checked,
                                            visitTime: e.target.checked ? '' : formData.visitTime
                                        })}
                                        className="mt-0.5 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-amber-900">연락하여 조율</span>
                                        <p className="text-xs text-amber-700 mt-1">
                                            예약제 운영이나 시간 조율이 필요한 경우 체크하세요. 방문 시간을 입력하지 않아도 됩니다.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* 방문 시간 입력 필드 (조율 체크 시 선택사항) */}
                            <input
                                id="visit-time"
                                type="text"
                                value={formData.visitTime || ''}
                                onChange={(e) => campaignStore.setField('visitTime', e.target.value)}
                                placeholder={formData.visitTimeNegotiable ? "예: 평일 11:00 - 21:00 (선택사항)" : "예: 평일 11:00 - 21:00"}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formData.visitTimeNegotiable ? 'border-gray-200 bg-gray-50' : 'border-gray-300'
                                    }`}
                                disabled={formData.visitTimeNegotiable}
                            />
                            <div className="mt-4 bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                                <Info size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                                <p className="text-[13px] text-indigo-700 leading-relaxed font-medium">
                                    조율 체크 시 방문 시간은 선택사항입니다. 선정 후 인플루언서와 개별 연락을 통해 최적의 방문 시간을 조정하세요.
                                </p>
                            </div>
                        </div>

                        {/* 방문 가능 요일 */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                방문 가능 요일 <span className="text-gray-500 text-xs">(선택)</span>
                            </label>

                            {/* 빠른 선택 버튼 */}
                            <div className="flex gap-2 mb-3">
                                <button
                                    type="button"
                                    onClick={setWeekdaysOnly}
                                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
                                >
                                    평일만
                                </button>
                                <button
                                    type="button"
                                    onClick={setNoWeekends}
                                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
                                >
                                    주말 불가
                                </button>
                                <button
                                    type="button"
                                    onClick={setAllDays}
                                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
                                >
                                    전체 가능
                                </button>
                            </div>

                            {/* 요일 선택 */}
                            <div className="flex gap-2">
                                {DAYS_OF_WEEK.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`px-4 py-2 rounded-lg border-2 transition-all ${formData.visitDays.includes(day)
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 text-gray-600 hover:border-blue-300'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 방문 참고사항 */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                방문 참고사항 <span className="text-gray-500 text-xs">(선택)</span>
                            </label>
                            <textarea
                                value={formData.visitNotes || ''}
                                onChange={(e) => campaignStore.setField('visitNotes', e.target.value)}
                                placeholder="주차 정보, 예약 필요 여부 등"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </>
                )}

                {/* 체험 제공 내역 - 전체 너비 */}
                <div id="experience-details" className="mt-4 outline-none" tabIndex={-1}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        체험 제공 내역 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.experienceDetails || ''}
                        onChange={(e) => campaignStore.setField('experienceDetails', e.target.value)}
                        placeholder="예: 3만원 식사권 (추가 주문 발생 시 리뷰어 부담)"
                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* 공식 판매가 & 상품 결제 금액 - 좌우 배치 */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 공식 판매가 */}
                    <div id="official-price" className="outline-none" tabIndex={-1}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            공식 판매가
                            {formData.campaignType === 'DELIVERY' && (formData.includeReview || formData.platform === 'PURCHASE') && !formData.isCouponRequired ? (
                                <span className="text-red-500"> *</span>
                            ) : (
                                <span className="text-gray-500 text-xs"> (선택, 참고용)</span>
                            )}
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={formData.officialPrice || ''}
                                onChange={(e) => handlePriceChange('officialPrice', e.target.value)}
                                disabled={formData.isCouponRequired}
                                placeholder={formData.isCouponRequired ? '' : '30,000'}
                                className={`flex-1 h-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${formData.isCouponRequired ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                            />
                            <span className="text-gray-600">원 상당</span>
                        </div>
                    </div>

                    {/* 상품 결제 금액 (배송체험단만) */}
                    {formData.campaignType === 'DELIVERY' && (
                        <div id="product-price" className="outline-none" tabIndex={-1}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                상품 결제 금액(배송비 포함)
                                {(formData.includeReview || formData.platform === 'PURCHASE') && !formData.isCouponRequired ? (
                                    <span className="text-red-500"> *</span>
                                ) : (
                                    <span className="text-gray-500 text-xs"> (선택)</span>
                                )}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={formData.productPrice || ''}
                                    onChange={(e) => handlePriceChange('productPrice', e.target.value)}
                                    disabled={formData.isCouponRequired}
                                    placeholder={formData.isCouponRequired ? '' : '0'}
                                    className={`flex-1 h-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${formData.isCouponRequired ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                                />
                                <span className="text-gray-600">원</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                💡 옵션이 있는 경우 위 옵션별 금액을, 옵션이 없는 경우 이 금액을 사용합니다.
                            </p>
                        </div>
                    )}
                </div>

                {/* 쿠폰 사용 필수 여부 (배송체험단만) */}
                {formData.campaignType === 'DELIVERY' && (
                    <div className="mt-4">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.isCouponRequired}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    campaignStore.updateFields({
                                        isCouponRequired: checked,
                                        ... (checked ? {
                                            productPrice: '',
                                            officialPrice: '',
                                            purchaseRewardMethod: 'DIRECT'
                                        } : {})
                                    });
                                }}
                                className="mt-1 w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                    리워드를 결제 금액(쿠폰/옵션 등) 기준으로 개별 지급하는 경우 체크해 주세요.
                                </span>
                                <p className="mt-1 text-xs text-gray-500">
                                    💡 체크 시 위 '상품 결제 금액' 입력을 제한하며, '광고주 직접 지급' 방식으로만 진행할 수 있습니다.
                                </p>
                            </div>
                        </label>
                    </div>
                )}

                {/* 구매평 리워드 지급 방식 선택 (배송 + 구매평 플랫폼인 경우만) */}
                {formData.campaignType === 'DELIVERY' && (formData.includeReview || formData.platform === 'PURCHASE') && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <Label className="text-sm font-bold text-gray-900 mb-4 block">
                            구매평 리워드 지급 방식 <span className="text-red-500">*</span>
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 광고주 직접 지급 */}
                            <button
                                type="button"
                                onClick={() => campaignStore.setField('purchaseRewardMethod', 'DIRECT')}
                                className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col gap-2 ${formData.purchaseRewardMethod === 'DIRECT'
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`font-bold text-base ${formData.purchaseRewardMethod === 'DIRECT' ? 'text-blue-700' : 'text-slate-800'}`}>
                                        광고주 직접 지급
                                    </span>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.purchaseRewardMethod === 'DIRECT' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                                        {formData.purchaseRewardMethod === 'DIRECT' && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                </div>
                                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                    인플루언서가 리뷰 작성을 완료하면, <strong className="text-slate-700">광고주가 인플루언서 은행 계좌로 결제 대금을 직접 송금</strong>합니다. (다온뷰 결제 시 리워드 금액 미포함)
                                </p>
                            </button>

                            {/* 다온뷰 안심 지급 */}
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => campaignStore.setField('purchaseRewardMethod', 'DAONVIEW')}
                                    disabled={formData.isCouponRequired}
                                    className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col gap-2 ${formData.purchaseRewardMethod === 'DAONVIEW'
                                        ? 'border-rose-500 bg-rose-50 shadow-sm'
                                        : 'border-slate-200 bg-white'
                                        } ${formData.isCouponRequired ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-rose-300 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`font-bold text-base flex items-center gap-1 ${formData.purchaseRewardMethod === 'DAONVIEW' ? 'text-rose-700' : 'text-slate-800'}`}>
                                            다온뷰 안심 지급
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-600 font-black">추천</span>
                                        </span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.purchaseRewardMethod === 'DAONVIEW' ? 'border-rose-500 bg-rose-500' : 'border-slate-300'}`}>
                                            {formData.purchaseRewardMethod === 'DAONVIEW' && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                    <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                        번거로운 송금 업무와 세금 처리를 다온뷰가 대행합니다. 미리 <strong className="text-slate-700">상품 결제 금액 + 부가세(10%)</strong>를 다온뷰에 결제해 두시면 됩니다.
                                    </p>
                                </button>
                                {formData.isCouponRequired && (
                                    <p className="text-[12px] text-rose-500 font-bold px-1">
                                        리워드를 개별 지급하는 경우 안심 지급 기능을 이용할 수 없습니다.
                                    </p>
                                )}
                            </div>
                        </div>
                        {formData.purchaseRewardMethod === 'DAONVIEW' && (
                            <div className="mt-3 bg-rose-50/50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <Info size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[12px] text-rose-700 font-medium">
                                    [상품 결제 금액 × 모집인원 × 1.1(부가세)]원 만큼이 최종 캠페인 등록비 결제 시 합산 청구됩니다. 공식 판매가가 아닌 위에서 설정하신 <strong className="font-bold underline">상품 결제 금액</strong>을 기준으로 산정되오니, 다시 한 번 확인해주세요.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* 제품/서비스 옵션 정보 (전체 타입 공통) */}
            {formData.campaignType && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">제공 옵션 설정</h2>
                        <p className="text-xs text-gray-500">드래그하여 순서 변경 가능</p>
                    </div>

                    {/* 옵션 목록 */}
                    <div className="mb-4">
                        {formData.productOptions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                <p className="text-sm mb-2">옵션이 없는 경우 추가하지 않아도 됩니다.</p>
                                <p className="text-xs text-gray-400">(단일 상품/서비스)</p>
                            </div>
                        ) : (
                            <>
                                {/* Table Header */}
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-t-lg text-xs font-bold text-gray-600">
                                    <div className="w-6 flex-shrink-0"></div>
                                    <div className="w-8 text-center flex-shrink-0">#</div>
                                    <div className="flex-1">옵션 정보 <span className="text-red-500">*</span></div>
                                    <div className="w-24 text-center flex-shrink-0">모집 인원</div>
                                    <div className="w-8 flex-shrink-0"></div>
                                </div>

                                {/* Sortable Options */}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={formData.productOptions.map(opt => opt.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2 border-x border-b border-gray-200 rounded-b-lg p-2 bg-gray-50/50">
                                            {formData.productOptions.map((option, index) => (
                                                <SortableOptionRow
                                                    key={option.id}
                                                    option={option}
                                                    index={index}
                                                    campaignType={formData.campaignType}
                                                    onUpdate={updateProductOption}
                                                    onRemove={removeProductOption}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </>
                        )}
                    </div>

                    {/* 옵션 추가 버튼 */}
                    <button
                        onClick={addProductOption}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all"
                    >
                        <Plus size={18} />
                        옵션 추가
                    </button>

                    {/* 옵션 선택 규칙 설정 */}
                    <div className="mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* 선택 모드 드롭다운 - 2칸 차지 */}
                                <div className="space-y-3 md:col-span-2">
                                    <Label className="text-sm font-bold text-slate-700">선택 모드</Label>
                                    <Select
                                        value={formData.optionConfig.mode}
                                        onValueChange={(val: 'SINGLE' | 'RANKED' | 'MULTI') => handleOptionModeChange(val)}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 font-medium focus:ring-rose-500/20">
                                            <SelectValue placeholder="선택 모드를 선택하세요" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                            <SelectItem value="SINGLE" className="font-medium focus:bg-rose-50 text-slate-700">단일 선택 (하나만 선택)</SelectItem>
                                            <SelectItem value="RANKED" className="font-medium focus:bg-rose-50 text-slate-700">순위 선택 (1~3순위 희망)</SelectItem>
                                            <SelectItem value="MULTI" className="font-medium focus:bg-rose-50 text-slate-700">중복 선택 (여러 개 당첨 가능)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 최대 선택 가능 개수 - 1칸 차지 */}
                                {formData.optionConfig.mode !== 'SINGLE' && (
                                    <div className="space-y-3 md:col-span-1 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <Label className="text-sm font-bold text-slate-700">
                                            {formData.optionConfig.mode === 'RANKED' ? '희망 순위 제한' : '최대 선택 가능 개수'}
                                        </Label>
                                        <div className="flex items-center gap-2 h-12">
                                            <Input
                                                type="number"
                                                value={formData.optionConfig.maxSelect}
                                                onChange={(e) => campaignStore.setField('optionConfig', {
                                                    ...formData.optionConfig,
                                                    maxSelect: Math.max(1, parseInt(e.target.value) || 1)
                                                })}
                                                min="1"
                                                max={formData.productOptions.length > 0 ? formData.productOptions.length : 10}
                                                className="flex-1 h-full text-center text-lg font-bold border-slate-200 rounded-xl"
                                            />
                                            <span className="text-base font-bold text-slate-600">개</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium">
                                            {formData.optionConfig.mode === 'RANKED'
                                                ? '인플루언서가 최대 몇 순위까지 신청할 수 있는지 설정합니다.'
                                                : '인플루언서 한 명에게 최대 몇 개의 옵션을 배정할지 설정합니다.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-indigo-50/30 border-t border-indigo-100 flex items-start gap-3">
                            <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                            <p className="text-[13px] text-indigo-700 font-medium leading-relaxed">
                                {
                                    formData.optionConfig.mode === 'RANKED' ? `인플루언서가 최대 ${formData.optionConfig.maxSelect}순위까지 우선순위를 정해 신청할 수 있어 당첨 확률이 높아집니다.` :
                                        formData.optionConfig.mode === 'MULTI' ? `인플루언서가 선택한 옵션 중 최대 ${formData.optionConfig.maxSelect}개까지 당첨될 수 있는 방식입니다.` :
                                            "가장 일반적인 방식으로, 인플루언서가 하나의 옵션만 선택하여 신청합니다."
                                }
                            </p>
                        </div>
                    </div>
                </section>
            )}


            {/* 모집 정보 & 일정 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">모집 정보 & 일정</h2>

                {/* 가로 구분선 */}
                <div className="border-t border-gray-200 mb-6"></div>

                <div className="flex flex-col gap-10">
                    {/* 왼쪽: 모집 정보 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Users size={20} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-800">모집 정보</h3>
                        </div>

                        {/* 전체 모집 인원 */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                전체 모집 인원 <span className="text-red-500">*</span>
                                {fieldValidation.totalRecruitment === true && (
                                    <span className="text-green-500 text-sm">✓</span>
                                )}
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative w-32">
                                    <Input
                                        id="recruitment-count"
                                        type="text"
                                        value={formData.totalRecruitment === '999' ? '∞' : formData.totalRecruitment || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '∞') return;
                                            campaignStore.setField('totalRecruitment', val);
                                        }}
                                        onBlur={() => validateField('totalRecruitment', formData.totalRecruitment)}
                                        placeholder="10"
                                        className={`text-right pr-8 font-bold text-lg h-11 border-2 ${fieldValidation.totalRecruitment === true ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">명</span>
                                </div>

                                <div className="flex items-center gap-1.5 font-bold">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => adjustRecruitmentCount(5)}
                                        className="h-11 px-4 font-bold active:scale-95 transition-transform"
                                    >
                                        +5
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => adjustRecruitmentCount(10)}
                                        className="h-11 px-4 font-bold active:scale-95 transition-transform"
                                    >
                                        +10
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            if (!isUnlimited && !isAdmin) {
                                                toast.error('무제한 모집은 월 구독 광고주만 이용 가능합니다.');
                                                return;
                                            }
                                            campaignStore.setField('totalRecruitment', '999');
                                        }}
                                        className="h-11 px-4 font-bold active:scale-95 transition-transform flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none"
                                        title="무제한 모집"
                                    >
                                        <Infinity size={18} strokeWidth={3} />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => campaignStore.setField('totalRecruitment', '0')}
                                        className="h-11 px-3 text-muted-foreground active:scale-95 transition-transform"
                                    >
                                        초기화
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 모집 일정 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarIcon size={20} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-800">모집 일정</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {([
                                    { value: 'DEFAULT', title: '기본일정', summary: '오늘 시작 / 1주 모집 / 1주 체험' },
                                    { value: 'FAST', title: '빠른모집', summary: '오늘 시작 / 2주 노출 / 수시 선정 / 상시 자동 연장' },
                                ] as const).map((option) => {
                                    const isActive = schedulePreview.scheduleType === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleScheduleTypeChange(option.value)}
                                            className={cn(
                                                "rounded-2xl border p-4 text-left transition-all",
                                                isActive
                                                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className={cn("text-[15px] font-bold", isActive ? "text-white" : "text-slate-900")}>
                                                        {option.title}
                                                    </div>
                                                    <p className={cn("mt-1 text-[12px] font-medium", isActive ? "text-slate-200" : "text-slate-500")}>
                                                        {option.summary}
                                                    </p>
                                                </div>
                                                <div className={cn(
                                                    "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2",
                                                    isActive ? "border-white bg-white" : "border-slate-300"
                                                )}>
                                                    {isActive && <div className="h-2 w-2 rounded-full bg-slate-900" />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5">
                                <div className="flex items-start gap-3">
                                    <Info size={18} className="mt-0.5 flex-shrink-0 text-blue-700" />
                                    <div className="space-y-1">
                                        <p className="text-[13px] font-bold text-blue-900">
                                            결제 완료 시 시작일은 당일(KST)로 자동 고정됩니다.
                                        </p>
                                        <p className="text-[12px] leading-relaxed font-medium text-blue-700">
                                            {scheduleDescriptions[schedulePreview.scheduleType]}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div id="start-date" className="rounded-[28px] border border-slate-200 bg-[#f8f8f7] p-3.5 md:p-4">
                                <div className="grid gap-4 md:grid-cols-[minmax(0,9fr)_minmax(0,11fr)] md:items-start">
                                    <div className="space-y-3 border-b border-slate-200/80 pb-3 md:border-b-0 md:border-r md:pr-4">
                                        <div className="grid gap-2">
                                            {schedulePreview.displayRows.map((row) => (
                                                <div key={row.label} className="grid grid-cols-[84px_1fr] items-center gap-2 md:grid-cols-[96px_1fr]">
                                                    <span className="text-[14px] font-bold tracking-tight text-slate-900">{row.label}</span>
                                                    <span
                                                        className={cn(
                                                            "text-[14px] font-semibold tracking-tight md:text-[15px]",
                                                            row.tone === 'selection' ? 'text-rose-500' : 'text-slate-800'
                                                        )}
                                                    >
                                                        {row.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-1">
                                            <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400">RULE</p>
                                            <div className="mt-2 space-y-1 text-[10px] leading-[1.5] font-medium text-slate-600">
                                                <p>시작일은 결제 완료 시점의 KST 기준 오늘로 자동 고정된다.</p>
                                                {isFlexibleSchedule ? (
                                                    <>
                                                        <p>빠른모집은 시작일 기준 14일 동안 우선 노출되며 캠페인이 종료될 때까지 자동 연장된다.</p>
                                                        <p>광고주는 신청 건마다 개별적으로 수시 선정할 수 있다.</p>
                                                        <p>선정된 인플루언서는 선정 후 7일 이내 체험 및 리뷰를 진행한다.</p>
                                                    </>
                                                ) : (
                                                    <p>기본일정은 2주 안에 모집과 체험이 모두 끝나도록 고정된다.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full max-w-[450px] space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[11px] font-medium text-slate-500">모집 캘린더</p>
                                                <p className="text-[15px] font-bold tracking-tight text-slate-900 md:text-[16px]">
                                                    {scheduleMonthTitle}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-end gap-1">
                                                {!isFlexibleSchedule && (
                                                    <span className="inline-flex h-5 min-w-10 items-center justify-center rounded-full bg-slate-700 px-2 text-[10px] font-bold text-white">신청</span>
                                                )}
                                                {!isFlexibleSchedule && (
                                                    <span className="inline-flex h-5 min-w-10 items-center justify-center rounded-full bg-rose-500 px-2 text-[10px] font-bold text-white">발표</span>
                                                )}
                                                <span className="inline-flex h-5 min-w-10 items-center justify-center rounded-full bg-slate-200 px-2 text-[10px] font-bold text-slate-700">체험</span>
                                            </div>
                                        </div>

                                        <div className="w-full rounded-[20px] bg-white/50 px-1.5 py-2 md:px-2 md:py-2.5">
                                            <div className="grid grid-cols-7 gap-0.5 border-b border-slate-100 pb-1.5">
                                                {CALENDAR_DAYS.map((day) => (
                                                    <div key={day} className="text-center text-[10px] font-medium text-slate-500 md:text-[11px]">
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-1.5 space-y-1">
                                                {calendarWeeks.map((week) => {
                                                    const applicationSegment = buildRangeSegment(
                                                        week,
                                                        schedulePreview.calendarHighlights.application.start,
                                                        schedulePreview.calendarHighlights.application.end,
                                                        'application',
                                                        isFlexibleSchedule ? '캠페인' : '신청'
                                                    );
                                                    const selectionSegment = isFlexibleSchedule
                                                        ? null
                                                        : buildSelectionSegment(
                                                            week,
                                                            schedulePreview.calendarHighlights.selection
                                                        );
                                                    const experienceSegment = buildRangeSegment(
                                                        week,
                                                        schedulePreview.calendarHighlights.experience.start,
                                                        schedulePreview.calendarHighlights.experience.end,
                                                        'experience',
                                                        '체험'
                                                    );

                                                    return (
                                                        <Fragment key={week.key}>
                                                            <div className="grid grid-cols-7 gap-0.5">
                                                                {week.cells.map((cell, cellIndex) => {
                                                                    const isToday = cell.date === todayDate;
                                                                    const isSunday = cellIndex === 0;

                                                                    return (
                                                                        <div
                                                                            key={cell.date}
                                                                            className="flex h-8 items-end justify-center"
                                                                        >
                                                                            <span
                                                                                className={cn(
                                                                                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold leading-none tracking-tight md:h-5.5 md:min-w-5.5 md:text-[12px]",
                                                                                    cell.isCurrentMonth ? "text-slate-900" : "text-slate-300",
                                                                                    isSunday && (cell.isCurrentMonth ? "text-rose-500" : "text-rose-200"),
                                                                                    isToday && "border border-slate-400 bg-white"
                                                                                )}
                                                                            >
                                                                                {cell.dayNumber}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {isFlexibleSchedule ? (
                                                                <div className="grid h-4 grid-cols-7 gap-0.5 pt-px">
                                                                        {experienceSegment ? (
                                                                            <div
                                                                                className="flex items-center justify-center rounded-full bg-slate-200 px-1.5 text-[10px] font-bold tracking-tight text-slate-700"
                                                                                style={{ gridColumn: `${experienceSegment.startCol} / ${experienceSegment.endCol + 1}` }}
                                                                            >
                                                                                {experienceSegment.label}
                                                                            </div>
                                                                        ) : null}
                                                                </div>
                                                            ) : (
                                                                <div className="grid h-4 grid-cols-7 gap-0.5 pt-px">
                                                                    {[applicationSegment, selectionSegment, experienceSegment].filter(Boolean).map((segment) => {
                                                                        if (!segment) return null;

                                                                        return (
                                                                            <div
                                                                                key={`${segment.tone}-${segment.startCol}-${segment.endCol}`}
                                                                                className={cn(
                                                                                    "flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold tracking-tight",
                                                                                    segment.tone === 'application' && "bg-slate-700 text-white",
                                                                                    segment.tone === 'selection' && "bg-rose-500 text-white",
                                                                                    segment.tone === 'experience' && "bg-slate-200 text-slate-700"
                                                                                )}
                                                                                style={{ gridColumn: `${segment.startCol} / ${segment.endCol + 1}` }}
                                                                            >
                                                                                {segment.label}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </Fragment>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
