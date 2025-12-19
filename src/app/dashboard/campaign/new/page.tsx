'use client';

import { useState, useEffect, Suspense } from 'react';
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

// const AUTOSAVE_KEY = 'campaign_draft'; // Deprecated in favor of user-specific keys

function NewCampaignPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isEdit = !!searchParams?.get('id');
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
        const checkUser = async () => {
            try {
                // getUser()가 보안상 더 안전하며 최신 상태를 보장합니다.
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                    setUserId(user.id);
                    
                    // 1. URL에서 기존 캠페인 'id' 확인 (수정 모드)
                    const campaignId = searchParams?.get('id');
                    if (campaignId) {
                        const { data: campaign, error } = await supabase
                            .from('campaigns')
                            .select('*')
                            .eq('id', campaignId)
                            .single();
                        
                        if (campaign && !error) {
                            handleLoadCompleted(campaign, true); // silent=true
                            setCurrentDraftId(campaignId); // 수정 시에는 id를 currentDraftId로 활용
                            console.log('기존 캠페인 정보를 불러왔습니다:', campaignId);
                            return; // 기존 캠페인 로딩 시 종료
                        }
                    }

                    // 2. URL에서 'draftId' 확인 (임시저장 불러오기)
                    const draftId = searchParams?.get('draftId');
                    if (draftId) {
                        const draft = await loadDraft(user.id, draftId);
                        if (draft) {
                            setCurrentDraftId(draft.id);
                            setCurrentStep(draft.currentStep);
                            setStep1Data(draft.step1Data);
                            setInitialStep1Data(draft.step1Data);
                            setStep2Data(draft.step2Data);
                            setInitialStep2Data(draft.step2Data);
                            if (draft.currentStep > 1) {
                                setStep1Complete(true);
                            }
                            toast.success('임시저장된 캠페인을 불러왔습니다.', { id: 'load-campaign-success' });
                        }
                    }
                } else {
                    // 세션이 없으면 로그인 페이지로 (단, 이미 데이터가 있다면 보존을 위해 즉시 리다이렉트보다는 안내)
                    console.log('No active session found');
                }
            } catch (error) {
                console.error('사용자 정보 불러오기 실패:', error);
            }
        };

        checkUser();

        // 인증 상태 변경 구독
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
            } else {
                setUserId('');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [searchParams]);

    const handleSaveDraft = async () => {
        console.log('--- 임시저장 시작 ---');
        // 1. 최신 세션 확인
        let currentUserId = userId;
        
        // userId가 state에 없으면 직접 확인
        if (!currentUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                currentUserId = user.id;
                setUserId(currentUserId);
            }
        }

        console.log('userId:', currentUserId);

        if (!currentUserId) {
            toast.error('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
            // 선택 사항: 로그인 페이지로 리다이렉트
            // router.push('/login'); 
            return;
        }

        // 2. 데이터 확인
        // step1Data가 null이더라도 CampaignStep1에서 올라온 데이터가 있을 수 있으므로 확인
        if (!step1Data) {
            console.error('step1Data is null');
            toast.error('저장할 기본 정보가 없습니다. 1단계를 먼저 진행해주세요.');
            return;
        }

        console.log('step1Data:', step1Data);
        console.log('currentStep:', currentStep);

        try {
            const draft = await saveDraft(currentUserId, {
                id: currentDraftId || undefined,
                title: step2Data?.campaignTitle || step1Data?.productName || '제목 없음',
                campaignType: step1Data.campaignType, 
                step1Data,
                step2Data,
                currentStep,
            });

            if (draft && draft.id) {
                setCurrentDraftId(draft.id);
                toast.success('캠페인이 임시저장되었습니다.');
                console.log('임시저장 성공:', draft.id);
            }
        } catch (error: any) {
            console.error('임시저장 상세 에러:', error);
            toast.error(`임시저장에 실패했습니다: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
        }
    };

    // 캠페인 불러오기 - 임시저장
    const handleLoadDraft = (draft: DraftCampaign, silent = false) => {
        setCurrentDraftId(draft.id);
        setCurrentStep(draft.currentStep);
        setStep1Data(draft.step1Data);
        setInitialStep1Data(draft.step1Data);
        setStep2Data(draft.step2Data);
        setInitialStep2Data(draft.step2Data);
        if (!silent) {
            toast.success('임시저장된 캠페인을 불러왔습니다.', { id: 'load-campaign-success' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 캠페인 불러오기 - 완료된 캠페인 또는 기존 캠페인 수정
    const handleLoadCompleted = (campaign: any, silent = false) => {
        // 1. 우선적으로 campaign_options(JSONB) 데이터가 있는지 확인
        const options = Array.isArray(campaign.campaign_options) ? campaign.campaign_options[0] : campaign.campaign_options;
        
        if (options && (options.step1Data || options.step2Data)) {
            const step1 = options.step1Data || {};
            const step2 = options.step2Data || {};
            
            setCurrentDraftId(null);
            setCurrentStep(1);
            setStep1Data(step1);
            setInitialStep1Data(step1);
            setStep2Data(step2);
            setInitialStep2Data(step2);
            setStep1Complete(true); // 이미 완료된 캠페인이므로 Step 1은 완료 상태로 간주
            
            if (!silent) {
                toast.success('캠페인 상세 데이터를 불러왔습니다.', { id: 'load-campaign-success' });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // 2. Fallback: campaign_options가 없는 경우 수동 매핑 (레거시 대응)
        console.log('레거시 데이터 매핑을 시작합니다.');
        const step1: any = {
            campaignType: campaign.campaign_type || (campaign.type === '배송형' ? 'delivery' : 'visit'),
            platform: campaign.platform === '블로그' ? 'naver' : campaign.platform === '인스타' ? 'instagram' : 'naver',
            category: campaign.category,
            region: campaign.region,
            stores: campaign.stores || [],
            contactPhone: campaign.contact_phone,
            visitTime: campaign.visit_time,
            visitDays: campaign.visit_days || [],
            visitNotes: campaign.visit_notes,
            experienceDetails: campaign.experience_details,
            officialPrice: campaign.official_price,
            totalRecruitment: campaign.recruit_count?.toString() || '',
            rewardPerPerson: campaign.reward_per_person || 0,
            recruitmentStartDate: campaign.recruitment_start_date,
            firstSelectionDate: campaign.first_selection_date,
            reviewDeadline: campaign.review_deadline,
            productUrl: campaign.product_url,
            productName: campaign.product_name,
            productPrice: campaign.product_price,
            // 레거시 데이터는 정확한 체크박스 상태를 알 수 없으나 추정함
            includeReview: campaign.platform === '기타',
            includeNaver: campaign.platform === '블로그',
            includeInstagram: campaign.platform === '인스타',
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
        setStep1Complete(true);
        if (!silent) {
            toast.success('캠페인을 불러왔습니다.', { id: 'load-campaign-success' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 자동 저장된 데이터 복구
    useEffect(() => {
        if (!userId) return; // 유저 정보가 없으면 실행하지 않음

        const id = searchParams?.get('id');
        const userSpecificKey = `campaign_draft_${userId}`;
        const savedData = localStorage.getItem(userSpecificKey);
        
        // 레거시 키 확인 (이전 버전 호환성 혹은 잘못된 공유 방지)
        // 만약 레거시 키가 있고 유저별 키가 없다면? 
        // 보안상 다른 사람의 데이터일 수 있으므로, 명시적으로 내 것이 아니면 무시하는게 맞음.
        // 따라서 레거시 키(campaign_draft)는 이제 무시합니다.

        // 기존 캠페인 수정('id')이 아닐 때만 복구 다이얼로그 노출
        if (savedData && !id) {
            setShowRestoreDialog(true);
        }
    }, [searchParams, userId]);

    // 자동 저장
    useEffect(() => {
        if (!userId) return;

        // 데이터가 비어있으면 저장하지 않음 (초기 로딩 시 덮어쓰기 방지)
        if (!step1Data && !step2Data) return;

        const userSpecificKey = `campaign_draft_${userId}`;
        const draftData = {
            currentStep,
            step1Data,
            step2Data,
            savedAt: new Date().toISOString(),
        };
        localStorage.setItem(userSpecificKey, JSON.stringify(draftData));
    }, [currentStep, step1Data, step2Data, userId]);

    // 임시 저장 데이터 복구
    const handleRestoreDraft = () => {
        if (!userId) return;
        const userSpecificKey = `campaign_draft_${userId}`;
        const savedData = localStorage.getItem(userSpecificKey);
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
        if (!userId) return;
        const userSpecificKey = `campaign_draft_${userId}`;
        localStorage.removeItem(userSpecificKey);
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
    const handleStep2Complete = async (data: any) => {
        setStep2Data(data);
        if (isEdit) {
            // 수정 시에는 바로 최종 제출 처리
            await handleFinalSubmit(null, data);
        } else {
            setCurrentStep(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
    const handleFinalSubmit = async (step3Data: any, latestStep2Data?: any) => {
        const finalStep2Data = latestStep2Data || step2Data;
        console.log('🚀 handleFinalSubmit 시작', { step1Data, step2Data: finalStep2Data, step3Data });

        try {
            // 현재 로그인한 사용자 가져오기
            const { data: { user } } = await supabase.auth.getUser();
            console.log('👤 사용자 확인:', user);

            if (!user) {
                toast.error('로그인이 필요합니다.');
                router.push('/login');
                return;
            }

            // 1. 유저 정의 구조에 따른 유형(type) 매핑
            const mappedType = step1Data.campaignType === 'delivery' ? '배송형' : '방문형';

            // 2. 유저 정의 구조에 따른 플랫폼(platform) 매핑
            let mappedPlatform = '구매평';
            if (step1Data.campaignType === 'delivery') {
                if (step1Data.includeNaver) mappedPlatform = '블로그';
                else if (step1Data.includeInstagram) mappedPlatform = '인스타';
                else if (step1Data.includeReview) mappedPlatform = '구매평'; 
            } else {
                if (step1Data.platform === 'naver') mappedPlatform = '블로그';
                else if (step1Data.platform === 'instagram') mappedPlatform = '인스타';
            }

            // 캠페인 데이터 구성
            const campaignData = {
                created_by: user.id,
                title: step2Data.campaignTitle,
                description: step2Data.missionGuide || '',

                // 분류 정보 (유저 정의 구조 반영)
                type: mappedType,         // '방문형', '배송형'
                platform: mappedPlatform, // '블로그', '인스타', '기타'
                
                category: step1Data.category || null,
                region: step1Data.region || null,

                // 이미지 (썸네일 및 추가 이미지)
                thumbnail_url: step2Data.campaignImages?.[0] || null,
                sub_image_1: step2Data.campaignImages?.[1] || null,
                sub_image_2: step2Data.campaignImages?.[2] || null,
                campaign_images: step2Data.campaignImages || [],

                // 모집 정보
                recruit_count: parseInt(step1Data.totalRecruitment) || 0,
                total_recruitment: parseInt(step1Data.totalRecruitment) || 0,
                recruitment_start_date: step1Data.recruitmentStartDate || null,
                first_selection_date: step1Data.firstSelectionDate || null,
                review_deadline: step1Data.reviewDeadline || null,
                end_date: step1Data.reviewDeadline || step1Data.firstSelectionDate || step1Data.recruitmentStartDate || new Date().toISOString().split('T')[0],

                // 매장 및 제공 내역
                store_name: step1Data.stores?.[0]?.storeName || null,
                store_address: step1Data.stores?.[0]?.address || null,
                naver_map_url: step1Data.stores?.[0]?.naverPlaceUrl || null,
                stores: step1Data.stores || [],
                provision: step1Data.experienceDetails || null,
                experience_details: step1Data.experienceDetails || null,
                official_price: step1Data.officialPrice || null,

                // 연락 및 방문 정보
                contact_phone: step1Data.contactPhone || null,
                visit_time: step1Data.visitTime || null,
                visit_days: step1Data.visitDays || [],
                visit_notes: step1Data.visitNotes || null,

                // 배송형/구매평 특정 정보
                product_url: step1Data.productUrl || null,
                product_url_private: step1Data.productUrlPrivate || false,
                product_name: step1Data.productName || null,
                product_price: step1Data.productPrice || null,
                product_options: step1Data.productOptions || [],
                reward_per_person: step1Data.rewardPerPerson || 0,

                // 리뷰 가이드 및 미션 정보
                text_length: finalStep2Data.textLength || null,
                photo_count: finalStep2Data.photoCount || null,
                video_required: finalStep2Data.videoRequired || null,
                mission_guide: finalStep2Data.missionGuide || null,
                keywords: finalStep2Data.keywords || [],
                prohibited_words: finalStep2Data.prohibitedWords || [],
                additional_notes: finalStep2Data.additionalNotes || null,
                payment_method: step3Data?.paymentMethod || 'manual',

                // 상태 제어
                status: isEdit ? undefined : 'PENDING',

                // 전체 데이터 보존 (수정 시 정밀한 복구를 위함)
                campaign_options: [{
                    step1Data,
                    step2Data: finalStep2Data,
                    currentStep: isEdit ? 2 : 3,
                    savedAt: new Date().toISOString()
                }],
            };

            console.log('📦 캠페인 데이터:', campaignData);

            // Supabase에 저장 (수정 또는 신규 등록)
            // URL에 id가 있거나(수정), 이번 세션에서 임시저장된 id가 있는 경우 update 실행
            const editId = searchParams?.get('id') || currentDraftId;
            const { data, error } = editId 
                ? await supabase
                    .from('campaigns')
                    .update(campaignData)
                    .eq('id', editId)
                    .select()
                    .single()
                : await supabase
                    .from('campaigns')
                    .insert([campaignData])
                    .select()
                    .single();

            if (error) {
                console.error('❌ 캠페인 저장 오류:', error);
                toast.error(`캠페인 저장 중 오류가 발생했습니다: ${error.message}`);
                return;
            }

            console.log('✅ 캠페인 저장 성공:', data);

            // 성공 시 임시 저장 데이터 삭제
            const userSpecificKey = `campaign_draft_${user.id}`;
            localStorage.removeItem(userSpecificKey);

            toast.success(editId ? '캠페인 정보가 업데이트되었습니다' : '캠페인이 요청되었습니다');

            // 역할(Role) 확인 후 적절한 페이지로 리다이렉트
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const userRole = profile?.role;
            console.log('🔄 페이지 이동 시작, 역할:', userRole);

            if (userRole === 'ADMIN') {
                router.push('/dashboard/admin/campaigns');
            } else {
                router.push('/dashboard/advertiser');
            }

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
                                    새로 시작
                                </button>
                                <button
                                    onClick={handleRestoreDraft}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    작성하던 내용 불러오기
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* 헤더 */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            {searchParams?.get('id') ? '캠페인 정보 수정' : '새 캠페인 등록'}
                        </h1>
                        <p className="text-gray-600">
                            {searchParams?.get('id') ? '캠페인 상세 내용을 수정하고 업데이트하세요' : '3단계로 간편하게 캠페인을 등록하세요'}
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
                            {!isEdit && (
                                <div className={`w-24 h-1 mx-4 ${step2Data ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                            )}

                            {/* Step 3 */}
                            {!isEdit && (
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
                            )}
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
                            isEdit={isEdit}
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

export default function NewCampaignPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div></div>}>
            <NewCampaignPageContent />
        </Suspense>
    );
}
