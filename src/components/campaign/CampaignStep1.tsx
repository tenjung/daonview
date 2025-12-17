'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, Plus, X, Info, HelpCircle, Users, Calendar, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Step1Data {
    campaignType: 'delivery' | 'visit' | 'press' | null;
    // 배송체험단용: 구매평, 네이버, 인스타 토글
    includeReview: boolean;
    includeNaver: boolean;
    includeInstagram: boolean;
    // 배송체험단 제품 정보
    productUrl: string;
    productUrlPrivate: boolean; // 링크 비공개 설정
    productName: string;
    productOptions: ProductOption[];
    productPrice: string;
    shippingCost: string;
    freeShippingCondition: boolean;
    // 방문/기자단용: 플랫폼 선택
    platform: 'naver' | 'instagram' | null;
    category?: string;  // 카테고리 (선택)
    region?: string;    // 지역 (방문형용, 선택)
    stores: Store[];
    contactPhone: string;
    visitTime: string;
    visitDays: string[];
    visitNotes: string;
    experienceDetails: string;
    officialPrice: string;
    totalRecruitment: string;
    rewardPerPerson: number;
    scheduleType: 'recommended' | 'custom';
    recruitmentStartDate: string;
    firstSelectionDate: string;
    reviewDeadline: string;
    reviewDeadlineDays: string; // 배송체험단용: 제품 배송 완료 후 며칠 이내
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
        productOptions: initialData?.productOptions || [],
        productPrice: initialData?.productPrice || '',
        shippingCost: initialData?.shippingCost || '',
        freeShippingCondition: initialData?.freeShippingCondition || false,
        platform: initialData?.platform || null,
        category: initialData?.category || '',
        region: initialData?.region || '',
        stores: initialData?.stores || [],
        contactPhone: initialData?.contactPhone || '',
        visitTime: initialData?.visitTime || '',
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
    });

    // 초기 데이터 로드 (임시저장 불러오기 시)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
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

    // 네이버 플레이스 정보 가져오기 (Mock - 실제로는 API 연동 필요)
    const fetchNaverPlaceInfo = async (url: string, storeId: string) => {
        // TODO: 실제 네이버 플레이스 API 연동
        // 임시로 더미 데이터 사용
        const mockData = {
            storeName: '테스트 매장',
            address: '서울특별시 강남구 테헤란로 123',
        };

        setFormData(prev => ({
            ...prev,
            stores: prev.stores.map(store =>
                store.id === storeId
                    ? { ...store, naverPlaceUrl: url, ...mockData }
                    : store
            ),
        }));
    };

    // 제품 옵션 추가
    const addProductOption = () => {
        const newOption: ProductOption = {
            id: Date.now().toString(),
            optionName: '',
            optionPrice: '',
            recruitmentCount: '',
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
        setFormData(prev => ({
            ...prev,
            productOptions: prev.productOptions.map(opt =>
                opt.id === id ? { ...opt, [field]: value } : opt
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

    // 배송체험단 플랫폼 토글
    const toggleDeliveryPlatform = (platform: 'review' | 'naver' | 'instagram') => {
        const { includeReview, includeNaver, includeInstagram } = formData;

        if (platform === 'review') {
            setFormData(prev => ({ ...prev, includeReview: !prev.includeReview }));
        } else if (platform === 'naver') {
            // 네이버를 추가하려는 경우
            if (!includeNaver) {
                // 이미 인스타가 선택되어 있으면 에러
                if (includeInstagram) {
                    toast.error('네이버와 인스타그램은 동시에 선택할 수 없습니다.\n인스타그램을 먼저 해제해주세요.');
                    return;
                }
            }
            setFormData(prev => ({ ...prev, includeNaver: !prev.includeNaver }));
        } else if (platform === 'instagram') {
            // 인스타를 추가하려는 경우
            if (!includeInstagram) {
                // 이미 네이버가 선택되어 있으면 에러
                if (includeNaver) {
                    toast.error('네이버와 인스타그램은 동시에 선택할 수 없습니다.\n네이버를 먼저 해제해주세요.');
                    return;
                }
            }
            setFormData(prev => ({ ...prev, includeInstagram: !prev.includeInstagram }));
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
                isValid = value && value.length >= 12; // 010-1234-5678 형식
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
        if (formData.campaignType === 'delivery') {
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
        if (formData.campaignType === 'visit' || formData.campaignType === 'press') {
            if (!formData.platform) return false;
            if (formData.stores.length === 0) return false;
            if (!formData.contactPhone || !formData.visitTime) return false;
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
        if (formData.campaignType === 'delivery') {
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
        if (formData.campaignType === 'visit' || formData.campaignType === 'press') {
            if (!formData.platform) {
                toast.error('플랫폼을 선택해주세요.');
                return;
            }
            if (formData.stores.length === 0) {
                toast.error('최소 1개의 매장을 추가해주세요.');
                return;
            }
            if (!formData.contactPhone) {
                toast.error('연락처를 입력해주세요.');
                return;
            }
            if (!formData.visitTime) {
                toast.error('방문 가능 시간을 입력해주세요.');
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

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">

            {/* 진행 유형 선택 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">진행 유형 선택</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 배송체험단 */}
                    <button
                        onClick={() => setFormData(prev => ({ ...prev, campaignType: 'delivery', platform: null }))}
                        className={`p-6 rounded-lg border-2 transition-all ${formData.campaignType === 'delivery'
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
                        onClick={() => setFormData(prev => ({ ...prev, campaignType: 'visit', includeReview: false, includeNaver: false, includeInstagram: false }))}
                        className={`p-6 rounded-lg border-2 transition-all ${formData.campaignType === 'visit'
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
                        onClick={() => setFormData(prev => ({ ...prev, campaignType: 'press', includeReview: false, includeNaver: false, includeInstagram: false }))}
                        className={`p-6 rounded-lg border-2 transition-all ${formData.campaignType === 'press'
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

            {/* 배송체험단 - 플랫폼 토글 선택 */}
            {formData.campaignType === 'delivery' && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">진행 방식 선택</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        원하는 플랫폼을 선택하세요. 구매평 단독, 네이버/인스타 단독, 또는 구매평+네이버/인스타 조합이 가능합니다.
                    </p>

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
                                            {formData.includeReview && !formData.includeNaver && !formData.includeInstagram && '5,000원'}
                                            {!formData.includeReview && (formData.includeNaver || formData.includeInstagram) && '5,000원'}
                                            {formData.includeReview && (formData.includeNaver || formData.includeInstagram) && '9,000원'}
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
            {formData.campaignType === 'delivery' && (
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
                            value={formData.productUrl}
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
                            상품명을 입력해 주세요 (모집글 제목에 사용) <span className="text-red-500">*</span>
                            {fieldValidation.productName === true && (
                                <span className="ml-2 text-green-500 text-sm">✓</span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={formData.productName}
                            onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                            onBlur={() => validateField('productName', formData.productName)}
                            placeholder="예시) 아이폰 14 Pro"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldValidation.productName === true ? 'border-green-300' : 'border-gray-300'
                                }`}
                        />
                    </div>

                    {/* 제공할 옵션 정보 */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                제공할 옵션 정보를 입력해 주세요
                            </label>
                            <button
                                onClick={addProductOption}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <Plus size={16} />
                                옵션 추가
                            </button>
                        </div>

                        {formData.productOptions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-sm">옵션이 없는 경우 추가하지 않아도 됩니다.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {formData.productOptions.map((option, index) => (
                                    <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-semibold text-gray-900">옵션 {index + 1}</h4>
                                            <button
                                                onClick={() => removeProductOption(option.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {/* 옵션 정보 */}
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">
                                                    옵션 정보 <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={option.optionName}
                                                    onChange={(e) => updateProductOption(option.id, 'optionName', e.target.value)}
                                                    placeholder="예시) 아이폰 14 Pro 블루 / 256GB"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                />
                                            </div>

                                            {/* 상품 결제 금액 */}
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">
                                                    상품 결제 금액(배송비 포함) <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        value={option.optionPrice}
                                                        onChange={(e) => updateProductOption(option.id, 'optionPrice', e.target.value)}
                                                        placeholder="0"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right"
                                                    />
                                                    <span className="text-sm text-gray-600">원</span>
                                                </div>
                                            </div>

                                            {/* 모집 인원 */}
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">
                                                    모집 인원 <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={option.recruitmentCount}
                                                        onChange={(e) => updateProductOption(option.id, 'recruitmentCount', e.target.value)}
                                                        placeholder="0"
                                                        min="1"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right"
                                                    />
                                                    <span className="text-sm text-gray-600">명</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 상품 결제 금액 (옵션 없는 경우) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            상품 결제 금액(배송비 포함) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={formData.productPrice}
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

            {/* 방문체험단/기자단 - 플랫폼 선택 */}
            {(formData.campaignType === 'visit' || formData.campaignType === 'press') && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">플랫폼 선택</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, platform: 'naver' }))}
                            className={`p-4 rounded-lg border-2 transition-all ${formData.platform === 'naver'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-green-300'
                                }`}
                        >
                            <h3 className="font-semibold mb-1">네이버 블로그</h3>
                            <p className="text-sm text-gray-600">네이버 블로그에 리뷰 작성</p>
                        </button>

                        <button
                            onClick={() => setFormData(prev => ({ ...prev, platform: 'instagram' }))}
                            className={`p-4 rounded-lg border-2 transition-all ${formData.platform === 'instagram'
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 hover:border-pink-300'
                                }`}
                        >
                            <h3 className="font-semibold mb-1">인스타그램</h3>
                            <p className="text-sm text-gray-600">인스타그램에 리뷰 작성</p>
                        </button>
                    </div>

                    {/* 선택된 플랫폼 및 진행비용 표시 */}
                    {formData.platform && (
                        <div className="mt-4">
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
                                        {formData.platform === 'naver' && (
                                            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                📗 네이버 블로그
                                            </span>
                                        )}
                                        {formData.platform === 'instagram' && (
                                            <span className="inline-flex items-center px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                                                📸 인스타그램
                                            </span>
                                        )}
                                    </div>

                                    {/* 진행비용 */}
                                    <div className="text-right ml-4">
                                        <p className="text-2xl font-bold text-blue-600">
                                            10,000원
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* 매장 정보 (방문체험단/기자단만) */}
            {(formData.campaignType === 'visit' || formData.campaignType === 'press') && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        매장 정보 <span className="text-red-500">*</span>
                    </h2>

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
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        주소
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={store.address}
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
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

            {/* 상세 정보 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">상세 정보</h2>



                {formData.campaignType !== 'delivery' && (
                    <>
                        {/* 담당자 연락처 */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                담당자 연락처 <span className="text-red-500">*</span>
                                {fieldValidation.contactPhone === true && (
                                    <span className="ml-2 text-green-500 text-sm">✓</span>
                                )}
                                {fieldValidation.contactPhone === false && (
                                    <span className="ml-2 text-red-500 text-sm">✗</span>
                                )}
                            </label>
                            <input
                                type="tel"
                                value={formData.contactPhone}
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
                        </div>
                        {/* 방문 가능 시간 */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                방문 가능 시간 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.visitTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, visitTime: e.target.value }))}
                                placeholder="예: 평일 11:00 - 21:00"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
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
                                value={formData.visitNotes}
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
                        value={formData.experienceDetails}
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
                            value={formData.officialPrice}
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                전체 모집 인원 <span className="text-red-500">*</span>
                                {fieldValidation.totalRecruitment === true && (
                                    <span className="ml-2 text-green-500 text-sm">✓</span>
                                )}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={formData.totalRecruitment}
                                    onChange={(e) => setFormData(prev => ({ ...prev, totalRecruitment: e.target.value }))}
                                    onBlur={() => validateField('totalRecruitment', formData.totalRecruitment)}
                                    placeholder="10"
                                    min="1"
                                    className={`w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${fieldValidation.totalRecruitment === true ? 'border-green-300' : 'border-gray-300'
                                        }`}
                                />
                                <span className="text-gray-600">명</span>
                            </div>
                        </div>

                        {/* 미션 완료 리워드 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                미션 완료 리워드 (1인당) <span className="text-gray-500 text-xs">(선택)</span>
                            </label>

                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="text"
                                    value={formData.rewardPerPerson.toLocaleString()}
                                    readOnly
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-right font-semibold"
                                />
                                <span className="text-gray-600">포인트</span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => adjustReward(5000)}
                                    className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                                >
                                    + 5,000
                                </button>
                                <button
                                    type="button"
                                    onClick={() => adjustReward(10000)}
                                    className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                                >
                                    + 10,000
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, rewardPerPerson: 0 }))}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    초기화
                                </button>
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
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={formData.scheduleType === 'recommended'}
                                        onChange={() => setFormData(prev => ({ ...prev, scheduleType: 'recommended' }))}
                                        className="w-4 h-4 text-blue-500"
                                    />
                                    <span className="font-medium">추천 일정</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={formData.scheduleType === 'custom'}
                                        onChange={() => setFormData(prev => ({ ...prev, scheduleType: 'custom' }))}
                                        className="w-4 h-4 text-blue-500"
                                    />
                                    <span className="font-medium">맞춤 설정</span>
                                </label>
                            </div>

                            {/* 추천 일정 설명 */}
                            {formData.scheduleType === 'recommended' && (
                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                                    <Info size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-amber-800">
                                        <strong>추천 일정:</strong> 최대한 빠르게 모집하여 선정되는 대로 즉시 투입하는 최적화된 모집 방식입니다.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 모집 시작일 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                모집 시작일 <span className="text-red-500">*</span>
                                {fieldValidation.recruitmentStartDate === true && (
                                    <span className="ml-2 text-green-500 text-sm">✓</span>
                                )}
                            </label>
                            <input
                                type="date"
                                value={formData.recruitmentStartDate}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, recruitmentStartDate: e.target.value }));
                                    validateField('recruitmentStartDate', e.target.value);
                                }}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldValidation.recruitmentStartDate === true ? 'border-green-300' : 'border-gray-300'
                                    }`}
                            />
                            <p className="mt-1 text-xs text-gray-500">기본값: 내일 날짜</p>
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
                                            value={formData.firstSelectionDate}
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
                                    {formData.campaignType === 'delivery' ? (
                                        <select
                                            value={formData.reviewDeadlineDays}
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
                                            value={formData.reviewDeadline}
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
                        onClick={onSaveDraft}
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
        </div >
    );
}
