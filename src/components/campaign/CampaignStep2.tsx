'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Upload, X, Image as ImageIcon, Hash, MapPin, Link as LinkIcon, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

// Step1Data 인터페이스 (Step1에서 전달받는 데이터)
interface Step1Data {
    campaignType: 'DELIVERY' | 'VISIT' | 'PRESS' | null;
    includeReview: boolean;
    includeNaver: boolean;
    includeInstagram: boolean;
    productUrl: string;
    productName: string;
    campaignTitle: string; 
    platform: 'BLOG' | 'INSTAGRAM' | null;
    stores?: { storeName: string; address?: string; naverPlaceUrl?: string; }[];
    region?: string;
    category?: string;
}

interface Step2Data {
    campaignTitle: string;
    campaignImages: string[];

    // 구매평 가이드 (Shopping Mall Review)
    purchaseLink: string;
    purchaseOption: string;
    paybackAmount: string;
    purchaseNotes: string;
    reviewMissionContent: string;

    // 공통 리뷰 가이드
    textLength: 'free' | 'short' | 'medium' | 'long' | 'custom';
    photoCount: '1' | '3' | '5' | 'none';
    videoRequired: 'yes' | 'no';
    missionGuide: string;
    keywords: string[];
    prohibitedWords: string[];
    additionalNotes: string;

    // 블로그 가이드 (Blog)
    blogMainKeyword: string;
    blogSubKeywords: string[];
    blogTitleGuide: string;
    blogContentGuide: string;
    blogMapRequired: boolean;
    blogRequiredLinks: string[];

    // 인스타그램 가이드 (Instagram)
    instagramHashtags: string[];
    instagramAccountTag: string;
    instagramPhotoGuide: string;
    instagramReelsRequired: boolean;
}

interface CampaignStep2Props {
    onNext: (data: Step2Data) => void;
    onPrev: () => void;
    onSaveDraft?: () => void;
    onChange?: (data: Step2Data) => void;
    initialData?: Partial<Step2Data>;
    step1Data: Step1Data; // Step 1 데이터 추가
    isEdit?: boolean;
}

