'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    ChevronLeft,
    ChevronRight,
    MapPin,
    Package,
    Heart,
    ShoppingBag,
    PenTool,
    Instagram,
    Gift,
    ArrowRight,
    Youtube
} from 'lucide-react';
import { PlatformBadge, TypeBadge } from '@/components/CampaignCard';
import { useAuthStore } from '@/store/authStore';
import AdminControls from '@/components/AdminControls';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';

interface CampaignDetailClientProps {
    campaign: any;
    id: string;
}

export default function CampaignDetailClient({ campaign: initialCampaign, id }: CampaignDetailClientProps) {
    const { user } = useAuthStore();
    const [campaign, setCampaign] = useState(initialCampaign);
    const [isFavorite, setIsFavorite] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState<any[]>([]); // Array for ranked/multi support
    const [applicationMessage, setApplicationMessage] = useState<string>('');
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isStatusChecking, setIsStatusChecking] = useState(false); // Only used for button loading state now

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (!isMounted || !user) return;
            
            // Check status in background without blocking UI
            try {
                await checkUserStatus(user);
            } catch (err) {
                console.error('Init error:', err);
            }
        };
        init();
        return () => { isMounted = false; };
    }, [user?.id, id]);

    const fetchCampaign = async () => {
        const { data } = await supabase
            .from('campaigns')
            .select('*, applications(count)')
            .eq('id', id)
            .single();
        if (data) setCampaign(data);
    };

    async function checkUserStatus(currentUser: any) {
        if (!currentUser || !id) return;
        try {
            // Check both in parallel for better performance
            const [favResponse, appResponse] = await Promise.all([
                supabase
                    .from('favorites')
                    .select('id')
                    .eq('user_id', currentUser.id)
                    .eq('campaign_id', id)
                    .maybeSingle(),
                supabase
                    .from('applications')
                    .select('id, selected_option, application_message')
                    .eq('user_id', currentUser.id)
                    .eq('campaign_id', id)
                    .maybeSingle()
            ]);

            const favoriteData = favResponse.data;
            const appData = appResponse.data;

            setIsFavorite(!!favoriteData);

            if (appData) {
                setHasApplied(true);
                const optString = appData.selected_option || '';
                if (optString.includes('|')) {
                    setSelectedOptions(optString.split('|').map((s: string) => s.trim()));
                } else if (optString) {
                    setSelectedOptions([optString]);
                }
                setApplicationMessage(appData.application_message || '');
            }
        } catch (err) {
            console.error('Error in checkUserStatus:', err);
        }
    }

    async function toggleFavorite() {
        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        try {
            if (isFavorite) {
                await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('campaign_id', id);
                setIsFavorite(false);
                toast.success('관심 캠페인에서 제거되었습니다.');
            } else {
                await supabase
                    .from('favorites')
                    .insert({ user_id: user.id, campaign_id: id });
                setIsFavorite(true);
                toast.success('관심 캠페인에 추가되었습니다.');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error('오류가 발생했습니다.');
        }
    }

    async function handleApply() {
        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        // 중복 신청 방지
        if (hasApplied) {
            toast.error('이미 신청한 캠페인입니다.');
            return;
        }

        // 모집 인원 초과 체크
        const currentAppCount = campaign.applications?.[0]?.count ?? campaign.applications?.count ?? 0;
        if (currentAppCount >= campaign.recruit_count) {
            toast.error('모집 인원이 마감되었습니다.');
            return;
        }

        // 모집 기간 종료 체크
        if (campaign.end_date) {
            const endDate = new Date(campaign.end_date);
            const now = new Date();
            if (now > endDate) {
                toast.error('모집 기간이 종료된 캠페인입니다.');
                return;
            }
        }

        // 캠페인 상태 체크 (RECRUITING 상태만 신청 가능)
        if (campaign.status !== 'RECRUITING') {
            toast.error('현재 모집 중인 캠페인이 아닙니다.');
            return;
        }

        const currentOptions = getOptions();
        const config = campaign.option_config || { mode: 'SINGLE', maxSelect: 1 };
        
        if (currentOptions.length > 0 && selectedOptions.length === 0) {
            toast.error('제공 옵션을 선택해주세요.');
            document.getElementById('options-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Format selected options for storage
        let formattedOption = '';
        if (config.mode === 'RANKED') {
            formattedOption = selectedOptions.map((opt, i) => `${i + 1}지망: ${typeof opt === 'object' ? opt.optionName : opt}`).join(' | ');
        } else if (config.mode === 'MULTI') {
            formattedOption = selectedOptions.map(opt => typeof opt === 'object' ? opt.optionName : opt).join(' | ');
        } else {
            const opt = selectedOptions[0];
            formattedOption = typeof opt === 'object' ? opt.optionName : opt;
        }

        try {
            const { data, error } = await supabase
                .from('applications')
                .insert({
                    user_id: user.id,
                    campaign_id: id,
                    status: 'PENDING',
                    selected_option: formattedOption || null,
                    application_message: applicationMessage || null
                })
                .select();

            if (error) {
                console.error('Supabase error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            console.log('Application successful:', data);
            toast.success('캠페인 신청이 완료되었습니다!');
            setHasApplied(true);
            fetchCampaign();
        } catch (error: any) {
            console.error('Error applying:', error);
            console.error('Error type:', typeof error);
            console.error('Error keys:', Object.keys(error || {}));

            // 중복 신청 에러 처리
            if (error?.code === '23505') {
                toast.error('이미 신청한 캠페인입니다.');
                setHasApplied(true);
            } else {
                toast.error(error?.message || '신청 중 오류가 발생했습니다.');
            }
        }
    }

    async function confirmCancel() {
        try {
            const { data: appData } = await supabase
                .from('applications')
                .select('status')
                .eq('user_id', user.id)
                .eq('campaign_id', id)
                .single();

            if (appData?.status?.toUpperCase() !== 'PENDING') {
                toast.error('심사중인 신청만 취소할 수 있습니다.');
                return;
            }

            const { error } = await supabase
                .from('applications')
                .delete()
                .eq('user_id', user.id)
                .eq('campaign_id', id);

            if (error) throw error;

            toast.success('신청이 취소되었습니다.');
            setHasApplied(false);
            setSelectedOptions([]);
            setApplicationMessage('');
            fetchCampaign();
        } catch (error) {
            console.error('Error canceling application:', error);
            toast.error('취소 중 오류가 발생했습니다.');
        }
    }

    // UI Helpers (derived from campaign data)
    const appCount = campaign.applications?.[0]?.count ?? campaign.applications?.count ?? 0;
    const startDate = campaign.recruitment_start_date ? new Date(campaign.recruitment_start_date).toLocaleDateString() : new Date(campaign.created_at).toLocaleDateString();
    const endDate = campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : '미정';
    const images = [campaign.thumbnail_url, campaign.sub_image_1, campaign.sub_image_2].filter(Boolean);
    
    // Robust Option Extraction
    const getOptions = () => {
        // 1. Check product_options
        if (Array.isArray(campaign.product_options) && campaign.product_options.length > 0) {
            return campaign.product_options;
        }

        // 2. Check campaign_options
        if (Array.isArray(campaign.campaign_options) && campaign.campaign_options.length > 0) {
            // Case A: Array of strings directly (e.g., Campaign #22)
            if (typeof campaign.campaign_options[0] === 'string') {
                return campaign.campaign_options;
            }
            // Case B: Array of objects with step1Data (Admin format)
            const step1Options = campaign.campaign_options[0]?.step1Data?.options;
            if (Array.isArray(step1Options) && step1Options.length > 0) {
                return step1Options;
            }
        }

        // 3. Singular object fallback
        if (campaign.campaign_options?.step1Data?.options) {
            return campaign.campaign_options.step1Data.options;
        }

        return [];
    };
    const options = getOptions();

    // JSON options fallback (for data in step1Data/step2Data)
    const campaignOptions = Array.isArray(campaign.campaign_options) ? campaign.campaign_options[0] : campaign.campaign_options;
    const step1Data = campaignOptions?.step1Data || {};
    const step2Data = campaignOptions?.step2Data || {};

    // Title fallback
    const displayTitle = step2Data.campaignTitle || campaign.title;

    // 캠페인 소개 (Step1에서 입력)
    const campaignIntro = campaign.description || campaign.experience_details || step1Data.experienceDetails || '';
    
    // 상세 가이드 (Step2에서 입력)
    const missionGuide = campaign.mission_guide || step2Data.missionGuide || step2Data.reviewMissionContent || '';
    
    const keywords = Array.isArray(campaign.keywords) ? campaign.keywords :
        Array.isArray(step2Data.keywords) ? step2Data.keywords :
            typeof step2Data.blogMainKeyword === 'string' ? [step2Data.blogMainKeyword, ...(step2Data.blogSubKeywords || [])] : [];
    const photoCount = campaign.photo_count || step2Data.photoCount || '';
    const videoRequired = campaign.video_required || step2Data.videoRequired || 'no';

    // Recruitment Closure Logic
    const isPastDeadline = campaign.end_date ? new Date() > new Date(campaign.end_date) : false;
    const isFull = appCount >= campaign.recruit_count && campaign.recruit_count > 0;
    const isNotRecruiting = campaign.status !== 'RECRUITING';
    const isClosed = isPastDeadline || isFull || isNotRecruiting;

    let closureText = '';
    if (isPastDeadline) closureText = '모집 기간이 종료되었습니다';
    else if (isFull) closureText = '모집 인원이 마감되었습니다';
    else if (isNotRecruiting) closureText = '현재 신청 가능한 상태가 아닙니다';

    return (
        <div className="min-h-screen bg-gray-50/30 pb-24">
            <div className="container py-6 md:py-12 max-w-[1400px] w-full px-4 mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6 text-sm font-medium text-gray-400">
                    <Link href="/campaigns" className="hover:text-rose-500 transition-colors flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> 캠페인 목록
                    </Link>
                </div>

                {/* Main Layout: Left Content + Right Sticky Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Content Area (Scrollable) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Campaign Type Header */}
                        <div className="flex flex-wrap items-center gap-3">
                            <TypeBadge type={campaign.type} />
                            <PlatformBadge platform={campaign.platform} />
                            {campaign.type === 'VISIT' && (
                                <div className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold">
                                    📍 {campaign.region || '전국'}
                                </div>
                            )}
                            <AdminControls campaignId={campaign.id} createdBy={campaign.created_by} />
                        </div>

                        {/* Campaign Title */}
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight">
                            {displayTitle}
                        </h1>

                        {/* Main Image Slider */}
                        <div className="w-full bg-white rounded-3xl aspect-[16/10] border border-gray-100 flex items-center justify-center overflow-hidden relative shadow-lg group">
                            {images.length > 0 ? (
                                <>
                                    <img
                                        src={images[currentImageIndex]}
                                        alt={displayTitle}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    {images.length > 1 && (
                                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)} className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm text-gray-800 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg"><ChevronLeft size={24} /></button>
                                            <button onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)} className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm text-gray-800 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg"><ChevronRight size={24} /></button>
                                        </div>
                                    )}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={toggleFavorite}
                                        className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/90 hover:bg-white backdrop-blur-md shadow-lg transition-all hover:scale-110"
                                    >
                                        <Heart className={`w-6 h-6 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                                    </Button>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                        {images.map((_, i) => (
                                            <div key={i} className={`h-2 rounded-full transition-all ${i === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'}`} />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-gray-300 font-bold text-xl">NO IMAGE</div>
                            )}
                        </div>

                        {/* 제공 내역 Section */}
                        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-rose-200">
                                    📦
                                </div>
                                <h2 className="text-2xl font-black text-gray-900">제공 내역</h2>
                            </div>
                            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-100">
                                <p className="text-lg font-bold text-gray-900 leading-relaxed whitespace-pre-line">
                                    {campaignIntro || '제공 내역 정보가 없습니다.'}
                                </p>
                                {campaign.official_price && (
                                    <div className="mt-4 pt-4 border-t border-rose-200">
                                        <p className="text-sm text-gray-600">정가: <span className="text-lg font-black text-rose-600">{parseInt(campaign.official_price).toLocaleString()}원</span></p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 체험 미션 Section */}
                        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl shadow-lg shadow-blue-200">
                                    💰
                                </div>
                                <h2 className="text-2xl font-black text-gray-900">체험 미션</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-5 rounded-2xl border border-orange-200">
                                    <p className="text-xs text-orange-600 font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                        📸 사진 촬영
                                    </p>
                                    <p className="font-black text-gray-900 text-base">{photoCount ? `${photoCount}장 이상` : '자율 촬영'}</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 rounded-2xl border border-purple-200">
                                    <p className="text-xs text-purple-600 font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                        🎥 동영상 촬영
                                    </p>
                                    <p className="font-black text-gray-900 text-base">{videoRequired === 'yes' ? '필수 포함' : '선택 사항'}</p>
                                </div>
                            </div>

                            {keywords.length > 0 && (
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200">
                                    <p className="text-sm font-black text-blue-700 mb-3 uppercase tracking-widest flex items-center gap-2">
                                        🏷️ 필수 키워드
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {keywords.map((kw: string, i: number) => (
                                            <span key={i} className="px-4 py-2 bg-white text-blue-700 rounded-xl text-sm font-bold border border-blue-300 shadow-sm">
                                                #{kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {missionGuide && (
                                <div className="mt-6 p-6 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-200">
                                    <p className="text-sm font-black text-gray-900 mb-3">📝 상세 미션 가이드</p>
                                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                        {missionGuide}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Sticky Panel */}
                    <div className="lg:col-span-4">
                        <div className="lg:sticky lg:top-24">
                            <div id="options-section" className="bg-white rounded-3xl p-6 md:p-8 border-2 border-rose-100 shadow-xl min-h-[500px] flex flex-col">
                                {/* Campaign Info Cards */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {/* 체험 기간 */}
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-2xl border border-orange-200">
                                        <p className="text-[10px] text-orange-600 font-bold mb-1.5 uppercase tracking-wider">📅 체험 기간</p>
                                        <p className="text-sm font-black text-gray-900">{startDate.replace('2025. ', '').replace('2026. ', '')}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">~ {endDate.replace('2025. ', '').replace('2026. ', '')}</p>
                                    </div>
                                    
                                    {/* 신청 인원 */}
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-2xl border border-blue-200">
                                        <p className="text-[10px] text-blue-600 font-bold mb-1.5 uppercase tracking-wider">👥 신청 인원</p>
                                        <p className="text-sm font-black text-gray-900">
                                            <span className="text-rose-500">{appCount}</span> / {campaign.recruit_count}명
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                            {isClosed ? '마감됨' : `${campaign.recruit_count - appCount}명 남음`}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 mb-6"></div>

                        <h2 className="text-xl font-black text-gray-900 mb-2">신청 정보</h2>
                        <p className="text-xs text-gray-400 mb-6 font-medium">원하는 옵션과 메시지를 남겨주세요.</p>

                        {!hasApplied ? (
                            <div className="space-y-4">
                                {options.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                                {campaign.option_config?.mode === 'RANKED' ? '지망 순위 선택' : '옵션 선택'}
                                            </p>
                                            {campaign.option_config?.mode !== 'SINGLE' && (
                                                <p className="text-[10px] text-rose-500 font-bold">
                                                    {selectedOptions.length} / {campaign.option_config?.maxSelect || 1} 선택됨
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {options.map((opt: any, idx: number) => {
                                                const label = typeof opt === 'object' ? opt.optionName : opt;
                                                const config = campaign.option_config || { mode: 'SINGLE', maxSelect: 1 };
                                                
                                                // Find if this option is already selected and at what rank
                                                const selectedIdx = selectedOptions.findIndex(s => (typeof s === 'object' ? s.optionName : s) === label);
                                                const isSelected = selectedIdx !== -1;

                                                const handleOptionClick = () => {
                                                    if (config.mode === 'SINGLE') {
                                                        setSelectedOptions([opt]);
                                                    } else if (config.mode === 'MULTI') {
                                                        if (isSelected) {
                                                            setSelectedOptions(selectedOptions.filter((_, i) => i !== selectedIdx));
                                                        } else {
                                                            if (selectedOptions.length < (config.maxSelect || 1)) {
                                                                setSelectedOptions([...selectedOptions, opt]);
                                                            } else {
                                                                toast.error(`최대 ${config.maxSelect}개까지 선택 가능합니다.`);
                                                            }
                                                        }
                                                    } else if (config.mode === 'RANKED') {
                                                        if (isSelected) {
                                                            // Remove from rank
                                                            setSelectedOptions(selectedOptions.filter((_, i) => i !== selectedIdx));
                                                        } else {
                                                            if (selectedOptions.length < (config.maxSelect || 1)) {
                                                                setSelectedOptions([...selectedOptions, opt]);
                                                            } else {
                                                                toast.error(`최대 ${config.maxSelect}순위까지 선택 가능합니다.`);
                                                            }
                                                        }
                                                    }
                                                };

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={handleOptionClick}
                                                        className={`group relative w-full px-4 py-2.5 rounded-xl border text-left transition-all overflow-hidden ${
                                                            isSelected 
                                                            ? 'border-rose-500 bg-rose-50/50' 
                                                            : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                        <div className="flex flex-col gap-1 flex-1">
                                                            <p className={`text-xs font-bold ${isSelected ? 'text-rose-600' : 'text-gray-700'}`}>
                                                                {label}
                                                            </p>
                                                            {/* 가액/인원 노출 (0인 경우 숨김) */}
                                                            {typeof opt === 'object' && (
                                                                <div className="flex items-center gap-2">
                                                                    {opt.optionPrice && opt.optionPrice !== '0' && (
                                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                                            ({opt.optionPrice.toLocaleString()}원 상당)
                                                                        </span>
                                                                    )}
                                                                    {opt.recruitmentCount && opt.recruitmentCount !== '0' && (
                                                                        <span className="text-[10px] text-blue-500/70 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                                                                            모집 {opt.recruitmentCount}명
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                            {isSelected && config.mode === 'RANKED' && (
                                                                <span className="px-2 py-0.5 bg-rose-500 text-white rounded-md text-[10px] font-black">
                                                                    {selectedIdx + 1}지망
                                                                </span>
                                                            )}
                                                            {isSelected && config.mode === 'MULTI' && (
                                                                <div className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {selectedOptions.length > 0 && campaign.option_config?.mode === 'RANKED' && (
                                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">현재 선택 순위</p>
                                        <div className="space-y-1">
                                            {selectedOptions.map((s, i) => (
                                                <p key={i} className="text-[11px] text-gray-600 flex items-center gap-2">
                                                    <span className="w-3.5 h-3.5 bg-rose-100 text-rose-600 rounded flex items-center justify-center text-[8px] font-black">{i + 1}</span>
                                                    {typeof s === 'object' ? s.optionName : s}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">전달 메시지</p>
                                    <textarea
                                        value={applicationMessage}
                                        onChange={(e) => setApplicationMessage(e.target.value)}
                                        placeholder="광고주님이 좋아할 어필 포인트를 적어주세요!"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:border-rose-300 focus:bg-white outline-none transition-all placeholder:text-gray-300 min-h-[100px] resize-none"
                                    />
                                </div>

                                <button
                                    onClick={handleApply}
                                    disabled={isClosed || !user}
                                    className={`w-full py-4 rounded-xl text-base font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
                                        isClosed 
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                                        : !user 
                                            ? 'bg-gray-800 text-white' 
                                            : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200'
                                    }`}
                                >
                                    {isClosed ? closureText : user ? '캠페인 신청하기' : '로그인이 필요합니다'}
                                    {!isClosed && <ArrowRight size={18} />}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="p-6 bg-emerald-50 rounded-2xl text-emerald-600 mb-6 font-bold text-sm">
                                    신청 완료된 캠페인입니다 ✨
                                </div>
                                <button onClick={() => setShowCancelDialog(true)} className="text-gray-400 hover:text-rose-500 text-xs font-bold underline transition-all underline-offset-4">신청 취소하기</button>
                            </div>
                        )}
                    </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
                title="캠페인 신청 취소"
                message="정말로 이 캠페인 신청을 취소하시겠습니까? 심사 중인 상태에서만 취소 가능합니다."
                onConfirm={confirmCancel}
                confirmText="신청 취소"
                type="danger"
            />
        </div>
    );
}
