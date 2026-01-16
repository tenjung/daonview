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
    Youtube,
    Phone,
    ExternalLink
} from 'lucide-react';
import { PlatformBadge, TypeBadge, RegionBadge, DDayBadge } from '@/components/CampaignCard';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import AdminControls from '@/components/AdminControls';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { updateInfluencerStats } from '@/lib/updateInfluencerStats';
import { formatDDay } from '@/lib/campaignUtils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";

interface CampaignDetailClientProps {
    campaign: any;
    id: string;
}

export default function CampaignDetailClient({ campaign: initialCampaign, id }: CampaignDetailClientProps) {
    const { user } = useAuthStore();
    const { items: cartItems, addItem, removeItem } = useCartStore();
    const [campaign, setCampaign] = useState(initialCampaign);
    const [hasApplied, setHasApplied] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState<any[]>([]); // Array for ranked/multi support
    const [applicationMessage, setApplicationMessage] = useState<string>('');
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isStatusChecking, setIsStatusChecking] = useState(false); // Only used for button loading state now
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [modalApi, setModalApi] = useState<CarouselApi>();

    // Sync modal carousel when it opens or external index changes
    useEffect(() => {
        if (!modalApi) return;
        modalApi.scrollTo(currentImageIndex);
    }, [modalApi, currentImageIndex, isImageModalOpen]);

    // Update current index when modal carousel scrolls
    useEffect(() => {
        if (!modalApi) return;
        modalApi.on("select", () => {
            setCurrentImageIndex(modalApi.selectedScrollSnap());
        });
    }, [modalApi]);

    // Check if campaign is in wishlist using Zustand store
    const isFavorite = cartItems.some(item => item.id === parseInt(id));

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
            // Only check application status (favorites handled by Zustand)
            const appResponse = await supabase
                .from('applications')
                .select('id, selected_option, application_message')
                .eq('user_id', currentUser.id)
                .eq('campaign_id', id)
                .maybeSingle();

            const appData = appResponse.data;

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

        const campaignId = parseInt(id);
        const wasInFavorites = isFavorite;

        try {
            if (wasInFavorites) {
                // Remove from DB first
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('campaign_id', id);

                if (error) {
                    console.error('Delete error:', error);
                    throw error;
                }

                // Only update Zustand if DB operation succeeded
                removeItem(campaignId);
                toast.success('관심 캠페인에서 제거되었습니다.');
            } else {
                // Add to DB first
                const { error } = await supabase
                    .from('favorites')
                    .insert({ user_id: user.id, campaign_id: id });

                if (error) {
                    // Check if it's a duplicate error (already exists)
                    if (error.code === '23505') {
                        console.log('Already in favorites, syncing Zustand...');
                        toast.info('이미 관심 캠페인에 추가되어 있습니다.');
                        return;
                    }
                    console.error('Insert error:', error);
                    throw error;
                }

                // Only update Zustand if DB operation succeeded
                addItem({
                    id: campaignId,
                    title: campaign.title,
                    imageUrl: campaign.thumbnail_url,
                    type: campaign.type,
                    platform: campaign.platform,
                    region: campaign.region,
                    applicants: campaign.applications?.[0]?.count ?? 0,
                    total: campaign.recruit_count,
                    dday: campaign.end_date || ''
                });
                toast.success('관심 캠페인에 추가되었습니다.');
            }
        } catch (error: any) {
            console.error('Error toggling favorite:', error);
            toast.error(error?.message || '오류가 발생했습니다.');
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
        const config = getOptionConfig();

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

            // 백그라운드에서 인플루언서 통계 업데이트 (하루 1회 제한)
            // await 없이 실행하여 사용자 경험에 영향 없음
            updateInfluencerStats(user.id).catch(err => {
                console.error('Stats update failed (non-blocking):', err);
            });
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
    const campaignOptions = Array.isArray(campaign.campaign_options) ? campaign.campaign_options[0] : campaign.campaign_options;
    const step1Data = campaignOptions?.step1Data || {};
    const step2Data = campaignOptions?.step2Data || {};

    const isAlwaysRecruiting = step1Data.scheduleType === 'always' || !campaign.end_date;
    const startDate = campaign.recruitment_start_date ? new Date(campaign.recruitment_start_date).toLocaleDateString() : new Date(campaign.created_at).toLocaleDateString();
    const endDateLabel = isAlwaysRecruiting ? '상시 모집' : (campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : '미정');
    // 캠페인 이미지 추출 로직 (JSONB 배열 및 개별 컬럼 모두 지원)
    const getCampaignImages = () => {
        const imageSet = new Set<string>();

        // 1. thumbnail_url (대표 이미지)
        if (campaign.thumbnail_url) imageSet.add(campaign.thumbnail_url);

        // 2. sub_image 컬럼들 (Legacy 대응)
        if (campaign.sub_image_1) imageSet.add(campaign.sub_image_1);
        if (campaign.sub_image_2) imageSet.add(campaign.sub_image_2);

        // 3. campaign_images (JSONB 배열)
        if (Array.isArray(campaign.campaign_images)) {
            campaign.campaign_images.forEach((img: any) => {
                if (img) imageSet.add(img);
            });
        }

        // 4. step2Data 내부 이미지 (Admin에서 등록한 경우)
        if (Array.isArray(step2Data.campaignImages)) {
            step2Data.campaignImages.forEach((img: any) => {
                if (img) imageSet.add(img);
            });
        }

        return Array.from(imageSet);
    };
    const images = getCampaignImages();

    // Robust Option Extraction
    const getOptions = () => {
        // 1. Check direct product_options (DB column)
        if (Array.isArray(campaign.product_options) && campaign.product_options.length > 0) {
            return campaign.product_options;
        }

        // 2. Check campaign_options (JSONB)
        const rootOptions = Array.isArray(campaign.campaign_options) ? campaign.campaign_options[0] : campaign.campaign_options;
        if (rootOptions) {
            // Case A: Directly under root
            if (Array.isArray(rootOptions.options) && rootOptions.options.length > 0) return rootOptions.options;
            if (Array.isArray(rootOptions.productOptions) && rootOptions.productOptions.length > 0) return rootOptions.productOptions;

            // Case B: Under step1Data
            const step1 = rootOptions.step1Data;
            if (step1) {
                if (Array.isArray(step1.options) && step1.options.length > 0) return step1.options;
                if (Array.isArray(step1.productOptions) && step1.productOptions.length > 0) return step1.productOptions;
            }
        }

        return [];
    };
    const options = getOptions();

    const getOptionConfig = () => {
        // 1. Check direct option_config (DB column)
        if (campaign.option_config) return campaign.option_config;

        // 2. Check campaign_options (JSONB)
        const rootOptions = Array.isArray(campaign.campaign_options) ? campaign.campaign_options[0] : campaign.campaign_options;
        if (rootOptions) {
            if (rootOptions.option_config) return rootOptions.option_config;
            if (rootOptions.step1Data?.optionConfig) return rootOptions.step1Data.optionConfig;
            if (rootOptions.optionConfig) return rootOptions.optionConfig;
        }

        return { mode: 'SINGLE', maxSelect: 1 };
    };
    const optionConfig = getOptionConfig();

    // Title fallback
    const displayTitle = step2Data.campaignTitle || campaign.title;

    // 캠페인 소개 (Step1에서 입력)
    const campaignIntro = campaign.description || campaign.experience_details || step1Data.experienceDetails || '';

    // 상세 가이드 (Step2에서 입력)
    const missionGuide = campaign.mission_guide || step2Data.missionGuide || step2Data.reviewMissionContent || '';

    // 키워드 추출 로직 개선 (메인/서브 분리)
    const mainKeywords = Array.isArray(campaign.keywords) && campaign.keywords.length > 0
        ? campaign.keywords
        : (typeof step2Data.blogMainKeyword === 'string' && step2Data.blogMainKeyword
            ? [step2Data.blogMainKeyword]
            : (Array.isArray(step2Data.keywords) ? step2Data.keywords : []));

    const subKeywords = Array.isArray(step2Data.blogSubKeywords) ? step2Data.blogSubKeywords : [];
    const instagramHashtags = Array.isArray(step2Data.instagramHashtags) ? step2Data.instagramHashtags : [];
    const photoCount = campaign.photo_count || step2Data.photoCount || '';
    const videoRequired = campaign.video_required || step2Data.videoRequired || 'no';

    // 추가 상세 정보 추출
    const category = campaign.category || step1Data.category || '';
    const region = campaign.region || step1Data.region || '';
    const contactPhone = campaign.contact_phone || step1Data.contactPhone || '';
    const advertiserWillContact = campaign.advertiser_will_contact || step1Data.advertiserWillContact || false;
    const visitTime = campaign.visit_time || step1Data.visitTime || '';
    const visitTimeNegotiable = campaign.visit_time_negotiable || step1Data.visitTimeNegotiable || false;
    const visitDays = Array.isArray(campaign.visit_days) ? campaign.visit_days : (step1Data.visitDays || []);
    const visitNotes = campaign.visit_notes || step1Data.visitNotes || '';
    const stores = Array.isArray(campaign.stores) ? campaign.stores : (step1Data.stores || []);

    // Recruitment Closure Logic
    const nowStr = new Date().toISOString().split('T')[0];
    const isPastDeadline = (campaign.end_date && !isAlwaysRecruiting) ? nowStr > campaign.end_date : false;
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
                {/* Breadcrumb - Reduced bottom margin */}
                <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-400">
                    <Link href="/campaigns" className="hover:text-rose-500 transition-colors flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> 캠페인 목록
                    </Link>
                </div>

                {/* Campaign Header Section: Badges & Title - Compressed spacing */}
                <div className="mb-6 mt-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <TypeBadge type={campaign.type} />
                        <PlatformBadge platform={campaign.platform} />
                        {campaign.type === 'VISIT' && <RegionBadge region={campaign.region} />}
                        <DDayBadge dday={isAlwaysRecruiting ? '상시' : formatDDay(campaign.end_date)} />
                        <AdminControls campaignId={campaign.id} createdBy={campaign.created_by} />
                    </div>

                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight tracking-tight truncate">
                        {displayTitle}
                    </h1>
                </div>

                {/* Main Layout: Left Content + Right Sticky Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Content Area (Scrollable) - Compressed vertical spacing */}
                    <div className="lg:col-span-7 space-y-5">
                        {/* Main Image Slider - Slightly reduced aspect for compactness */}
                        <div className="w-full bg-white rounded-2xl aspect-[4/3] border border-gray-100 flex items-center justify-center overflow-hidden relative shadow-md group">
                            {images.length > 0 ? (
                                <>
                                    <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                                        <DialogTrigger asChild>
                                            <img
                                                src={images[currentImageIndex]}
                                                alt={displayTitle}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in"
                                            />
                                        </DialogTrigger>
                                        <DialogContent className="max-w-[85vw] w-full h-[90vh] p-0 overflow-hidden border border-white/20 bg-white/5 backdrop-blur-2xl shadow-none flex flex-col items-center justify-center rounded-3xl outline-none">
                                            <style dangerouslySetInnerHTML={{
                                                __html: `
                                                [data-radix-portal] > div { background-color: rgba(0, 0, 0, 0.4) !important; }
                                            `}} />
                                            <DialogHeader className="sr-only">
                                                <DialogTitle>{displayTitle} 이미지 갤러리</DialogTitle>
                                            </DialogHeader>

                                            <div className="w-full flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
                                                <Carousel setApi={setModalApi} className="w-full h-full flex items-center justify-center">
                                                    <CarouselContent className="h-full items-center">
                                                        {images.map((img, idx) => (
                                                            <CarouselItem key={idx} className="flex items-center justify-center h-full">
                                                                <div className="w-full h-full flex items-center justify-center p-2">
                                                                    <img
                                                                        src={img}
                                                                        alt={`${displayTitle} - ${idx + 1}`}
                                                                        className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl transition-all duration-300"
                                                                    />
                                                                </div>
                                                            </CarouselItem>
                                                        ))}
                                                    </CarouselContent>
                                                    {images.length > 1 && (
                                                        <>
                                                            <CarouselPrevious className="left-4 w-12 h-12 bg-white/10 hover:bg-rose-500 border-none text-white transition-all scale-110 active:scale-95" />
                                                            <CarouselNext className="right-4 w-12 h-12 bg-white/10 hover:bg-rose-500 border-none text-white transition-all scale-110 active:scale-95" />
                                                        </>
                                                    )}
                                                </Carousel>
                                            </div>

                                            {/* Thumbnail Strip for UX */}
                                            {images.length > 1 && (
                                                <div className="w-full bg-white/5 backdrop-blur-xl p-6 flex justify-center gap-4 border-t border-white/10 mt-auto">
                                                    {images.map((img, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => modalApi?.scrollTo(idx)}
                                                            className={`relative w-16 h-16 rounded-xl overflow-hidden transition-all duration-500 hover:scale-105 ${idx === currentImageIndex
                                                                ? 'ring-4 ring-rose-500 ring-offset-4 ring-offset-black scale-110 shadow-2xl shadow-rose-500/40'
                                                                : 'opacity-30 hover:opacity-100 grayscale hover:grayscale-0'
                                                                }`}
                                                        >
                                                            <img src={img} alt="thumb" className="w-full h-full object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                    {images.length > 1 && (
                                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-gray-800 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-md"><ChevronLeft size={20} /></button>
                                            <button onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-gray-800 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-md"><ChevronRight size={20} /></button>
                                        </div>
                                    )}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={toggleFavorite}
                                        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white backdrop-blur-md shadow-md transition-all hover:scale-110"
                                    >
                                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                                    </Button>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {images.map((_, i) => (
                                            <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-gray-300 font-bold text-xl">NO IMAGE</div>
                            )}
                        </div>

                        {/* 제공 내역 Section - Professional Re-design */}
                        <section className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl">
                                    📦
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">제공 내역</h2>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Provision Details</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    {category && (
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">
                                            #{category}
                                        </span>
                                    )}
                                    {region && (
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">
                                            #{region}
                                        </span>
                                    )}
                                </div>

                                <div className="bg-slate-50/50 rounded-2xl p-7 border border-slate-100 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-[15px] font-medium text-slate-700 leading-8 whitespace-pre-line">
                                        {campaignIntro || '제공 내역 정보가 없습니다.'}
                                    </p>
                                    {campaign.official_price && (
                                        <div className="mt-6 pt-6 border-t border-slate-200/60 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-400">정가 안내</span>
                                            <p className="text-lg font-black text-slate-900">
                                                {parseInt(campaign.official_price).toLocaleString()}<span className="text-sm ml-1 font-bold">원</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* 체험 미션 Section - Professional Re-design */}
                        <section className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl">
                                    💰
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">체험 미션</h2>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Experience Mission</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                                    <p className="text-[11px] text-slate-400 font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> 📸 사진 촬영
                                    </p>
                                    <p className="font-black text-slate-900 text-base">{photoCount ? `${photoCount}장 이상` : '자율 촬영'}</p>
                                </div>
                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                                    <p className="text-[11px] text-slate-400 font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> 🎥 영상 포함
                                    </p>
                                    <p className="font-black text-slate-900 text-base">{videoRequired === 'yes' ? '필수 포함' : '선택 사항'}</p>
                                </div>
                            </div>

                            {/* 키워드 영역 - Unified Clean Style */}
                            <div className="space-y-4">
                                {mainKeywords.length > 0 && (
                                    <div className="p-6 bg-white rounded-2xl border border-slate-100">
                                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[10px] font-black mb-4 border border-rose-100">
                                            필수 키워드
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {mainKeywords.map((kw: string, i: number) => (
                                                <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-900 rounded-xl text-xs font-bold border border-slate-100">
                                                    #{kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {subKeywords.length > 0 && (
                                    <div className="p-6 bg-white rounded-2xl border border-slate-100">
                                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black mb-4 border border-slate-200">
                                            서브 키워드
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {subKeywords.map((kw: string, i: number) => (
                                                <span key={i} className="px-3 py-1.5 bg-white text-slate-600 rounded-xl text-xs font-medium border border-slate-100">
                                                    #{kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {instagramHashtags.length > 0 && (
                                    <div className="p-6 bg-white rounded-2xl border border-slate-100">
                                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-pink-50 text-pink-600 text-[10px] font-black mb-4 border border-pink-100">
                                            인스타그램 해시태그
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {instagramHashtags.map((kw: string, i: number) => (
                                                <span key={i} className="px-3 py-1.5 bg-pink-50/30 text-pink-600 rounded-xl text-xs font-bold border border-pink-100">
                                                    {kw.startsWith('#') ? kw : `#${kw}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {missionGuide && (
                                <div className="mt-6 p-7 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
                                    <p className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-[0.2em]">📝 상세 가이드</p>
                                    <div className="text-[14px] text-slate-300 leading-8 whitespace-pre-line font-medium">
                                        {missionGuide}
                                    </div>
                                </div>
                            )}

                            {(step2Data.prohibitedWords?.length > 0 || campaign.prohibited_words?.length > 0) && (
                                <div className="mt-4 p-5 bg-rose-50/30 rounded-2xl border border-rose-100 flex items-start gap-3">
                                    <div className="text-rose-500 mt-1">⚠️</div>
                                    <div>
                                        <p className="text-[11px] font-bold text-rose-500 mb-2 uppercase tracking-widest">금지 키워드</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(campaign.prohibited_words || step2Data.prohibitedWords).map((word: string, i: number) => (
                                                <span key={i} className="text-xs text-rose-600 font-bold">#{word}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* 방문 및 예약 안내 (방문형일 때만 노출) - Professional Re-design */}
                        {campaign.type === 'VISIT' && (
                            <section className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl">
                                        📅
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">방문 및 예약</h2>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visit & Reservation</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                                            <p className="text-[11px] text-slate-400 font-bold mb-2 uppercase tracking-widest">🗓️ 방문 요일</p>
                                            <p className="font-black text-slate-900 text-base">{visitDays.length > 0 ? visitDays.join(', ') : '무관'}</p>
                                        </div>
                                        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                                            <p className="text-[11px] text-slate-400 font-bold mb-2 uppercase tracking-widest">⏰ 방문 시간</p>
                                            <p className="font-black text-slate-900 text-base">
                                                {visitTimeNegotiable ? '조율 가능' : (visitTime || '무관')}
                                            </p>
                                        </div>
                                    </div>

                                    {visitNotes && (
                                        <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                                            <p className="text-[11px] text-amber-700 font-bold mb-2 uppercase tracking-widest">💡 참고사항</p>
                                            <p className="text-sm text-slate-700 leading-7 whitespace-pre-line font-medium">{visitNotes}</p>
                                        </div>
                                    )}

                                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">📞 예약 연락처</p>
                                            <p className="font-black text-white text-base">
                                                {advertiserWillContact ? '선정 후 광고주 직접 연락' : (contactPhone || '정보 없음')}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white">
                                            <Phone size={18} />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 매장 정보 (방문형일 때만 노출) - Professional Re-design */}
                        {campaign.type === 'VISIT' && stores.length > 0 && (
                            <section className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl">
                                        📍
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">매장 정보</h2>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Location Details</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {stores.map((store: any, i: number) => (
                                        <div key={i} className="p-7 bg-white rounded-3xl border border-slate-100 group hover:border-rose-200 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-lg font-black text-slate-900">{store.storeName}</h3>
                                                {store.naverPlaceUrl && (
                                                    <a
                                                        href={store.naverPlaceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5"
                                                    >
                                                        네이버 지도 <ExternalLink size={10} />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 py-4 px-5 bg-slate-50 rounded-2xl border border-slate-50">
                                                <MapPin size={16} className="text-slate-400 shrink-0" />
                                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                                    {store.address || '주소 정보 없음'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Sticky Panel (Desktop Only) - Expanded for balance */}
                    <div className="lg:col-span-5 relative">
                        <div className="lg:sticky lg:top-24">
                            <div id="options-section" className="bg-white rounded-3xl p-6 md:p-8 border-2 border-rose-100 shadow-xl min-h-[500px] flex flex-col">
                                {/* Campaign Info Cards */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {/* 체험 기간 */}
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-2xl border border-orange-200">
                                        <p className="text-[10px] text-orange-600 font-bold mb-1.5 uppercase tracking-wider">📅 체험 기간</p>
                                        <p className="text-sm font-black text-gray-900">{isAlwaysRecruiting ? '상시 모집' : startDate.replace('2025. ', '').replace('2026. ', '')}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                            {isAlwaysRecruiting ? '중지 시까지 무제한' : `~ ${endDateLabel.replace('2025. ', '').replace('2026. ', '')}`}
                                        </p>
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
                                                        {optionConfig.mode === 'RANKED' ? '지망 순위 선택' : '옵션 선택'}
                                                    </p>
                                                    {optionConfig.mode !== 'SINGLE' && (
                                                        <p className="text-[10px] text-rose-500 font-bold">
                                                            {selectedOptions.length} / {optionConfig.maxSelect || 1} 선택됨
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    {options.map((opt: any, idx: number) => {
                                                        const label = typeof opt === 'object' ? opt.optionName : opt;
                                                        const config = optionConfig;

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
                                                                className={`group relative w-full px-4 py-2.5 rounded-xl border text-left transition-all overflow-hidden ${isSelected
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

                                        {selectedOptions.length > 0 && optionConfig.mode === 'RANKED' && (
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
                                            className={`w-full py-4 rounded-xl text-base font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${isClosed
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
