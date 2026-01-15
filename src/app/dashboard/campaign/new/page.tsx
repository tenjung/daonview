'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
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
    const { user, profile, isInitialized } = useAuthStore();
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
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

    // 캠페인 불러오기 - 완료된 캠페인 또는 기존 캠페인 수정
    const handleLoadCompleted = useCallback((campaign: any, silent = false) => {
        // 1. Synthesize stores if empty
        let synthesizedStores = Array.isArray(campaign.stores) 
            ? campaign.stores 
            : (typeof campaign.stores === 'string' ? (() => { try { return JSON.parse(campaign.stores); } catch { return []; } })() : []);

        if (synthesizedStores.length === 0 && campaign.naver_map_url) {
            synthesizedStores = [{
                id: 'legacy-store-1',
                naverPlaceUrl: campaign.naver_map_url,
                storeName: campaign.store_name || '',
                address: campaign.store_address || ''
            }];
        }

        // 2. Parse product options (new format or legacy fallback)
        let productOptions = [];
        if (Array.isArray(campaign.product_options) && campaign.product_options.length > 0) {
            productOptions = campaign.product_options;
        } else if (Array.isArray(campaign.campaign_options) && campaign.campaign_options.length > 0) {
             // 레거시 대응: campaign_options가 배열이고 문자열인 경우 (예: 캠페인 22번 케이스)
             // 또는 campaign_options가 배열 내에 객체로 들어있지 않고 단순 문자열 목록인 경우
            const firstOpt = campaign.campaign_options[0];
            if (typeof firstOpt === 'string') {
                productOptions = campaign.campaign_options.map((opt: any, idx: number) => ({
                    id: `legacy-opt-${idx}`,
                    optionName: opt,
                    optionPrice: '0',
                    recruitmentCount: '0'
                }));
            } else if (typeof firstOpt === 'object' && !firstOpt.step1Data) {
                // step1Data가 없는 객체 배열인 경우 (순수 옵션 목록)
                productOptions = campaign.campaign_options;
            }
        }

        // 3. Create initial Step 1 data from flat columns (Fallback mapping)
        const legacyStep1: any = {
            campaignType: campaign.campaign_type || campaign.type || (campaign.product_name ? 'DELIVERY' : 'VISIT'),
            platform: campaign.platform === 'BLOG' || campaign.platform === '블로그' ? 'BLOG' : 
                      campaign.platform === 'INSTAGRAM' || campaign.platform === '인스타그램' || campaign.platform === '인스타' ? 'INSTAGRAM' : (campaign.platform || 'BLOG'),
            category: campaign.category || '',
            region: campaign.region || '',
            stores: synthesizedStores,
            contactPhone: campaign.contact_phone || campaign.manager_phone || campaign.phone || '',
            advertiserWillContact: campaign.advertiser_will_contact || false,
            visitTime: campaign.visit_time || campaign.visit_available_time || '',
            visitTimeNegotiable: campaign.visit_time_negotiable || false,
            visitDays: Array.isArray(campaign.visit_days) 
                ? campaign.visit_days 
                : (typeof campaign.visit_days === 'string' ? (() => { try { return JSON.parse(campaign.visit_days); } catch { return []; } })() : []),
            visitNotes: campaign.visit_notes || campaign.notes || '',
            experienceDetails: campaign.experience_details || campaign.provision || campaign.description || '',
            officialPrice: campaign.official_price || campaign.product_price || '',
            totalRecruitment: (campaign.recruit_count || campaign.total_recruitment)?.toString() || '',
            rewardPerPerson: campaign.reward_per_person || 0,
            recruitmentStartDate: campaign.recruitment_start_date || (campaign.created_at ? campaign.created_at.split('T')[0] : ''),
            firstSelectionDate: campaign.first_selection_date || '',
            reviewDeadline: campaign.review_deadline || '',
            productUrl: campaign.product_url || '',
            productName: campaign.product_name || '',
            productPrice: campaign.product_price || '',
            productOptions: productOptions,
            campaignTitle: campaign.title || '',
            // 배송형 플랫폼 상세 플래그 (하이브리드 지원)
            includeReview: campaign.include_review === true || campaign.platform === 'PURCHASE',
            includeNaver: campaign.include_naver === true || campaign.platform === 'BLOG',
            includeInstagram: campaign.include_instagram === true || campaign.platform === 'INSTAGRAM',
            // 옵션 설정 (SINGLE, RANKED, MULTI)
            optionConfig: campaign.option_config ? {
                mode: campaign.option_config.mode || 'SINGLE',
                maxSelect: campaign.option_config.maxSelect || campaign.option_config.max_select || 1
            } : { mode: 'SINGLE', maxSelect: 1 },
        };

        const legacyStep2: any = {
            campaignTitle: campaign.title || '',
            campaignImages: (Array.isArray(campaign.campaign_images) && campaign.campaign_images.length > 0) 
                ? campaign.campaign_images 
                : (campaign.thumbnail_url ? [campaign.thumbnail_url] : []),
            textLength: campaign.text_length || 'free',
            photoCount: campaign.photo_count || '3',
            videoRequired: campaign.video_required || 'no',
            missionGuide: campaign.mission_guide || campaign.provision || '',
            keywords: campaign.keywords || [],
            prohibitedWords: campaign.prohibited_words || [],
            additionalNotes: campaign.additional_notes || '',
        };

        // 4. If campaign_options exists, merge it with legacy data
        const options = Array.isArray(campaign.campaign_options) ? campaign.campaign_options[0] : campaign.campaign_options;
        let finalStep1 = legacyStep1;
        let finalStep2 = legacyStep2;

        console.log('🔄 Mapping Logic - Legacy Data:', { legacyStep1, legacyStep2 });
        console.log('🔄 Mapping Logic - Options field:', options);

        if (options) {
            // step1Data/step2Data가 있는 경우 (신규 방식)
            if (options.step1Data || options.step2Data) {
                console.log('📦 Found new format (step1Data/step2Data)');
                finalStep1 = { ...legacyStep1, ...(options.step1Data || {}) };
                finalStep2 = { ...legacyStep2, ...(options.step2Data || {}) };
            } 
            // root에 필드가 있는 경우 (구형 임시저장 방식 또는 단일 객체 인서트)
            else if (typeof options === 'object' && (options.contactPhone || options.visitTime || options.stores)) {
                console.log('📦 Found old format (root keys)');
                finalStep1 = { ...legacyStep1, ...options };
                // step2 데이터도 있을 수 있음
                if (options.missionGuide || options.keywords) {
                    finalStep2 = { ...legacyStep2, ...options };
                }
            }
        }

        console.log('✨ [최종 매핑 결과]:', { finalStep1, finalStep2 });

        setCurrentDraftId(null);
        setCurrentStep(1);
        setStep1Data(finalStep1);
        setInitialStep1Data(finalStep1);
        setStep2Data(finalStep2);
        setInitialStep2Data(finalStep2);
        setStep1Complete(true);
        
        if (!silent) {
            toast.success('캠페인 데이터를 불러왔습니다.', { id: 'load-campaign-success' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []); // setState 함수들은 안정적이므로 빈 배열

    // 사용자 정보 및 캠페인 데이터 로딩
    useEffect(() => {
        let isMounted = true;

        const loadCampaignData = async () => {
            if (!isInitialized || !user) return;

            try {
                // URL 파라미터 직접 추출
                const campaignId = searchParams?.get('id');
                const draftId = searchParams?.get('draftId');
                
                console.log('🔍 [데이터 로딩 시작]', { campaignId, draftId });

                // 1. 기존 캠페인 수정 모드
                if (campaignId) {
                    console.log('📥 [캠페인 로딩] ID:', campaignId);
                    
                    const { data: campaign, error } = await supabase
                        .from('campaigns')
                        .select('*')
                        .eq('id', campaignId)
                        .single();

                    if (campaign && !error && isMounted) {
                        console.log('✅ [캠페인 로딩 성공]', campaign);
                        handleLoadCompleted(campaign, true);
                        setCurrentDraftId(campaignId);
                    } else {
                        console.error('❌ [캠페인 로딩 실패]:', error);
                        toast.error('캠페인 정보를 불러오는데 실패했습니다.');
                    }
                    return;
                }

                // 2. 임시저장 불러오기
                if (draftId) {
                    console.log('📥 [임시저장 로딩] ID:', draftId);
                    
                    const draft = await loadDraft(user.id, draftId);
                    if (draft && isMounted) {
                        console.log('✅ [임시저장 로딩 성공]');
                        setCurrentDraftId(draft.id);
                        setCurrentStep(draft.currentStep);
                        setStep1Data(draft.step1Data);
                        setInitialStep1Data(draft.step1Data);
                        setStep2Data(draft.step2Data);
                        setInitialStep2Data(draft.step2Data);
                        if (draft.currentStep > 1) {
                            setStep1Complete(true);
                        }
                        toast.success('임시저장된 캠페인을 불러왔습니다.');
                    }
                }
            } catch (error) {
                console.error('❌ [데이터 로딩 오류]:', error);
            }
        };

        loadCampaignData();

        return () => {
            isMounted = false;
        };
    }, [isInitialized, user, searchParams, handleLoadCompleted]);

    const handleSaveDraft = async () => {
        console.log('--- 임시저장 시작 ---');
        
        if (!user) {
            toast.error('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
            return;
        }

        console.log('userId:', user.id);

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
            const draft = await saveDraft(user.id, {
                id: currentDraftId || undefined,
                title: step1Data.campaignTitle || step1Data.productName || step2Data?.campaignTitle || '제목 없음',
                campaignType: step1Data.campaignType,
                step1Data,
                step2Data,
                currentStep,
            });

            if (draft && draft.id) {
                setCurrentDraftId(draft.id);
                
                // URL 업데이트 (새로고침 시에도 데이터 유지)
                // 기존 캠페인 수정 중이면 id 유지, 신규 작성이면 draftId 사용
                const campaignId = searchParams?.get('id');
                if (campaignId) {
                    router.push(`/dashboard/campaign/new?id=${campaignId}`, { scroll: false });
                } else {
                    router.push(`/dashboard/campaign/new?draftId=${draft.id}`, { scroll: false });
                }
                
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

    // 자동 저장된 데이터 복구
    useEffect(() => {
        if (!isInitialized || !user) return; // 유저 정보가 없으면 실행하지 않음

        const id = searchParams?.get('id');
        const userSpecificKey = `campaign_draft_${user.id}`;
        const savedData = localStorage.getItem(userSpecificKey);

        // 레거시 키 확인 (이전 버전 호환성 혹은 잘못된 공유 방지)
        // 만약 레거시 키가 있고 유저별 키가 없다면? 
        // 보안상 다른 사람의 데이터일 수 있으므로, 명시적으로 내 것이 아니면 무시하는게 맞음.
        // 따라서 레거시 키(campaign_draft)는 이제 무시합니다.

        // 기존 캠페인 수정('id')이 아닐 때만 복구 다이얼로그 노출
        if (savedData && !id) {
            setShowRestoreDialog(true);
        }
    }, [searchParams, user, isInitialized]);

    // 자동 저장
    useEffect(() => {
        if (!isInitialized || !user) return;

        // 데이터가 비어있으면 저장하지 않음 (초기 로딩 시 덮어쓰기 방지)
        if (!step1Data && !step2Data) return;

        const userSpecificKey = `campaign_draft_${user.id}`;
        const draftData = {
            currentStep,
            step1Data,
            step2Data,
            savedAt: new Date().toISOString(),
        };
        localStorage.setItem(userSpecificKey, JSON.stringify(draftData));
    }, [currentStep, step1Data, step2Data, user, isInitialized]);

    // 임시 저장 데이터 복구
    const handleRestoreDraft = () => {
        if (!user) return;
        const userSpecificKey = `campaign_draft_${user.id}`;
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
        if (!user) return;
        const userSpecificKey = `campaign_draft_${user.id}`;
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
        console.log('🚀 handleFinalSubmit 시작');
        
        try {
            if (!user) {
                toast.error('로그인이 필요합니다.');
                router.push('/login');
                return;
            }

            console.log('👤 사용자 확인:', user);
            const userRole = profile?.role;

            const editId = searchParams?.get('id') || currentDraftId;
            let currentStatus = null;
            if (editId) {
                const { data: campaign } = await supabase
                    .from('campaigns')
                    .select('status')
                    .eq('id', editId)
                    .single();
                currentStatus = campaign?.status;
            }

            // 1. 유저 정의 구조에 따른 유형(type) 매핑
            const mappedType = step1Data.campaignType === 'DELIVERY' ? 'DELIVERY' : 'VISIT';

            // 2. 유저 정의 구조에 따른 플랫폼(platform) 매핑
            let mappedPlatform = 'PURCHASE';
            if (step1Data.includeNaver) mappedPlatform = 'BLOG';
            else if (step1Data.includeInstagram) mappedPlatform = 'INSTAGRAM';
            else if (step1Data.includeReview) mappedPlatform = 'PURCHASE';
            else if (step1Data.platform === 'BLOG') mappedPlatform = 'BLOG';
            else if (step1Data.platform === 'INSTAGRAM') mappedPlatform = 'INSTAGRAM';

            // [수정] 타이틀 결정 로직 개선
            // step1Data의 타이틀을 최우선으로 사용 (사용자가 Step 1에서 수정했을 가능성이 높음)
            const finalTitle = step1Data.campaignTitle || step1Data.productName || step2Data?.campaignTitle || '제목 없음';

            // [수정] step2Data에도 타이틀 동기화 (상세 페이지 등에서 데이터 일관성 유지)
            if (finalStep2Data) {
                finalStep2Data.campaignTitle = finalTitle;
            }

            // 캠페인 데이터 구성
            const campaignData: any = {
                title: finalTitle,
                description: step2Data.missionGuide || '',

                // 분류 정보 (유저 정의 구조 반영)
                type: mappedType,         // '방문형', '배송형'
                platform: mappedPlatform, // '블로그', '인스타', '기타'

                category: step1Data.category || null,
                region: step1Data.region || null,

                // 하이브리드 지원을 위한 개별 플래그 저장
                include_review: step1Data.includeReview || false,
                include_naver: step1Data.includeNaver || false,
                include_instagram: step1Data.includeInstagram || false,

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
                advertiser_will_contact: step1Data.advertiserWillContact || false, // 광고주 직접 연락
                visit_time: step1Data.visitTime || null,
                visit_time_negotiable: step1Data.visitTimeNegotiable || false, // 방문 시간 조율 필요
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
                option_config: step1Data.optionConfig || { mode: 'SINGLE', maxSelect: 1 },

                // 상태 제어
                status: isEdit
                    ? (currentStatus === 'DRAFT' ? (userRole === 'ADMIN' ? 'RECRUITING' : 'PENDING') : undefined)
                    : 'PENDING',

                // 전체 데이터 보존 (수정 시 정밀한 복구를 위함)
                campaign_options: [{
                    step1Data,
                    step2Data: finalStep2Data,
                    currentStep: isEdit ? 2 : 3,
                    savedAt: new Date().toISOString()
                }],
            };

            // 신규 등록일 때만 소유자 설정 (수정 시에는 기존 소유자 유지)
            if (!isEdit) {
                campaignData.created_by = user.id;
            }

            console.log('📦 캠페인 데이터:', campaignData);

            // Supabase에 저장 (수정 또는 신규 등록)
            // URL에 id가 있거나(수정), 이번 세션에서 임시저장된 id가 있는 경우 update 실행
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
                console.error('❌ 캠페인 저장 오류 (전체):', JSON.stringify(error, null, 2));
                console.error('❌ 에러 코드:', error.code);
                console.error('❌ 에러 메시지:', error.message);
                console.error('❌ 에러 힌트:', error.hint);
                console.error('❌ 에러 상세:', error.details);
                toast.error(`캠페인 저장 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
                return;
            }

            console.log('✅ 캠페인 저장 성공:', data);

            // 성공 시 임시 저장 데이터 삭제
            const userSpecificKey = `campaign_draft_${user.id}`;
            localStorage.removeItem(userSpecificKey);

            toast.success(editId ? '캠페인 정보가 업데이트되었습니다' : '캠페인이 요청되었습니다');

            // 역할(Role) 확인 후 적절한 페이지로 리다이렉트
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
                    {isInitialized && user && (
                        <CampaignLoader
                            userId={user.id}
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

// URL 파라미터를 key로 사용하여 컴포넌트 리마운트 강제
function SearchParamsWrapper() {
    const searchParams = useSearchParams();
    const campaignId = searchParams?.get('id');
    const draftId = searchParams?.get('draftId');
    
    // URL 파라미터가 변경되면 key가 변경되어 컴포넌트가 완전히 리마운트됨
    const key = campaignId ? `campaign-${campaignId}` : draftId ? `draft-${draftId}` : 'new';
    
    return <NewCampaignPageContent key={key} />;
}

export default function NewCampaignPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div></div>}>
            <SearchParamsWrapper />
        </Suspense>
    );
}
