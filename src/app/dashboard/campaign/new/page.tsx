'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import CampaignStep1 from '@/components/campaign/CampaignStep1';
import CampaignStep2 from '@/components/campaign/CampaignStep2';
import CampaignStep3 from '@/components/campaign/CampaignStep3';

const AUTOSAVE_KEY = 'campaign_draft';

export default function NewCampaignPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [step1Data, setStep1Data] = useState<any>(null);
    const [step2Data, setStep2Data] = useState<any>(null);
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);

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
            setStep2Data(draft.step2Data);
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
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        try {
            // 현재 로그인한 사용자 가져오기
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('로그인이 필요합니다.');
                router.push('/login');
                return;
            }

            // 캠페인 데이터 구성
            const campaignData = {
                user_id: user.id,
                title: step2Data.campaignTitle,
                campaign_type: step1Data.campaignType,
                platform: step1Data.platform || null,
                review_type: step1Data.reviewType || null,

                // 매장 정보 (JSON으로 저장)
                stores: step1Data.stores || [],
                contact_phone: step1Data.contactPhone || null,
                visit_time: step1Data.visitTime || null,
                visit_days: step1Data.visitDays || [],
                visit_notes: step1Data.visitNotes || null,
                experience_details: step1Data.experienceDetails || null,
                official_price: step1Data.officialPrice || null,

                // 모집 정보
                total_recruitment: parseInt(step1Data.totalRecruitment),
                reward_per_person: step1Data.rewardPerPerson,

                // 일정
                recruitment_start_date: step1Data.recruitmentStartDate,
                first_selection_date: step1Data.firstSelectionDate || null,
                review_deadline: step1Data.reviewDeadline || null,

                // 미션 가이드
                campaign_images: step2Data.campaignImages,
                text_length: step2Data.textLength,
                photo_count: step2Data.photoCount,
                video_required: step2Data.videoRequired,
                mission_guide: step2Data.missionGuide || null,
                keywords: step2Data.keywords,
                prohibited_words: step2Data.prohibitedWords,
                additional_notes: step2Data.additionalNotes || null,

                // 결제 정보
                payment_method: step3Data.paymentMethod,

                // 상태: 승인 대기
                status: 'PENDING',

                created_at: new Date().toISOString(),
            };

            // Supabase에 저장
            const { data, error } = await supabase
                .from('campaigns')
                .insert([campaignData])
                .select()
                .single();

            if (error) {
                console.error('캠페인 저장 오류:', error);
                toast.error('캠페인 등록 중 오류가 발생했습니다.');
                return;
            }

            // 성공 시 임시 저장 데이터 삭제
            localStorage.removeItem(AUTOSAVE_KEY);

            toast.success('캠페인이 성공적으로 등록되었습니다!');
            toast.info('관리자 승인 후 캠페인이 게시됩니다.');

            // 대시보드로 이동
            router.push('/dashboard/advertiser');

        } catch (error) {
            console.error('캠페인 등록 오류:', error);
            toast.error('캠페인 등록 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
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

                {/* 스텝 컨텐츠 */}
                {currentStep === 1 && (
                    <CampaignStep1
                        onNext={handleStep1Complete}
                        initialData={step1Data}
                    />
                )}

                {currentStep === 2 && (
                    <CampaignStep2
                        onNext={handleStep2Complete}
                        onPrev={handleBackToStep1}
                        initialData={step2Data}
                    />
                )}

                {currentStep === 3 && (
                    <CampaignStep3
                        onSubmit={handleFinalSubmit}
                        onPrev={handleBackToStep2}
                        step1Data={step1Data}
                        step2Data={step2Data}
                    />
                )}
            </div>
        </div>
    );
}
