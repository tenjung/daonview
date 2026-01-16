'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, Plus, X, Info, HelpCircle, Users, Calendar, Save, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    productName: string;
    campaignTitle: string; // 캠페인 제목 동기화용 추가
    productOptions: ProductOption[];
    productPrice: string;
    shippingCost: string;
    freeShippingCondition: boolean;
    // 방문/기자단용: 플랫폼 선택
    platform: 'BLOG' | 'INSTAGRAM' | null;
    category?: string;  // 카테고리 (선택)
    region?: string;    // 지역 (방문형용, 선택)
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
    rewardPerPerson: number;
    scheduleType: 'recommended' | 'custom' | 'always';
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

interface Store {
    id: string;
    naverPlaceUrl: string;
    storeName: string;
    address: string;
}

interface CampaignStep1Props {
    onNext: (data: Step1Data) => void;
    onChange?: (data: Step1Data) => void;
    onSaveDraft?: () => void;
    initialData?: Partial<Step1Data>;
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

            {/* Option Price */}
            <div className="w-32 flex-shrink-0">
                <div className="flex items-center gap-1">
                    <input
                        type="text"
                        value={option.optionPrice}
                        onChange={(e) => onUpdate(option.id, 'optionPrice', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-500">원</span>
                </div>
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

export default function CampaignStep1({ onNext, onChange, onSaveDraft, initialData }: CampaignStep1Props) {
    // 스마트 기본값: 내일 날짜
    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    // 스마트 기본값: 1주일 뒤 날짜
    const getOneWeekLater = (fromDate?: string) => {
        const date = fromDate ? new Date(fromDate) : new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState<Step1Data>({
        campaignType: initialData?.campaignType || null,
        includeReview: initialData?.includeReview || false,
        includeNaver: initialData?.includeNaver || false,
        includeInstagram: initialData?.includeInstagram || false,
        productUrl: initialData?.productUrl || '',
        productUrlPrivate: initialData?.productUrlPrivate || false,
        productName: initialData?.productName || '',
        campaignTitle: initialData?.campaignTitle || '',
        productOptions: initialData?.productOptions || [],
        productPrice: initialData?.productPrice || '',
        shippingCost: initialData?.shippingCost || '',
        freeShippingCondition: initialData?.freeShippingCondition || false,
        platform: initialData?.platform || null,
        category: initialData?.category || '',
        region: initialData?.region || '',
        stores: initialData?.stores || [],
        contactPhone: initialData?.contactPhone || '',
        advertiserWillContact: initialData?.advertiserWillContact || false,
        visitTime: initialData?.visitTime || '',
        visitTimeNegotiable: initialData?.visitTimeNegotiable || false,
        visitDays: initialData?.visitDays || [],
        visitNotes: initialData?.visitNotes || '',
        experienceDetails: initialData?.experienceDetails || '',
        officialPrice: initialData?.officialPrice || '',
        totalRecruitment: initialData?.totalRecruitment || '',
        rewardPerPerson: initialData?.rewardPerPerson || 0,
        scheduleType: initialData?.scheduleType || 'recommended',
        recruitmentStartDate: initialData?.recruitmentStartDate || getTomorrowDate(), // 스마트 기본값: 내일
        firstSelectionDate: initialData?.firstSelectionDate || getOneWeekLater(getTomorrowDate()), // 스마트 기본값: 1주일 뒤
        reviewDeadline: initialData?.reviewDeadline || '',
        reviewDeadlineDays: initialData?.reviewDeadlineDays || '7', // 스마트 기본값: 7일
        optionConfig: initialData?.optionConfig || {
            mode: 'SINGLE',
            maxSelect: 1
        },
    });

    // 초기 데이터 로드 (임시저장 불러오기 시)
    useEffect(() => {
        if (initialData) {
            console.log('📥 [CampaignStep1] 수신된 initialData:', initialData);
            setFormData(prev => {
                // null 값을 제거하여 state의 기본값이 유지되도록 함
                const sanitizedInitial = { ...initialData };
                Object.keys(sanitizedInitial).forEach(key => {
                    if ((sanitizedInitial as any)[key] === null) {
                        delete (sanitizedInitial as any)[key];
                    }
                });

                const merged = {
                    ...prev,
                    ...sanitizedInitial
                };
                console.log('✅ [CampaignStep1] 병합된 formData:', merged);
                return merged;
            });
        }
    }, [initialData]);

    // 부모 컴포넌트에 데이터 변경 알림
    useEffect(() => {
        if (onChange) {
            onChange(formData);
        }
    }, [formData, onChange]);

    const [showAddressModal, setShowAddressModal] = useState(false);
    const [currentStoreIndex, setCurrentStoreIndex] = useState<number | null>(null);
    const [tempNaverUrl, setTempNaverUrl] = useState('');
    const [showCouponTooltip, setShowCouponTooltip] = useState(false);

    // 모집 인원 조정
    const adjustRecruitmentCount = (amount: number) => {
        setFormData(prev => {
            const currentCount = parseInt(prev.totalRecruitment) || 0;
            const newCount = Math.max(0, currentCount + amount);
            return { ...prev, totalRecruitment: newCount.toString() };
        });
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
        setFormData(prev => ({
            ...prev,
            stores: [...prev.stores, newStore],
        }));
    };

    // 매장 삭제
    const removeStore = (id: string) => {
        setFormData(prev => ({
            ...prev,
            stores: prev.stores.filter(store => store.id !== id),
        }));
    };

    // 주소에서 지역(시/도) 추출 유틸리티
    const extractRegionFromAddress = (address: string) => {
        if (!address) return '';
        const regionMap: Record<string, string> = {
            '서울': '서울', '경기': '경기', '인천': '인천', '부산': '부산', '대구': '대구',
            '광주': '광주', '대전': '대전', '울산': '울산', '세종': '세종', '강원': '강원',
            '충북': '충북', '충청북도': '충북', '충남': '충남', '충청남도': '충남',
            '전북': '전북', '전라북도': '전북', '전남': '전남', '전라남도': '전남',
            '경북': '경북', '경상북도': '경북', '경남': '경남', '경상남도': '경남',
            '제주': '제주'
        };

        const firstWord = address.split(' ')[0];
        // 서울특별시 -> 서울, 경기도 -> 경기 등으로 변환
        for (const [key, value] of Object.entries(regionMap)) {
            if (firstWord.includes(key)) return value;
        }
        return '';
    };

    // 네이버 플레이스 정보 가져오기 (Mock - 실제로는 API 연동 필요)
    const fetchNaverPlaceInfo = async (url: string, storeId: string) => {
        // TODO: 실제 네이버 플레이스 API 연동
        // 임시로 더미 데이터 사용 (사용자 캡쳐본의 매장 정보 반영)
        const mockData = {
            storeName: '오쓰헤어',
            address: '대구 수성구 달구벌대로 2599 304동 1층 119호',
        };

        const extractedRegion = extractRegionFromAddress(mockData.address);

        setFormData(prev => ({
            ...prev,
            // 주소에서 추출된 지역이 있으면 자동 설정 (수동 선택 전 자동화)
            region: extractedRegion || prev.region,
            stores: prev.stores.map(store =>
                store.id === storeId
                    ? { ...store, naverPlaceUrl: url, ...mockData }
                    : store
            ),
        }));

        if (extractedRegion) {
            toast.success(`지역이 '${extractedRegion}'(으)로 자동 설정되었습니다.`);
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
            setFormData(prev => {
                const oldIndex = prev.productOptions.findIndex(opt => opt.id === active.id);
                const newIndex = prev.productOptions.findIndex(opt => opt.id === over.id);

                return {
                    ...prev,
                    productOptions: arrayMove(prev.productOptions, oldIndex, newIndex),
                };
            });
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
        setFormData(prev => ({
            ...prev,
            productOptions: [...prev.productOptions, newOption],
        }));
    };

    // 제품 옵션 삭제
    const removeProductOption = (id: string) => {
        setFormData(prev => ({
            ...prev,
            productOptions: prev.productOptions.filter(opt => opt.id !== id),
        }));
    };

    // 제품 옵션 업데이트
    const updateProductOption = (id: string, field: keyof ProductOption, value: string) => {
        let finalValue = value;
        if (field === 'optionPrice') {
            finalValue = formatPrice(value);
        }

        setFormData(prev => ({
            ...prev,
            productOptions: prev.productOptions.map(opt =>
                opt.id === id ? { ...opt, [field]: finalValue } : opt
            ),
        }));
    };

    // 요일 토글
    const toggleDay = (day: string) => {
        setFormData(prev => ({
            ...prev,
            visitDays: prev.visitDays.includes(day)
                ? prev.visitDays.filter(d => d !== day)
                : [...prev.visitDays, day],
        }));
    };

    // 요일 빠른 선택
    const setWeekdaysOnly = () => {
        setFormData(prev => ({ ...prev, visitDays: ['월', '화', '수', '목', '금'] }));
    };

    const setNoWeekends = () => {
        setFormData(prev => ({ ...prev, visitDays: ['월', '화', '수', '목', '금'] }));
    };

    const setAllDays = () => {
        setFormData(prev => ({ ...prev, visitDays: ['월', '화', '수', '목', '금', '토', '일'] }));
    };

    // 리워드 조정
    const adjustReward = (amount: number) => {
        setFormData(prev => ({
            ...prev,
            rewardPerPerson: Math.max(0, prev.rewardPerPerson + amount),
        }));
    };

    // 입력 도우미: 전화번호 자동 포맷팅
    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/[^0-9]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
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
        setFormData(prev => ({ ...prev, contactPhone: formatted }));
    };

    // 가격 변경 핸들러
    const handlePriceChange = (field: 'productPrice' | 'shippingCost' | 'officialPrice', value: string) => {
        const formatted = formatPrice(value);
        setFormData(prev => ({ ...prev, [field]: formatted }));
    };

    // 플랫폼 토글 (하이브리드 지원 및 타입별 동기화)
    const toggleDeliveryPlatform = (plat: 'review' | 'naver' | 'instagram') => {
        const { includeReview, includeNaver, includeInstagram, campaignType } = formData;

        if (plat === 'review') {
            setFormData(prev => ({ ...prev, includeReview: !prev.includeReview }));
        } else if (plat === 'naver') {
            if (!includeNaver) {
                if (includeInstagram) {
                    toast.error('네이버와 인스타그램은 동시에 선택할 수 없습니다.\n인스타그램을 먼저 해제해주세요.');
                    return;
                }
            }
            const newValue = !includeNaver;
            setFormData(prev => ({
                ...prev,
                includeNaver: newValue,
                // 방문형/기자단인 경우 platform 필드 자동 동기화
                platform: (campaignType === 'VISIT' || campaignType === 'PRESS') && newValue ? 'BLOG' : prev.platform
            }));
        } else if (plat === 'instagram') {
            if (!includeInstagram) {
                if (includeNaver) {
                    toast.error('네이버와 인스타그램은 동시에 선택할 수 없습니다.\n네이버를 먼저 해제해주세요.');
                    return;
                }
            }
            const newValue = !includeInstagram;
            setFormData(prev => ({
                ...prev,
                includeInstagram: newValue,
                // 방문형/기자단인 경우 platform 필드 자동 동기화
                platform: (campaignType === 'VISIT' || campaignType === 'PRESS') && newValue ? 'INSTAGRAM' : prev.platform
            }));
        }
    };

    // 모집 시작일로부터 N주 뒤 날짜 설정
    const setFirstSelectionDateByWeeks = (weeks: number) => {
        if (!formData.recruitmentStartDate) {
            toast.error('먼저 모집 시작일을 선택해주세요.');
            return;
        }

        const startDate = new Date(formData.recruitmentStartDate);
        const targetDate = new Date(startDate);
        targetDate.setDate(targetDate.getDate() + (weeks * 7));

        const formattedDate = targetDate.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, firstSelectionDate: formattedDate }));
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
                isValid = value && value.startsWith('http');
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
        if (!formData.campaignType) return false;

        // 배송체험단
        if (formData.campaignType === 'DELIVERY') {
            // 최소 하나는 선택되어야 함
            if (!formData.includeReview && !formData.includeNaver && !formData.includeInstagram) {
                return false;
            }
            // 제품 정보 필수
            if (!formData.productUrl || !formData.productName || !formData.productPrice) {
                return false;
            }
        }

        // 방문체험단 또는 기자단
        if (formData.campaignType === 'VISIT' || formData.campaignType === 'PRESS') {
            if (!formData.platform) return false;
            if (formData.stores.length === 0) return false;
            // 광고주 직접 연락이 아닌 경우에만 연락처 필수
            if (!formData.advertiserWillContact && !formData.contactPhone) return false;
            // 조율 필요가 아닌 경우에만 방문 시간 필수
            if (!formData.visitTimeNegotiable && !formData.visitTime) return false;
        }

        if (!formData.totalRecruitment) return false;
        if (!formData.recruitmentStartDate) return false;

        return true;
    };

    const handleNext = () => {
        if (!formData.campaignType) {
            toast.error('진행 유형을 선택해주세요.');
            return;
        }

        // 배송체험단 유효성 검사
        if (formData.campaignType === 'DELIVERY') {
            if (!formData.includeReview && !formData.includeNaver && !formData.includeInstagram) {
                toast.error('최소 하나의 플랫폼을 선택해주세요.');
                return;
            }
            if (!formData.productUrl) {
                toast.error('상품 링크를 입력해주세요.');
                return;
            }
            if (!formData.productName) {
                toast.error('상품명을 입력해주세요.');
                return;
            }
            if (!formData.productPrice) {
                toast.error('상품 가격을 입력해주세요.');
                return;
            }
        }

        // 방문체험단/기자단 유효성 검사
        if (formData.campaignType === 'VISIT' || formData.campaignType === 'PRESS') {
            if (!formData.platform) {
                toast.error('플랫폼을 선택해주세요.');
                return;
            }
            if (formData.stores.length === 0) {
                toast.error('최소 1개의 매장을 추가해주세요.');
                return;
            }
            // 광고주가 직접 연락하지 않는 경우에만 연락처 필수
            if (!formData.advertiserWillContact && !formData.contactPhone) {
                toast.error('연락처를 입력하거나 "광고주가 선정자에게 직접 연락" 옵션을 선택해주세요.');
                return;
            }
            // 조율이 필요하지 않은 경우에만 방문 시간 필수
            if (!formData.visitTimeNegotiable && !formData.visitTime) {
                toast.error('방문 가능 시간을 입력하거나 "연락하여 조율" 옵션을 선택해주세요.');
                return;
            }
            if (!formData.experienceDetails) {
                toast.error('제공 내역을 입력해주세요.');
                return;
            }
        }

        // 공통 필수 항목
        if (!formData.totalRecruitment) {
            toast.error('총 모집 인원을 입력해주세요.');
            return;
        }
        if (!formData.recruitmentStartDate) {
            toast.error('모집 시작일을 선택해주세요.');
            return;
        }

        if (isFormValid()) {
            onNext(formData);
        }
    };

    // Schedule type change handler
    const handleScheduleTypeChange = (type: 'recommended' | 'custom' | 'always') => {
        if (type === 'always') {
            setFormData(prev => ({
                ...prev,
                scheduleType: 'always',
                firstSelectionDate: '', // Clear dates for 'always'
                reviewDeadline: ''
            }));
        } else {
            const startDate = formData.recruitmentStartDate || getTomorrowDate();
            setFormData(prev => ({
                ...prev,
                scheduleType: type,
                recruitmentStartDate: startDate,
                firstSelectionDate: getOneWeekLater(startDate),
                reviewDeadline: getOneWeekLater(getOneWeekLater(startDate))
            }));
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">

            {/* 캠페인 제목 (모집글 제목) */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">캠페인 제목 (모집글 제목)</h2>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        value={formData.campaignTitle || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, campaignTitle: e.target.value }))}
                        placeholder="예시) [무료배송] 다온뷰 최고급 세안밴드 체험단 모집"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    💡 인플루언서들이 모집 목록에서 보게 될 중요 제목입니다.
                </p>
            </section>

            {/* 카테고리 선택 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">카테고리 선택</h2>
                <div className="flex flex-wrap gap-2">
                    {['맛집', '뷰티', '숙박', '생활', '서비스', '유아동', '디지털/가전', '기타'].map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
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
                <h2 className="text-xl font-bold text-gray-900 mb-4">진행 유형 선택</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 배송체험단 */}
                    <button
                        onClick={() => setFormData(prev => ({ ...prev, campaignType: 'DELIVERY', platform: null }))}
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
                        onClick={() => setFormData(prev => ({ ...prev, campaignType: 'VISIT', includeReview: false, includeNaver: false, includeInstagram: false }))}
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
                        onClick={() => setFormData(prev => ({ ...prev, campaignType: 'PRESS', includeReview: false, includeNaver: false, includeInstagram: false }))}
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

            {/* 배송체험단/방문체험단/기자단 - 플랫폼 토글 선택 (하이브리드 지원) */}
            {formData.campaignType && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">진행 방식 및 플랫폼 선택</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        원하는 리뷰 플랫폼을 선택하세요. {formData.campaignType === 'DELIVERY' ? '구매평 단독, 네이버/인스타 단독, 또는 구매평+SNS 조합이 가능합니다.' : '네이버 블로그 또는 인스타그램을 선택할 수 있습니다.'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 구매평 토글 (배송형만) */}
                        {formData.campaignType === 'DELIVERY' && (
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
                        )}

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
                                    </div>
                                </div>
                            </div>

                            {/* 1석2조 혜택 안내 (구매평 + SNS 조합 시) */}
                            {formData.includeReview && (formData.includeNaver || formData.includeInstagram) && (
                                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">👍</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-amber-900 mb-2">
                                                1석2조 혜택! 구매평과 SNS를 함께 진행하세요
                                            </p>
                                            <ul className="text-sm text-amber-800 space-y-1">
                                                <li>✓ 제품비용 절약: 한 번의 제품 제공으로 2가지 리뷰 진행</li>
                                                <li>✓ 시간 효율: 동시 진행으로 캠페인 기간 단축</li>
                                                <li>✓ 다양한 노출: 쇼핑몰 + SNS 채널 동시 마케팅</li>
                                            </ul>
                                        </div>
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
                    <h2 className="text-xl font-bold text-gray-900 mb-4">체험 상품 · 모집 조건</h2>

                    {/* 진행할 쇼핑몰 상품 링크 */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            진행할 상품 링크(url)을 입력해 주세요 <span className="text-red-500">*</span>
                            {fieldValidation.productUrl === true && (
                                <span className="ml-2 text-green-500 text-sm">✓</span>
                            )}
                        </label>
                        <input
                            type="url"
                            value={formData.productUrl || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, productUrl: e.target.value }))}
                            onBlur={() => validateField('productUrl', formData.productUrl)}
                            placeholder="예시) https://smartstore.naver.com/"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldValidation.productUrl === true ? 'border-green-300' : 'border-gray-300'
                                }`}
                        />
                        <p className="mt-1 text-xs text-gray-500">https://로 시작하는 전체 URL을 입력해주세요</p>

                        {/* 링크 비공개 설정 */}
                        <div className="mt-3">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.productUrlPrivate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, productUrlPrivate: e.target.checked }))}
                                    className="mt-0.5 w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                        링크 비공개 설정
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">
                                        ℹ️ 링크는 체험 선정된 사람들에게만 보입니다.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* 상품명 */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            상품명 (체험 제품) <span className="text-red-500">*</span>
                            {fieldValidation.productName === true && (
                                <span className="ml-2 text-green-500 text-sm">✓</span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={formData.productName || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                            onBlur={() => validateField('productName', formData.productName)}
                            placeholder="예시) 다온뷰 최고급 세안밴드"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldValidation.productName === true ? 'border-green-300' : 'border-gray-300'
                                }`}
                        />
                        <p className="mt-1 text-xs text-gray-500">💡 체험 받으실 상품의 정확한 명칭을 입력해주세요.</p>
                    </div>
                </section>
            )}

            {/* 매장 정보 (방문체험단/기자단만) */}
            {(formData.campaignType === 'VISIT' || formData.campaignType === 'PRESS') && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        매장 정보 <span className="text-red-500">*</span>
                    </h2>

                    {/* 지역 설정 */}
                    <div className="mb-6 pb-6 border-b border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">지역 선택 (시/도)</label>
                        <div className="flex flex-wrap gap-2">
                            {['전국', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map((reg) => (
                                <button
                                    key={reg}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, region: reg }))}
                                    className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${formData.region === reg
                                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                                        }`}
                                >
                                    {reg}
                                </button>
                            ))}
                        </div>
                        <p className="mt-3 text-xs text-gray-400">
                            💡 매장 주소를 불러오면 지역이 자동으로 선택됩니다. 필요 시 직접 선택도 가능합니다.
                        </p>
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
                                onClick={() => {
                                    if (tempNaverUrl.trim()) {
                                        const newStore = {
                                            id: Date.now().toString(),
                                            naverPlaceUrl: tempNaverUrl,
                                            storeName: '',
                                            address: '',
                                        };
                                        setFormData(prev => ({
                                            ...prev,
                                            stores: [...prev.stores, newStore],
                                        }));
                                        fetchNaverPlaceInfo(tempNaverUrl, newStore.id);
                                        setTempNaverUrl('');
                                    }
                                }}
                                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
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
                            {formData.stores.map((store, index) => (
                                <div key={store.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900">매장 {index + 1}</h3>
                                        <button
                                            onClick={() => removeStore(store.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {store.storeName && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        상호명
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={store.storeName}
                                                        onChange={(e) => {
                                                            const newValue = e.target.value;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                stores: prev.stores.map(s => s.id === store.id ? { ...s, storeName: newValue } : s)
                                                            }));
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
                                                        value={store.address}
                                                        onChange={(e) => {
                                                            const newValue = e.target.value;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                stores: prev.stores.map(s => s.id === store.id ? { ...s, address: newValue } : s)
                                                            }));
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
                                                        value={store.naverPlaceUrl}
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600"
                                                    />
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

            {/* 제품/서비스 옵션 정보 (전체 타입 공통) */}
            {formData.campaignType && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">제공 옵션 설정</h2>
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
                                    <div className="w-32 text-center flex-shrink-0">제공 가액</div>
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
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Info size={16} className="text-blue-500" />
                            옵션 선택 규칙 설정
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">선택 모드</label>
                                <select
                                    value={formData.optionConfig.mode}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        optionConfig: {
                                            ...prev.optionConfig,
                                            mode: e.target.value as any,
                                            // 모드 변경 시 적절한 기본값 설정
                                            maxSelect: e.target.value === 'SINGLE' ? 1 : prev.optionConfig.maxSelect
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="SINGLE">단일 선택 (하나만 선택)</option>
                                    <option value="RANKED">지망 순위 선택 (1지망, 2지망...)</option>
                                    <option value="MULTI">다중 선택 (여러 개 체험)</option>
                                </select>
                            </div>
                            {formData.optionConfig.mode !== 'SINGLE' && (
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">최대 선택 가능 개수</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={formData.optionConfig.maxSelect}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                optionConfig: { ...prev.optionConfig, maxSelect: parseInt(e.target.value) || 1 }
                                            }))}
                                            min="1"
                                            max={formData.productOptions.length > 0 ? formData.productOptions.length : 10}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                        <span className="text-sm text-gray-600 whitespace-nowrap">개까지</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="mt-3 text-xs text-gray-500 italic">
                            {formData.optionConfig.mode === 'RANKED' && "💡 인플루언서가 우선순위를 정해서 신청할 수 있습니다."}
                            {formData.optionConfig.mode === 'MULTI' && "💡 인플루언서가 선택한 모든 옵션에 대해 당첨될 수 있습니다."}
                            {formData.optionConfig.mode === 'SINGLE' && "💡 가장 일반적인 방식으로, 인플루언서가 하나의 옵션만 선택하여 신청합니다."}
                        </p>
                    </div>
                </section>
            )}

            {/* 배송체험단 전용 추가 설정 (결제금액/쿠폰) */}
            {formData.campaignType === 'DELIVERY' && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">배송 추가 설정</h2>

                    {/* 상품 결제 금액 (옵션 없는 경우) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            상품 결제 금액(배송비 포함) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={formData.productPrice || ''}
                                onChange={(e) => handlePriceChange('productPrice', e.target.value)}
                                placeholder="0"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                            />
                            <span className="text-gray-600">원</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">자동으로 천 단위 콤마가 추가됩니다</p>
                        <p className="text-xs text-gray-500 mt-1">
                            * 옵션이 있는 경우 위 옵션별 금액을, 옵션이 없는 경우 이 금액을 사용합니다.
                        </p>
                    </div>

                    {/* 쿠폰 적용 가격인 경우 체크 */}
                    <div className="mb-4">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.freeShippingCondition}
                                onChange={(e) => setFormData(prev => ({ ...prev, freeShippingCondition: e.target.checked }))}
                                className="mt-1 w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                        쿠폰 적용 가격인 경우 체크해 주세요.
                                    </span>
                                    <div className="relative">
                                        <HelpCircle
                                            size={16}
                                            className="text-gray-400 hover:text-blue-500 cursor-help transition-colors"
                                            onMouseEnter={() => setShowCouponTooltip(true)}
                                            onMouseLeave={() => setShowCouponTooltip(false)}
                                        />
                                        {showCouponTooltip && (
                                            <div className="absolute left-0 top-6 z-10 w-96 p-3 bg-blue-50 rounded-lg border border-blue-200 shadow-lg">
                                                <p className="text-sm font-medium text-blue-900 mb-2">💡 쿠폰 할인가 적용 안내</p>
                                                <p className="text-xs text-blue-700 mb-2">
                                                    인플루언서가 쿠폰을 사용하여 할인된 가격으로 구매해야 한다면 이 옵션을 체크해 주세요.
                                                </p>
                                                <p className="text-xs text-blue-700 mb-2">
                                                    <strong>권장:</strong> 쿠폰 사용이 가능한 상품인 경우, 할인 적용 후 가격을 입력하고 체크하는 것이 좋습니다.
                                                </p>
                                                <p className="text-xs text-blue-700">
                                                    체크하지 않으면 '쿠폰 미사용'을 안내해 드리지만, 실제 사용 여부를 시스템에서 완벽하게 제한하기는 어렵습니다.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </label>
                    </div>
                </section>
            )}

            {/* 매장 정보 (방문체험단/기자단만) */}


            {/* 상세 정보 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">상세 정보</h2>



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
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            advertiserWillContact: e.target.checked,
                                            // 체크 시 연락처 필드 초기화
                                            contactPhone: e.target.checked ? '' : prev.contactPhone
                                        }))}
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
                                    <input
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
                                    {fieldValidation.contactPhone === false && (
                                        <p className="mt-1 text-sm text-red-600">올바른 전화번호 형식을 입력해주세요 (예: 010-1234-5678)</p>
                                    )}

                                    {/* 개인정보 보호 안내 */}
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <span className="text-green-600 text-lg">🔒</span>
                                            <div className="flex-1">
                                                <p className="text-xs text-green-800 font-medium">
                                                    연락처는 선정된 인플루언서에게만 공개됩니다. 개인정보 보호를 위해 선정 전에는 절대 공개되지 않습니다.
                                                </p>
                                            </div>
                                        </div>
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
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            visitTimeNegotiable: e.target.checked,
                                            // 체크 시 방문 시간 필드 초기화
                                            visitTime: e.target.checked ? '' : prev.visitTime
                                        }))}
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
                                type="text"
                                value={formData.visitTime || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, visitTime: e.target.value }))}
                                placeholder={formData.visitTimeNegotiable ? "예: 평일 11:00 - 21:00 (선택사항)" : "예: 평일 11:00 - 21:00"}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formData.visitTimeNegotiable ? 'border-gray-200 bg-gray-50' : 'border-gray-300'
                                    }`}
                                disabled={formData.visitTimeNegotiable}
                            />
                            {formData.visitTimeNegotiable && (
                                <p className="mt-1 text-xs text-gray-500">
                                    💡 조율 체크 시 방문 시간은 선택사항입니다. 선정 후 개별 연락을 통해 시간을 조정하세요.
                                </p>
                            )}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, visitNotes: e.target.value }))}
                                placeholder="주차 정보, 예약 필요 여부 등"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </>
                )}

                {/* 체험 제공 내역 */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        체험 제공 내역 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.experienceDetails || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, experienceDetails: e.target.value }))}
                        placeholder="예: 3만원 식사권 (추가 주문 발생 시 리뷰어 부담)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* 공식 판매가 */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        공식 판매가 <span className="text-gray-500 text-xs">(선택, 참고용)</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={formData.officialPrice || ''}
                            onChange={(e) => handlePriceChange('officialPrice', e.target.value)}
                            placeholder="30,000"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                        />
                        <span className="text-gray-600">원 상당</span>
                    </div>
                </div>
            </section>

            {/* 모집 정보 & 일정 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">모집 정보 & 일정</h2>

                {/* 가로 구분선 */}
                <div className="border-t border-gray-200 mb-6"></div>

                <div className="grid grid-cols-2 gap-8">
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
                                        type="number"
                                        value={formData.totalRecruitment || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, totalRecruitment: e.target.value }))}
                                        onBlur={() => validateField('totalRecruitment', formData.totalRecruitment)}
                                        placeholder="10"
                                        min="1"
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
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFormData(prev => ({ ...prev, totalRecruitment: '0' }))}
                                        className="h-11 px-3 text-muted-foreground active:scale-95 transition-transform"
                                    >
                                        초기화
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 미션 완료 리워드 */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700">
                                미션 완료 리워드 (1인당) <span className="text-muted-foreground font-normal">(선택)</span>
                            </label>

                            <div className="flex items-center gap-2">
                                <div className="relative flex-1 max-w-[200px]">
                                    <Input
                                        type="text"
                                        value={formData.rewardPerPerson.toLocaleString()}
                                        readOnly
                                        className="bg-muted font-bold text-lg h-11 text-right pr-12 focus-visible:ring-0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">포인트</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1 h-11 font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-none active:scale-95 transition-transform"
                                    onClick={() => adjustReward(5000)}
                                >
                                    + 5,000
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1 h-11 font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-none active:scale-95 transition-transform"
                                    onClick={() => adjustReward(10000)}
                                >
                                    + 10,000
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11 px-4 text-muted-foreground active:scale-95 transition-transform"
                                    onClick={() => setFormData(prev => ({ ...prev, rewardPerPerson: 0 }))}
                                >
                                    초기화
                                </Button>
                            </div>

                            <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                                <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-blue-700">
                                    참여자에게는 매칭 프로모션 서비스료 10%를 제외한 포인트가 지급됩니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 모집 일정 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar size={20} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-800">모집 일정</h3>
                        </div>

                        {/* 일정 타입 선택 */}
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="radio"
                                            name="scheduleType"
                                            checked={formData.scheduleType === 'recommended'}
                                            onChange={() => handleScheduleTypeChange('recommended')}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.scheduleType === 'recommended' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold ${formData.scheduleType === 'recommended' ? 'text-gray-900' : 'text-gray-500'}`}>추천 일정</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="radio"
                                            name="scheduleType"
                                            checked={formData.scheduleType === 'custom'}
                                            onChange={() => handleScheduleTypeChange('custom')}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.scheduleType === 'custom' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold ${formData.scheduleType === 'custom' ? 'text-gray-900' : 'text-gray-500'}`}>맞춤 설정</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="radio"
                                            name="scheduleType"
                                            checked={formData.scheduleType === 'always'}
                                            onChange={() => handleScheduleTypeChange('always')}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.scheduleType === 'always' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold ${formData.scheduleType === 'always' ? 'text-gray-900' : 'text-gray-500'}`}>상시 모집</span>
                                </label>
                            </div>

                            {/* 알림 메시지 */}
                            <div className={`p-4 rounded-xl border flex gap-3 transition-colors ${formData.scheduleType === 'always' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                <Info size={18} className="flex-shrink-0 mt-0.5" />
                                <p className="text-xs leading-relaxed font-bold">
                                    {formData.scheduleType === 'recommended' && "추천 일정: 최대한 빠르게 모집하여 선정되는 대로 즉시 투입하는 최적화된 모집 방식입니다."}
                                    {formData.scheduleType === 'custom' && "맞춤 설정: 캠페인 성격에 맞춰 모집, 선정, 리뷰 마감일을 수동으로 설정합니다."}
                                    {formData.scheduleType === 'always' && "상시 모집: 별도의 종료일 없이 캠페인을 중지하기 전까지 무기한으로 인원을 모집합니다."}
                                </p>
                            </div>
                        </div>

                        {/* 날짜 입력 섹션 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                    모집 시작일 <span className="text-rose-500">*</span>
                                    {formData.recruitmentStartDate && <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div>}
                                </label>
                                <div className="relative group">
                                    <input
                                        type="date"
                                        value={formData.recruitmentStartDate || ''}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, recruitmentStartDate: e.target.value }));
                                            validateField('recruitmentStartDate', e.target.value);
                                        }}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-10 hover:border-gray-300"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors pointer-events-none" size={18} />
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium pl-1">기본값: 내일 날짜</p>
                            </div>

                            {formData.scheduleType !== 'always' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                            선정 발표일 <span className="text-rose-500">*</span>
                                            {formData.firstSelectionDate && <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div>}
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="date"
                                                value={formData.firstSelectionDate || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, firstSelectionDate: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-10 hover:border-gray-300"
                                            />
                                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors pointer-events-none" size={18} />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2 text-blue-600 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <label className="text-sm font-black flex items-center gap-1.5">
                                            리뷰 마감일 <span className="text-rose-500">*</span>
                                            {formData.reviewDeadline && <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div>}
                                        </label>
                                        <div className="relative group mt-2">
                                            <input
                                                type="date"
                                                value={formData.reviewDeadline || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, reviewDeadline: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-10 hover:border-gray-300"
                                            />
                                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 group-hover:text-blue-600 transition-colors pointer-events-none" size={18} />
                                        </div>
                                        <p className="text-[10px] text-blue-400 font-bold pl-1 mt-1 flex items-center gap-1">✨ 선정일 기준 1주일 뒤로 설정하는 것을 권장합니다.</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {formData.scheduleType === 'custom' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        1차 선정 마감일
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="date"
                                            value={formData.firstSelectionDate || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, firstSelectionDate: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {/* 빠른 선택 버튼 */}
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFirstSelectionDateByWeeks(1)}
                                                className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                1주일 뒤
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFirstSelectionDateByWeeks(2)}
                                                className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                2주일 뒤
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        선정이 완료되지 않으면, 모집 기간이 자동으로 7일 연장됩니다.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        리뷰 제출 마감일
                                    </label>
                                    {formData.campaignType === 'DELIVERY' ? (
                                        <select
                                            value={formData.reviewDeadlineDays || '7'}
                                            onChange={(e) => setFormData(prev => ({ ...prev, reviewDeadlineDays: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="5">제품 배송 완료 후 5일 이내</option>
                                            <option value="7">제품 배송 완료 후 7일 이내</option>
                                            <option value="10">제품 배송 완료 후 10일 이내</option>
                                        </select>
                                    ) : (
                                        <input
                                            type="date"
                                            value={formData.reviewDeadline || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, reviewDeadline: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* 하단 버튼 */}
            <div className="flex justify-end gap-3">
                {onSaveDraft && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            onSaveDraft();
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Save size={18} />
                        임시저장
                    </button>
                )}
                <button
                    onClick={handleNext}
                    disabled={!isFormValid()}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all ${isFormValid()
                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    다음 단계로
                </button>
            </div>
        </div>
    );
}