export default function CampaignStep2({ onNext, onPrev, onSaveDraft, onChange, initialData, step1Data, isEdit }: CampaignStep2Props) {
    const [formData, setFormData] = useState<Step2Data>({
        campaignTitle: initialData?.campaignTitle || step1Data.campaignTitle || '',
        campaignImages: initialData?.campaignImages || [],

        // 구매평 가이드
        purchaseLink: initialData?.purchaseLink || step1Data.productUrl || '',
        purchaseOption: initialData?.purchaseOption || '',
        paybackAmount: initialData?.paybackAmount || '',
        purchaseNotes: initialData?.purchaseNotes || '',
        reviewMissionContent: initialData?.reviewMissionContent || '',

        // 공통 리뷰 가이드
        textLength: initialData?.textLength || 'free',
        photoCount: initialData?.photoCount || '3',
        videoRequired: initialData?.videoRequired || 'no',
        missionGuide: initialData?.missionGuide || '',
        keywords: initialData?.keywords || [],
        prohibitedWords: initialData?.prohibitedWords || [],
        additionalNotes: initialData?.additionalNotes || '',

        // 블로그 가이드
        blogMainKeyword: initialData?.blogMainKeyword || '',
        blogSubKeywords: initialData?.blogSubKeywords || [],
        blogTitleGuide: initialData?.blogTitleGuide || '',
        blogContentGuide: initialData?.blogContentGuide || '',
        // 방문체험단/기자단의 경우 지도 삽입 기본값 true
        blogMapRequired: initialData?.blogMapRequired ?? (step1Data.campaignType === 'VISIT' || step1Data.campaignType === 'PRESS'),
        blogRequiredLinks: initialData?.blogRequiredLinks || [],

        // 인스타그램 가이드
        instagramHashtags: initialData?.instagramHashtags || [],
        instagramAccountTag: initialData?.instagramAccountTag || '',
        instagramPhotoGuide: initialData?.instagramPhotoGuide || '',
        instagramReelsRequired: initialData?.instagramReelsRequired || false,
    });


    // 초기 데이터 로드 (임시저장 불러오기 시)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => {
                // null 값을 제거하여 state의 기본값이 유지되도록 함
                const sanitizedInitial = { ...initialData };
                Object.keys(sanitizedInitial).forEach(key => {
                    if ((sanitizedInitial as any)[key] === null) {
                        delete (sanitizedInitial as any)[key];
                    }
                });

                return {
                    ...prev,
                    ...sanitizedInitial,
                    campaignTitle: initialData.campaignTitle || prev.campaignTitle || step1Data.campaignTitle || '',
                };
            });
        }
    }, [initialData, step1Data.campaignTitle]);

    // 실시간 데이터 변경 알림 (임시저장 연동용)
    useEffect(() => {
        if (onChange) {
            onChange(formData);
        }
    }, [formData, onChange]);

    const [keywordInput, setKeywordInput] = useState('');
    const [prohibitedInput, setProhibitedInput] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadLater, setUploadLater] = useState(false);

    // 블로그 관련 입력 상태
    const [blogSubKeywordInput, setBlogSubKeywordInput] = useState('');
    const [blogLinkInput, setBlogLinkInput] = useState('');

    // 인스타그램 관련 입력 상태
    const [instagramHashtagInput, setInstagramHashtagInput] = useState('');

    // AI 추천 키워드 생성 로직
    const [recommendedKeywords, setRecommendedKeywords] = useState<string[]>([]);
    const [recommendedSubKeywords, setRecommendedSubKeywords] = useState<string[]>([]);
    const [recommendedInstagramHashtags, setRecommendedInstagramHashtags] = useState<string[]>([]);
    const [recommendedGeneralKeywords, setRecommendedGeneralKeywords] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const fetchAIKeywords = async () => {
            if (!step1Data.productName && !step1Data.stores?.[0]?.storeName) return;
            
            setIsAnalyzing(true);
            try {
                const response = await fetch('/api/campaign/ai-keywords', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        region: step1Data.region,
                        storeName: step1Data.stores?.[0]?.storeName,
                        productName: step1Data.productName,
                        campaignType: step1Data.campaignType,
                        category: step1Data.category
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setRecommendedKeywords(data.mainKeywords || []);
                    setRecommendedSubKeywords(data.subKeywords || []);
                    setRecommendedInstagramHashtags(data.hashtags || []);
                    setRecommendedGeneralKeywords([...(data.mainKeywords || []), ...(data.subKeywords || [])].slice(0, 10));
                }
            } catch (error) {
                console.error('Failed to fetch AI keywords:', error);
            } finally {
                setIsAnalyzing(false);
            }
        };

        fetchAIKeywords();
    }, [step1Data.productName, step1Data.region, step1Data.campaignType]);

    // 이미지 업로드 핸들러
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // 먼저 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            toast.error('로그인이 필요한 서비스입니다. 다시 로그인해주세요.');
            return;
        }

        const remainingSlots = 4 - formData.campaignImages.length;
        if (remainingSlots <= 0) {
            toast.error('최대 4개의 이미지만 업로드 가능합니다.');
            return;
        }

        setUploadingImage(true);
        const newImages: string[] = [];
        const filesToUpload = Math.min(files.length, remainingSlots);

        try {
            for (let i = 0; i < filesToUpload; i++) {
                const file = files[i];
                // 파일 확장자 보안 체크
                const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
                const fileExt = file.name.split('.').pop()?.toLowerCase();

                if (!fileExt || !allowedExtensions.includes(fileExt)) {
                    toast.error(`허용되지 않는 파일 형식입니다: ${file.name}`);
                    continue;
                }

                // 파일명 안전하게 변환
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
                const filePath = fileName; // 'campaigns/' 폴더 경로 제거

                console.log(`Uploading file: ${filePath}`);

                // Supabase Storage에 업로드
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('campaign-images')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('이미지 업로드 상세 에러:', uploadError);

                    if (uploadError.message.includes('bucket not found') || uploadError.message.includes('does not exist')) {
                        toast.error('스토리지 버킷이 존재하지 않습니다. 관리자에게 문의하세요.');
                    } else if (uploadError.message.includes('permission denied') || (uploadError as any).status === 403) {
                        toast.error('이미지 업로드 권한이 없습니다. (RLS 설정 확인 필요)');
                    } else {
                        toast.error(`이미지 업로드 실패: ${uploadError.message}`);
                    }
                    continue;
                }

                // Public URL 가져오기
                const { data: { publicUrl } } = supabase.storage
                    .from('campaign-images')
                    .getPublicUrl(filePath);

                newImages.push(publicUrl);
            }

            if (newImages.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    campaignImages: [...prev.campaignImages, ...newImages],
                }));
                toast.success(`${newImages.length}개의 이미지가 업로드되었습니다.`);
            }
        } catch (error: any) {
            console.error('이미지 처리 중 치명적 오류:', error);
            toast.error(`이미지 처리 중 오류 발생: ${error.message || '알 수 없는 오류'}`);
        } finally {
            setUploadingImage(false);
            if (e.target) e.target.value = '';
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            campaignImages: prev.campaignImages.filter((_, i) => i !== index),
        }));
    };

    // 키워드 관련 함수
    const addKeyword = () => {
        if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
            setFormData(prev => ({
                ...prev,
                keywords: [...prev.keywords, keywordInput.trim()],
            }));
            setKeywordInput('');
        }
    };

    const removeKeyword = (keyword: string) => {
        setFormData(prev => ({
            ...prev,
            keywords: prev.keywords.filter(k => k !== keyword),
        }));
    };

    const addProhibited = () => {
        if (prohibitedInput.trim() && !formData.prohibitedWords.includes(prohibitedInput.trim())) {
            setFormData(prev => ({
                ...prev,
                prohibitedWords: [...prev.prohibitedWords, prohibitedInput.trim()],
            }));
            setProhibitedInput('');
        }
    };

    const removeProhibited = (word: string) => {
        setFormData(prev => ({
            ...prev,
            prohibitedWords: prev.prohibitedWords.filter(w => w !== word),
        }));
    };

    // 블로그 관련 함수
    const addBlogSubKeyword = () => {
        if (blogSubKeywordInput.trim() && !formData.blogSubKeywords.includes(blogSubKeywordInput.trim())) {
            setFormData(prev => ({
                ...prev,
                blogSubKeywords: [...prev.blogSubKeywords, blogSubKeywordInput.trim()],
            }));
            setBlogSubKeywordInput('');
        }
    };

    const removeBlogSubKeyword = (keyword: string) => {
        setFormData(prev => ({
            ...prev,
            blogSubKeywords: prev.blogSubKeywords.filter(k => k !== keyword),
        }));
    };

    const addBlogLink = () => {
        if (blogLinkInput.trim() && !formData.blogRequiredLinks.includes(blogLinkInput.trim())) {
            setFormData(prev => ({
                ...prev,
                blogRequiredLinks: [...prev.blogRequiredLinks, blogLinkInput.trim()],
            }));
            setBlogLinkInput('');
        }
    };

    const removeBlogLink = (link: string) => {
        setFormData(prev => ({
            ...prev,
            blogRequiredLinks: prev.blogRequiredLinks.filter(l => l !== link),
        }));
    };

    // 인스타그램 관련 함수
    const addInstagramHashtag = () => {
        let hashtag = instagramHashtagInput.trim();
        if (!hashtag) return;

        // 자동으로 # 추가
        if (!hashtag.startsWith('#')) {
            hashtag = '#' + hashtag;
        }

        if (!formData.instagramHashtags.includes(hashtag)) {
            setFormData(prev => ({
                ...prev,
                instagramHashtags: [...prev.instagramHashtags, hashtag],
            }));
            setInstagramHashtagInput('');
        }
    };

    const removeInstagramHashtag = (hashtag: string) => {
        setFormData(prev => ({
            ...prev,
            instagramHashtags: prev.instagramHashtags.filter(h => h !== hashtag),
        }));
    };

    // 폼 유효성 검사
    const isFormValid = () => {
        if (!formData.campaignTitle.trim()) return false;
        if (!uploadLater && formData.campaignImages.length === 0) return false;

        // 배송체험단인 경우 구매평 필드 검증
        if (step1Data.campaignType === 'DELIVERY' && step1Data.includeReview) {
            if (!formData.purchaseLink.trim()) return false;
        }

        // 블로그 선택 시 메인 키워드 필수
        if (step1Data.includeNaver && !formData.blogMainKeyword.trim()) {
            return false;
        }

        // 배송체험단 + 블로그: 쇼핑몰 링크 삽입 필수
        if (step1Data.campaignType === 'DELIVERY' && step1Data.includeNaver) {
            if (formData.blogRequiredLinks.length === 0) {
                return false;
            }
        }

        return true;
    };

    const handleNext = () => {
        if (isFormValid()) {
            onNext(formData);
        } else {
            toast.error('필수 항목을 모두 입력해주세요.');
        }
    };

    // 배송체험단 여부 확인
    const isDeliveryCampaign = step1Data.campaignType === 'DELIVERY';
    const isVisitOrPressCampaign = step1Data.campaignType === 'VISIT' || step1Data.campaignType === 'PRESS';

    // 구매평 가이드: 배송체험단 + 구매평 선택 시
    const showReviewGuide = isDeliveryCampaign && step1Data.includeReview;

    // 블로그 가이드: 배송체험단(includeNaver) 또는 방문/기자단(platform=BLOG)
    const showBlogGuide = step1Data.includeNaver || (isVisitOrPressCampaign && step1Data.platform === 'BLOG');

    // 인스타그램 가이드: 배송체험단(includeInstagram) 또는 방문/기자단(platform=INSTAGRAM)
    const showInstagramGuide = step1Data.includeInstagram || (isVisitOrPressCampaign && step1Data.platform === 'INSTAGRAM');

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">

            {/* 캠페인 제목 */}
            {/* 캠페인 제목 (읽기 전용) */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 bg-gray-50/30">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">캠페인 제목 (모집글 제목)</h2>
                    <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full uppercase">Step 1 완료</span>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        value={step1Data.campaignTitle || ''}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-lg font-medium"
                    />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    💡 캠페인 제목은 1단계에서 확인 및 수정이 가능합니다.
                </p>
            </section>

            {/* 캠페인 이미지 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        캠페인 이미지 {!uploadLater && <span className="text-red-500">*</span>}
                    </h2>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={uploadLater}
                            onChange={(e) => setUploadLater(e.target.checked)}
                            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">나중에 업로드하기</span>
                    </label>
                </div>

                {uploadLater ? (
                    <div className="p-6 bg-amber-50 rounded-lg border border-amber-200 text-center">
                        <ImageIcon size={48} className="mx-auto text-amber-600 mb-3" />
                        <p className="text-amber-900 font-medium mb-1">이미지를 나중에 업로드합니다</p>
                        <p className="text-sm text-amber-700">
                            캠페인 등록 후 관리자 페이지에서 이미지를 추가할 수 있습니다.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {/* 대표 이미지 (Slot 0) */}
                            <div className="space-y-1.5">
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-tight text-center">대표 이미지</h3>
                                {formData.campaignImages[0] ? (
                                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-500 group shadow-sm">
                                        <img src={formData.campaignImages[0]} alt="대표" className="w-full h-full object-cover" />
                                        <button onClick={() => removeImage(0)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                    </div>
                                ) : (
                                    <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors bg-gray-50/50">
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                        <Upload className="text-gray-300" size={20} />
                                        <span className="text-[10px] font-bold text-gray-400">대표</span>
                                    </label>
                                )}
                            </div>

                            {/* 상세 이미지 슬롯 1, 2, 3 */}
                            {[1, 2, 3].map((idx) => (
                                <div key={idx} className="space-y-1.5">
                                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-tight text-center">이미지 {idx}</h3>
                                    {formData.campaignImages[idx] ? (
                                        <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group shadow-sm">
                                            <img src={formData.campaignImages[idx]} alt={`상세${idx}`} className="w-full h-full object-cover" />
                                            <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                        </div>
                                    ) : (
                                        <label className={`aspect-square rounded-lg border-2 border-dashed border-gray-100 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors ${!formData.campaignImages[0] ? 'opacity-30 cursor-not-allowed' : ''}`}>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={!formData.campaignImages[0]} />
                                            <Upload className="text-gray-200" size={18} />
                                            <span className="text-[10px] font-medium text-gray-300">추가</span>
                                        </label>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 상세 이미지 추가 버튼 */}
                        {formData.campaignImages.length > 0 && formData.campaignImages.length < 4 && (
                            <button
                                onClick={() => document.getElementById('add-detail-image')?.click()}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Upload size={20} />
                                <span className="font-medium">상세 이미지 추가 (최대 3개)</span>
                                <input
                                    id="add-detail-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </button>
                        )}

                        <p className="mt-3 text-xs text-gray-500 text-center">
                            💡 대표 이미지 1개 + 상세 이미지 최대 3개 (총 4개)까지 업로드 가능합니다.
                        </p>
                    </>
                )}
            </section>

            {/* ========== Section A: 구매평 미션 가이드 (배송체험단 + 구매평 선택 시) ========== */}
            {showReviewGuide && (
                <section className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-3xl">🛒</div>
                        <h2 className="text-2xl font-bold text-gray-900">구매평 미션 가이드</h2>
                    </div>

                    <div className="h-px bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 mb-6"></div>

                    {/* 구매 링크 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            구매 링크 (URL) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={formData.purchaseLink || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, purchaseLink: e.target.value }))}
                            placeholder="리뷰어가 구매할 페이지 URL"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Step 1에서 입력한 상품 링크가 자동으로 채워집니다.
                        </p>
                    </div>

                    {/* 구매 옵션/키워드 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            구매 옵션/키워드
                        </label>
                        <input
                            type="text"
                            value={formData.purchaseOption || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, purchaseOption: e.target.value }))}
                            placeholder='예: 검색창에 "무설탕" 검색 후 3번째 상품 클릭'
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 페이백 금액 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            페이백 금액
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={formData.paybackAmount || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, paybackAmount: e.target.value }))}
                                placeholder="0"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                            />
                            <span className="text-gray-600 font-medium">원</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            💡 리뷰어에게 돌려줄 금액 (자동 계산 추천)
                        </p>
                    </div>

                    {/* 구매 시 주의사항 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            구매 시 주의사항
                        </label>
                        <textarea
                            value={formData.purchaseNotes || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, purchaseNotes: e.target.value }))}
                            placeholder="예: 비공개 요청, 쿠폰 사용 금지 등"
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 미션 내용 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            미션 내용
                        </label>
                        <textarea
                            value={formData.reviewMissionContent || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, reviewMissionContent: e.target.value }))}
                            placeholder='예: "찜하기 필수", "포토리뷰 필수"'
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 필수 키워드 (구매평 전용) */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                            <Check size={16} className="text-blue-600" />
                            리뷰 필수 포함 키워드
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                                placeholder="키워드 입력 후 Enter"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={addKeyword}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                추가
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.keywords.map((keyword, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                                >
                                    #{keyword}
                                    <button
                                        onClick={() => removeKeyword(keyword)}
                                        className="hover:text-blue-900"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* 구분선 */}
                    <div className="h-px bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 my-8"></div>

                    {/* 리뷰 작성 가이드 */}
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📝 리뷰 작성 가이드</h3>

                    {/* 글자 수 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            글자 수 (택1)
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { value: 'free', label: '자유' },
                                { value: 'short', label: '20자 내외 간단히' },
                                { value: 'medium', label: '150자 내외' },
                                { value: 'long', label: '300자 이상' },
                                { value: 'custom', label: '가이드에 직접 작성' },
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-all ${formData.textLength === option.value
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-blue-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="textLength"
                                        value={option.value}
                                        checked={formData.textLength === option.value}
                                        onChange={(e) => setFormData(prev => ({ ...prev, textLength: e.target.value as any }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-medium">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 사진 업로드 조건 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            📷 사진 업로드 조건
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { value: '1', label: '1장' },
                                { value: '3', label: '3장' },
                                { value: '5', label: '5장' },
                                { value: 'none', label: '사진 미포함' },
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-all ${formData.photoCount === option.value
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-blue-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="photoCount"
                                        value={option.value}
                                        checked={formData.photoCount === option.value}
                                        onChange={(e) => setFormData(prev => ({ ...prev, photoCount: e.target.value as any }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-medium">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 동영상 포함 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            🎥 동영상 포함
                        </label>
                        <div className="flex gap-3">
                            {[
                                { value: 'yes', label: '포함' },
                                { value: 'no', label: '미포함' },
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-all ${formData.videoRequired === option.value
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-blue-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="videoRequired"
                                        value={option.value}
                                        checked={formData.videoRequired === option.value}
                                        onChange={(e) => setFormData(prev => ({ ...prev, videoRequired: e.target.value as any }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-medium">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 작성 가이드 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            ✍️ 작성 가이드 (선택)
                        </label>
                        <textarea
                            value={formData.missionGuide || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, missionGuide: e.target.value }))}
                            placeholder="자유롭게 작성해주세요"
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 경제적 대가 고지 */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h3 className="text-sm font-bold text-amber-900 mb-2">⚠️ 경제적 대가 고지 문구</h3>
                        <p className="text-sm text-amber-800 leading-relaxed">
                            공정위 문구 게재 법에 따라 필수 포함되어야 하며, <strong>"협찬"</strong> 문구 없이 진행 시 발생하는 문제의 책임은 이용자에게 있습니다.
                        </p>
                    </div>
                </section>
            )}

            {/* ========== Section B-1: 블로그 포스팅 가이드 (네이버 선택 시) ========== */}
            {showBlogGuide && (
                <section className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-3xl">📝</div>
                        <h2 className="text-2xl font-bold text-gray-900">블로그 리뷰 미션</h2>
                    </div>

                    <div className="h-px bg-gradient-to-r from-green-200 via-green-300 to-green-200 mb-6"></div>

                    {/* 메인 키워드 */}
                    <div className="mb-6">
                        <label className="block text-sm font-black text-gray-700 mb-2 flex items-center gap-1.5">
                            <Check size={16} className="text-green-600" />
                            메인 필수 키워드 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.blogMainKeyword || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, blogMainKeyword: e.target.value }))}
                            placeholder="예: 강남 맛집, 역삼동 카페"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-bold text-green-700"
                        />
                        
                        {/* AI 추천 메인 키워드 */}
                        {isAnalyzing ? (
                            <div className="mt-3 animate-pulse">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                    <div className="h-3 w-32 bg-gray-200 rounded"></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-8 w-20 bg-gray-100 rounded-lg"></div>
                                    <div className="h-8 w-24 bg-gray-100 rounded-lg"></div>
                                </div>
                            </div>
                        ) : recommendedKeywords.length > 0 && (
                            <div className="mt-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] text-white font-bold">AI</div>
                                    <span className="text-xs font-bold text-indigo-600">다온 AI 추천 메인 키워드</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recommendedKeywords.map((kw, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setFormData(prev => ({ ...prev, blogMainKeyword: kw }))}
                                            className="group relative px-3 py-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 shadow-sm overflow-hidden"
                                        >
                                            <span className="relative z-10 flex items-center gap-1">
                                                <span className="text-indigo-400 group-hover:text-indigo-600 transition-colors">+</span> {kw}
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="mt-2 text-xs text-gray-500">
                            상위 노출을 목표로 하는 키워드를 입력하세요.
                        </p>
                    </div>

                    {/* 서브 키워드 */}
                    <div className="mb-6">
                        <label className="block text-sm font-black text-gray-700 mb-2 flex items-center gap-1.5">
                            <Check size={16} className="text-green-600" />
                            서브 필수 키워드
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={blogSubKeywordInput}
                                onChange={(e) => setBlogSubKeywordInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addBlogSubKeyword()}
                                placeholder="본문에 포함할 단어 입력 후 Enter"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <button
                                onClick={addBlogSubKeyword}
                                className="px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
                            >
                                추가
                            </button>
                        </div>

                        {/* AI 추천 서브 키워드 */}
                        {isAnalyzing ? (
                             <div className="mb-4 animate-pulse">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                    <div className="h-3 w-32 bg-gray-200 rounded"></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-8 w-20 bg-gray-100 rounded-lg"></div>
                                    <div className="h-8 w-24 bg-gray-100 rounded-lg"></div>
                                </div>
                            </div>
                        ) : recommendedSubKeywords.length > 0 && (
                            <div className="mb-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] text-white font-bold">AI</div>
                                    <span className="text-xs font-bold text-emerald-600">다온 AI 추천 서브 키워드</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recommendedSubKeywords.map((kw, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (!formData.blogSubKeywords.includes(kw)) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        blogSubKeywords: [...prev.blogSubKeywords, kw]
                                                    }));
                                                }
                                            }}
                                            className="group relative px-3 py-1.5 bg-white text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 shadow-sm overflow-hidden"
                                        >
                                            <span className="relative z-10 flex items-center gap-1">
                                                <span className="text-emerald-400 group-hover:text-emerald-600 transition-colors">+</span> {kw}
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {formData.blogSubKeywords.map((keyword, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                                >
                                    {keyword}
                                    <button
                                        onClick={() => removeBlogSubKeyword(keyword)}
                                        className="hover:text-green-900"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* 제목 가이드 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            제목 가이드
                        </label>
                        <input
                            type="text"
                            value={formData.blogTitleGuide || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, blogTitleGuide: e.target.value }))}
                            placeholder="예: 키워드를 제목 앞부분에 배치해주세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    {/* 본문 작성 가이드 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            본문 작성 가이드
                        </label>
                        <textarea
                            value={formData.blogContentGuide || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, blogContentGuide: e.target.value }))}
                            placeholder="예: 제품 사용 후기를 상세하게 작성해주세요. 장점과 단점을 균형있게 서술하고, 실제 사용 사진을 포함해주세요."
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:green-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            블로그 본문 작성 시 리뷰어가 따라야 할 가이드를 자유롭게 작성해주세요.
                        </p>
                    </div>

                    {/* 지도 삽입 여부 - 방문체험단/기자단만 표시 */}
                    {(step1Data.campaignType === 'VISIT' || step1Data.campaignType === 'PRESS') && (
                        <div className="mb-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.blogMapRequired}
                                    onChange={(e) => setFormData(prev => ({ ...prev, blogMapRequired: e.target.checked }))}
                                    className="w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                                />
                                <div className="flex items-center gap-2">
                                    <MapPin size={20} className="text-green-600" />
                                    <span className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                                        지도 삽입
                                    </span>
                                </div>
                            </label>
                            <p className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                                💡 방문체험단/기자단은 지도 삽입을 권장합니다. (웹서비스 기자단 등은 제외 가능)
                            </p>
                        </div>
                    )}

                    {/* 필수 삽입 링크 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <LinkIcon size={16} className="inline mr-1" />
                            필수 삽입 링크
                            {step1Data.campaignType === 'DELIVERY' && (
                                <span className="text-red-500 ml-1">*</span>
                            )}
                        </label>
                        {step1Data.campaignType === 'DELIVERY' && (
                            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mb-3">
                                ℹ️ 배송체험단은 쇼핑몰 링크를 최소 1개 이상 추가해야 합니다.
                            </p>
                        )}
                        <div className="flex gap-2 mb-3">
                            <input
                                type="url"
                                value={blogLinkInput}
                                onChange={(e) => setBlogLinkInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addBlogLink()}
                                placeholder={step1Data.campaignType === 'DELIVERY' ? "쇼핑몰 링크 입력 후 Enter" : "스마트플레이스, 예약 링크 등 입력 후 Enter"}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <button
                                onClick={addBlogLink}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                추가
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.blogRequiredLinks.map((link, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg"
                                >
                                    <LinkIcon size={16} className="text-green-600 flex-shrink-0" />
                                    <span className="flex-1 text-sm text-green-800 truncate">{link}</span>
                                    <button
                                        onClick={() => removeBlogLink(link)}
                                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ========== Section B-2: 인스타그램 포스팅 가이드 (인스타 선택 시) ========== */}
            {showInstagramGuide && (
                <section className="bg-white rounded-xl shadow-sm border-2 border-pink-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-3xl">📸</div>
                        <h2 className="text-2xl font-bold text-gray-900">인스타그램 리뷰 미션</h2>
                    </div>

                    <div className="h-px bg-gradient-to-r from-pink-200 via-pink-300 to-pink-200 mb-6"></div>

                    {/* 필수 해시태그 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            필수 해시태그
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={instagramHashtagInput}
                                onChange={(e) => setInstagramHashtagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addInstagramHashtag()}
                                placeholder="예: 맛집, OO동카페 (자동으로 #이 붙습니다)"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                            <button
                                onClick={addInstagramHashtag}
                                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                            >
                                추가
                            </button>
                        </div>

                        {/* AI 추천 인스타그램 해시태그 */}
                        {isAnalyzing ? (
                            <div className="mb-4 animate-pulse">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                    <div className="h-3 w-32 bg-gray-200 rounded"></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-8 w-20 bg-gray-100 rounded-lg"></div>
                                    <div className="h-8 w-24 bg-gray-100 rounded-lg"></div>
                                </div>
                            </div>
                        ) : recommendedInstagramHashtags.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-[10px] text-white font-bold">AI</div>
                                    <span className="text-xs font-bold text-pink-600">다온 AI 추천 인기 해시태그</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recommendedInstagramHashtags.map((ht, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (!formData.instagramHashtags.includes(ht)) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        instagramHashtags: [...prev.instagramHashtags, ht]
                                                    }));
                                                }
                                            }}
                                            className="group relative px-3 py-1.5 bg-white text-pink-700 border border-pink-200 rounded-lg text-xs font-semibold hover:border-pink-400 hover:bg-pink-50 transition-all duration-200 shadow-sm overflow-hidden"
                                        >
                                            <span className="relative z-10 flex items-center gap-1">
                                                <span className="text-pink-400 group-hover:text-pink-600 transition-colors">+</span> {ht}
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {formData.instagramHashtags.map((hashtag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium"
                                >
                                    <Hash size={14} />
                                    {hashtag.replace('#', '')}
                                    <button
                                        onClick={() => removeInstagramHashtag(hashtag)}
                                        className="hover:text-pink-900"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            💡 해시태그는 자동으로 # 기호가 추가됩니다.
                        </p>
                    </div>

                    {/* 계정 태그 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            계정 태그 (@)
                        </label>
                        <input
                            type="text"
                            value={formData.instagramAccountTag || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, instagramAccountTag: e.target.value }))}
                            placeholder="예: @your_brand_account"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            사진에 태그할 공식 계정 ID를 입력하세요.
                        </p>
                    </div>

                    {/* 촬영 가이드 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            촬영 가이드
                        </label>
                        <textarea
                            value={formData.instagramPhotoGuide || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, instagramPhotoGuide: e.target.value }))}
                            placeholder="예: 제품 상세컷 2장 이상, 동영상 1개 필수"
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                    </div>

                    {/* 릴스 여부 */}
                    <div className="mb-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.instagramReelsRequired}
                                onChange={(e) => setFormData(prev => ({ ...prev, instagramReelsRequired: e.target.checked }))}
                                className="w-5 h-5 text-pink-500 border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🎬</span>
                                <span className="font-medium text-gray-900 group-hover:text-pink-600 transition-colors">
                                    릴스(Reels) 필수
                                </span>
                            </div>
                        </label>
                    </div>
                </section>
            )}



            {/* 금지 키워드 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">금지 키워드</h2>

                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={prohibitedInput}
                        onChange={(e) => setProhibitedInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addProhibited()}
                        placeholder="금지어 입력 후 Enter"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={addProhibited}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        추가
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {formData.prohibitedWords.map((word, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                        >
                            {word}
                            <button
                                onClick={() => removeProhibited(word)}
                                className="hover:text-red-900"
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                </div>

                {formData.prohibitedWords.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                        리뷰에 사용하면 안 되는 단어나 경쟁사 이름 등을 추가해주세요.
                    </p>
                )}
            </section>

            {/* 추가 안내사항 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">추가 안내사항</h2>
                <textarea
                    value={formData.additionalNotes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    placeholder="리뷰어에게 전달할 추가 안내사항이 있다면 작성해주세요."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </section>

            {/* 버튼 */}
            <div className="flex justify-between">
                <button
                    onClick={onPrev}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ChevronLeft size={20} />
                    이전 단계
                </button>

                <div className="flex gap-3">
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
                            ? isEdit
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {isEdit ? '수정완료' : '다음 단계로'}
                    </button>
                </div>
            </div>
        </div>
    );
}
