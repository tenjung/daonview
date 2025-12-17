'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import CampaignStep1 from '@/components/campaign/CampaignStep1';
import CampaignStep2 from '@/components/campaign/CampaignStep2';
import CampaignStep3 from '@/components/campaign/CampaignStep3';
import AdminSidebar from '@/components/AdminSidebar';
import CampaignLoader from '@/components/campaign/CampaignLoader';
import { saveDraft, loadDraft, DraftCampaign } from '@/lib/draftUtils';
import { Save } from 'lucide-react';

const AUTOSAVE_KEY = 'campaign_draft';

export default function NewCampaignPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState(1);
    const [step1Data, setStep1Data] = useState<any>(null);
    const [step1Complete, setStep1Complete] = useState(false);
    const [step2Data, setStep2Data] = useState<any>(null);
    // 초기 로딩 데이터 (무한 루프 방지용)
    const [initialStep1Data, setInitialStep1Data] = useState<any>(null);
    const [initialStep2Data, setInitialStep2Data] = useState<any>(null);

    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

    // 사용자 정보 및 임시저장 불러오기
    useEffect(() => {
        loadUserAndDraft();
    }, []);

    const loadUserAndDraft = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            setUserId(user.id);

            // URL에서 draftId 확인
            const draftId = searchParams?.get('draftId');
            if (draftId) {
                const draft = await loadDraft(user.id, draftId);
                if (draft) {
                    setCurrentDraftId(draft.id);
                    setCurrentStep(draft.currentStep);
                    setStep1Data(draft.step1Data);
                    setInitialStep1Data(draft.step1Data); // 초기값 설정
                    setStep2Data(draft.step2Data);
                    setInitialStep2Data(draft.step2Data); // 초기값 설정
                    if (draft.currentStep > 1) {
                        setStep1Complete(true);
                    }
                    toast.success('임시저장된 캠페인을 불러왔습니다.');
                }
            }
        } catch (error) {
            console.error('사용자 정보 불러오기 실패:', error);
        }
    };

    // 임시저장 함수
    const handleSaveDraft = async () => {
        if (!userId) {
            toast.error('로그인이 필요합니다. 다시 로그인해주세요.');
            return;
        }

        if (!step1Data) {
            toast.error('저장할 기본 정보가 없습니다. 1단계를 먼저 진행해주세요.');
            return;
        }

        try {
            const draft = await saveDraft(userId, {
                id: currentDraftId || undefined,
                title: step2Data?.campaignTitle || step1Data?.productName || '제목 없음',
                campaignType: step1Data.campaignType,
                step1Data,
                step2Data,
                currentStep,
            });

            setCurrentDraftId(draft.id);
            toast.success('캠페인이 임시저장되었습니다.');
        } catch (error: any) {
            console.error('임시저장 상세 에러:', error);
            toast.error(`임시저장에 실패했습니다: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
        }
    };

    // 캠페인 불러오기 - 임시저장
    const handleLoadDraft = (draft: DraftCampaign) => {
        setCurrentDraftId(draft.id);
        setCurrentStep(draft.currentStep);
        setStep1Data(draft.step1Data);
        setInitialStep1Data(draft.step1Data);
        setStep2Data(draft.step2Data);
        setInitialStep2Data(draft.step2Data);
        toast.success('임시저장된 캠페인을 불러왔습니다.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 캠페인 불러오기 - 완료된 캠페인
    const handleLoadCompleted = (campaign: any) => {
        // 완료된 캠페인 데이터를 Step 1, 2 형식으로 변환
        const step1: any = {
            campaignType: campaign.campaign_type,
            platform: campaign.platform,
            category: campaign.category,
            region: campaign.region,
            stores: campaign.stores || [],
            contactPhone: campaign.contact_phone,
            visitTime: campaign.visit_time,
            visitDays: campaign.visit_days || [],
            visitNotes: campaign.visit_notes,
            experienceDetails: campaign.experience_details,
            officialPrice: campaign.official_price,
            totalRecruitment: campaign.total_recruitment?.toString() || '',
            rewardPerPerson: campaign.reward_per_person || 0,
            recruitmentStartDate: campaign.recruitment_start_date,
            firstSelectionDate: campaign.first_selection_date,
            reviewDeadline: campaign.review_deadline,
            productUrl: campaign.product_url,
            productName: campaign.product_name,
            productPrice: campaign.product_price,
            includeReview: false,
            includeNaver: false,
            includeInstagram: false,
        };

        const step2: any = {
            campaignTitle: campaign.title,
            campaignImages: campaign.campaign_images || [],
            textLength: campaign.text_length || 'free',
            photoCount: campaign.photo_count || '3',
            videoRequired: campaign.video_required || 'no',
            missionGuide: campaign.mission_guide || '',
            keywords: campaign.keywords || [],
            prohibitedWords: campaign.prohibited_words || [],
            additionalNotes: campaign.additional_notes || '',
        };

        setCurrentDraftId(null);
        setCurrentStep(1);
        setStep1Data(step1);
        setInitialStep1Data(step1);
        setStep2Data(step2);
        setInitialStep2Data(step2);
        toast.success('캠페인을 불러왔습니다.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 자동 저장된 데이터 복구
    useEffect(() => {
        const savedData = localStorage.getItem(AUTOSAVE_KEY);
        if (savedData) {
            setShowRestoreDialog(true);
        }
    }, []);

    // 자동 저장
    useEffect(() => {
        if (step1Data || step2Data) {
            const draftData = {
                currentStep,
                step1Data,
                step2Data,
                savedAt: new Date().toISOString(),
            };
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draftData));
        }
    }, [currentStep, step1Data, step2Data]);

    // 임시 저장 데이터 복구
    const handleRestoreDraft = () => {
        const savedData = localStorage.getItem(AUTOSAVE_KEY);
        if (savedData) {
            const draft = JSON.parse(savedData);
            setCurrentStep(draft.currentStep);
            setStep1Data(draft.step1Data);
            setInitialStep1Data(draft.step1Data);
            setStep2Data(draft.step2Data);
            setInitialStep2Data(draft.step2Data);
            toast.success('임시 저장된 데이터를 불러왔습니다.');
        }
        setShowRestoreDialog(false);
    };

    // 임시 저장 데이터 삭제
    const handleDiscardDraft = () => {
        localStorage.removeItem(AUTOSAVE_KEY);
        setShowRestoreDialog(false);
    };

    // Step 1 완료
    const handleStep1Complete = (data: any) => {
        setStep1Data(data);
        setStep1Complete(true);
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Step 1 변경 (실시간 저장용)
    const handleStep1Change = (data: any) => {
        setStep1Data(data);
    };

    // Step 2 완료
    const handleStep2Complete = (data: any) => {
        setStep2Data(data);
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Step 2로 돌아가기
    const handleBackToStep2 = () => {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Step 1로 돌아가기
    const handleBackToStep1 = () => {
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 최종 제출
    const handleFinalSubmit = async (step3Data: any) => {
        console.log('🚀 handleFinalSubmit 시작', { step1Data, step2Data, step3Data });

        try {
            // 현재 로그인한 사용자 가져오기
            const { data: { user } } = await supabase.auth.getUser();
            console.log('👤 사용자 확인:', user);

            if (!user) {
                toast.error('로그인이 필요합니다.');
                router.push('/login');
                return;
            }

            // 캠페인 데이터 구성
            const campaignData = {
                created_by: user.id,
                title: step2Data.campaignTitle,
                description: step2Data.missionGuide || '',

                // 기본 정보
                // 기본 정보
                campaign_type: step1Data.campaignType,  // 'delivery', 'visit', 'press'
                type: step1Data.campaignType, // DB 스키마 필수 항목
                platform: step1Data.platform || (() => {
                    // 배송체험단 등 플랫폼이 명시적으로 선택되지 않은 경우 조합하여 생성
                    const platforms = [];
                    if (step1Data.includeNaver) platforms.push('naver_blog');
                    if (step1Data.includeInstagram) platforms.push('instagram');
                    if (step1Data.includeReview) platforms.push('purchase_review');
                    return platforms.length > 0 ? platforms.join(',') : 'delivery_default';
                })(),
                category: step1Data.category || null,
                region: step1Data.region || null,

                // 이미지
                thumbnail_url: step2Data.campaignImages?.[0] || null,
                sub_image_1: step2Data.campaignImages?.[1] || null,
                sub_image_2: step2Data.campaignImages?.[2] || null,

                // 모집 정보
                recruit_count: parseInt(step1Data.totalRecruitment) || 0,
                total_recruitment: parseInt(step1Data.totalRecruitment) || 0,
                end_date: step1Data.reviewDeadline || step1Data.firstSelectionDate || step1Data.recruitmentStartDate || ((d) => { d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; })(new Date()),

                // 매장 정보 (방문형/기자단용)
                store_name: step1Data.stores?.[0]?.storeName || null,
                store_address: step1Data.stores?.[0]?.address || null,
                naver_map_url: step1Data.stores?.[0]?.naverPlaceUrl || null,

                // 제공 내역
                provision: step1Data.experienceDetails || null,

                // 추가 필드들
                review_type: step1Data.reviewType || null,
                stores: step1Data.stores || [],
                contact_phone: step1Data.contactPhone || null,
                visit_time: step1Data.visitTime || null,
                visit_days: step1Data.visitDays || [],
                visit_notes: step1Data.visitNotes || null,
                experience_details: step1Data.experienceDetails || null,
                official_price: step1Data.officialPrice || null,

                // 배송체험단 제품 정보
                product_url: step1Data.productUrl || null,
                product_url_private: step1Data.productUrlPrivate || false,
                product_name: step1Data.productName || null,
                product_options: step1Data.productOptions || [],
                product_price: step1Data.productPrice || null,

                reward_per_person: step1Data.rewardPerPerson || 0,
                recruitment_start_date: step1Data.recruitmentStartDate || null,
                first_selection_date: step1Data.firstSelectionDate || null,
                review_deadline: step1Data.reviewDeadline || null,
                campaign_images: step2Data.campaignImages || [],
                text_length: step2Data.textLength || null,
                photo_count: step2Data.photoCount || null,
                video_required: step2Data.videoRequired || null,
                mission_guide: step2Data.missionGuide || null,
                keywords: step2Data.keywords || [],
                prohibited_words: step2Data.prohibitedWords || [],
                additional_notes: step2Data.additionalNotes || null,
                payment_method: step3Data.paymentMethod,

                // 상태
                status: 'PENDING',
            };

            console.log('📦 캠페인 데이터:', campaignData);

            // Supabase에 저장
            const { data, error } = await supabase
                .from('campaigns')
                .insert([campaignData])
                .select()
                .single();

            if (error) {
                console.error('❌ 캠페인 저장 오류 - Full Error:', {
                    error,
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                });
                toast.error(`캠페인 등록 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
                return;
            }

            console.log('✅ 캠페인 저장 성공:', data);

            // 성공 시 임시 저장 데이터 삭제
            localStorage.removeItem(AUTOSAVE_KEY);

            toast.success('캠페인이 요청되었습니다');

            console.log('🔄 페이지 이동 시작: /dashboard/advertiser');

            // 대시보드로 이동
            router.push('/dashboard/advertiser');

        } catch (error: any) {
            console.error('❌ 캠페인 등록 치명적 오류:', error);
            toast.error(`캠페인 등록 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />

            <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 py-8 overflow-y-auto">
                {/* 복구 확인 다이얼로그 */}
                {showRestoreDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">임시 저장된 데이터가 있습니다</h3>
                            <p className="text-gray-600 mb-6">
                                이전에 작성하던 캠페인 정보를 불러오시겠습니까?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDiscardDraft}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    새로 작성
                                </button>
                                <button
                                    onClick={handleRestoreDraft}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    불러오기
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* 헤더 */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            새 캠페인 등록
                        </h1>
                        <p className="text-gray-600">
                            3단계로 간편하게 캠페인을 등록하세요
                        </p>
                    </div>

                    {/* 캠페인 불러오기 */}
                    {userId && (
                        <CampaignLoader
                            userId={userId}
                            onLoadDraft={handleLoadDraft}
                            onLoadCompleted={handleLoadCompleted}
                        />
                    )}

                    {/* 스텝 인디케이터 */}
                    <div className="my-12">
                        <div className="flex items-center justify-center">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center">
                                <button
                                    onClick={() => {
                                        if (currentStep > 1) {
                                            setCurrentStep(1);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    disabled={currentStep === 1}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${currentStep === 1
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : step1Complete
                                            ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600 hover:shadow-md'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {step1Complete ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        '1'
                                    )}
                                </button>
                                <span className={`mt-2 text-sm font-medium ${currentStep === 1 ? 'text-blue-600' : step1Complete ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                    기본 정보
                                </span>
                            </div>

                            {/* Connector */}
                            <div className={`w-24 h-1 mx-4 ${step1Complete ? 'bg-green-500' : 'bg-gray-200'}`}></div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center">
                                <button
                                    onClick={() => {
                                        if (step1Complete) {
                                            setCurrentStep(2);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    disabled={!step1Complete}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${currentStep === 2
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : step2Data
                                            ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600 hover:shadow-md'
                                            : step1Complete
                                                ? 'bg-gray-300 text-gray-600 cursor-pointer hover:bg-gray-400'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {step2Data ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        '2'
                                    )}
                                </button>
                                <span className={`mt-2 text-sm font-medium ${currentStep === 2 ? 'text-blue-600' : step2Data ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                    미션 가이드
                                </span>
                            </div>

                            {/* Connector */}
                            <div className={`w-24 h-1 mx-4 ${step2Data ? 'bg-green-500' : 'bg-gray-200'}`}></div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center">
                                <button
                                    onClick={() => {
                                        if (step2Data) {
                                            setCurrentStep(3);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    disabled={!step2Data}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${currentStep === 3
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : step2Data
                                            ? 'bg-gray-300 text-gray-600 cursor-pointer hover:bg-gray-400'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    3
                                </button>
                                <span className={`mt-2 text-sm font-medium ${currentStep === 3 ? 'text-blue-600' : 'text-gray-500'
                                    }`}>
                                    결제
                                </span>
                            </div>
                        </div>
                    </div>



                    {currentStep === 1 && (
                        <CampaignStep1
                            onNext={handleStep1Complete}
                            onChange={handleStep1Change}
                            onSaveDraft={handleSaveDraft}
                            initialData={initialStep1Data}
                        />
                    )}

                    {currentStep === 2 && step1Data && (
                        <CampaignStep2
                            onNext={handleStep2Complete}
                            onPrev={handleBackToStep1}
                            onSaveDraft={handleSaveDraft}
                            initialData={initialStep2Data}
                            step1Data={step1Data}
                        />
                    )}

                    {currentStep === 3 && (
                        <CampaignStep3
                            onSubmit={handleFinalSubmit}
                            onPrev={handleBackToStep2}
                            onSaveDraft={handleSaveDraft}
                            step1Data={step1Data}
                            step2Data={step2Data}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
