'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    MapPin,
    Package,
    Heart,
    ShoppingBag,
    PenTool,
    Instagram,
    PenLine,
    Target,
    CalendarCheck,
    Calendar,
    Users,
    Gift,
    ArrowRight,
    Youtube,
    Phone,
    ExternalLink,
    ChevronDown,
    CheckCircle2,
    Info,
    Camera
} from 'lucide-react';
import CampaignShare from '@/components/campaign/CampaignShare';
import CampaignCard from '@/components/CampaignCard';
import { PlatformBadge, TypeBadge, RegionBadge, DDayBadge } from '@/components/campaign/CampaignBadges';
import NaverMap from '@/components/campaign/NaverMap';
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import PhoneInputModal from '@/components/PhoneInputModal';
import ReviewSubmitModal from '@/components/influencer/ReviewSubmitModal';


interface CampaignDetailClientProps {
    campaign: any;
    id: string;
}

export default function CampaignDetailClient({ campaign: initialCampaign, id }: CampaignDetailClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, profile } = useAuthStore();
    const { items: cartItems, addItem, removeItem } = useCartStore();
    const [campaign, setCampaign] = useState(initialCampaign);
    const [hasApplied, setHasApplied] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<any[]>([]); // Array for ranked/multi support
    const [applicationMessage, setApplicationMessage] = useState<string>('');
    // Missing Profile Info Alert State
    const [isProfileAlertOpen, setIsProfileAlertOpen] = useState(false);
    const [missingInfoType, setMissingInfoType] = useState<'BANK' | 'ADDRESS' | null>(null);
    const [selectedStore, setSelectedStore] = useState<any>(null);
    const [isStoreSheetOpen, setIsStoreSheetOpen] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isStatusChecking, setIsStatusChecking] = useState(false); // Only used for button loading state now
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [modalApi, setModalApi] = useState<CarouselApi>();
    const [isApplySheetOpen, setIsApplySheetOpen] = useState(false);
    const [isOptionsExpanded, setIsOptionsExpanded] = useState(true);
    const [relatedCampaigns, setRelatedCampaigns] = useState<any[]>([]);
    const [relatedApi, setRelatedApi] = useState<CarouselApi>();
    const [isApplying, setIsApplying] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [applicationId, setApplicationId] = useState<number>(0);
    const [mainApi, setMainApi] = useState<CarouselApi>();


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

    // Update current index when main carousel scrolls
    useEffect(() => {
        if (!mainApi) return;
        mainApi.on("select", () => {
            setCurrentImageIndex(mainApi.selectedScrollSnap());
        });
    }, [mainApi]);

    // Check if campaign is in wishlist using Zustand store
    const isFavorite = cartItems.some(item => item.id === parseInt(id));
    const isAdmin = profile?.role === 'ADMIN';

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

    // Fetch Related Campaigns
    useEffect(() => {
        const fetchRelatedCampaigns = async () => {
            if (!campaign?.created_by) return;

            try {
                // 1. Same brand campaigns
                const { data: brandData } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('created_by', campaign.created_by)
                    .neq('id', campaign.id)
                    .limit(8);

                let merged = brandData || [];

                if (merged.length < 4) {
                    const { data: alwaysData } = await supabase
                        .from('campaigns')
                        .select('*')
                        .eq('is_always', true)
                        .neq('id', campaign.id)
                        .not('id', 'in', `(${merged.map(c => c.id).join(',') || '0'})`)
                        .limit(8 - merged.length);

                    merged = [...merged, ...(alwaysData || [])];
                }

                setRelatedCampaigns(merged);
            } catch (error) {
                console.error('Error fetching related campaigns:', error);
            }
        };

        fetchRelatedCampaigns();
    }, [campaign.created_by, campaign.id]);

    const fetchCampaign = async () => {
        // Fetch campaign details along with counts for all vs approved applications
        const { data } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single();

        if (data) {
            // Get total application count
            const { count: totalCount } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', id);

            // Get approved application count
            const { count: approvedCount } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', id)
                .in('status', ['SELECTED', 'APPROVED']);

            setCampaign({
                ...data,
                total_app_count: totalCount || 0,
                approved_app_count: approvedCount || 0
            });
        }
    };

    async function checkUserStatus(currentUser: any) {
        if (!currentUser || !id) return;
        try {
            // Only check application status (favorites handled by Zustand)
            const { data: appData } = await supabase
                .from('applications')
                .select('id, selected_option, application_message, status')
                .eq('user_id', currentUser.id)
                .eq('campaign_id', id)
                .neq('status', 'CANCELLED')
                .maybeSingle();
            if (appData) {
                setHasApplied(true);
                setApplicationId(appData.id);
                setApplicationStatus(appData.status);
                const optString = appData.selected_option || '';
                if (optString.includes('|')) {
                    setSelectedOptions(optString.split('|').map((s: string) => s.trim()));
                } else if (optString) {
                    setSelectedOptions([optString]);
                }
                setApplicationMessage(appData.application_message || '');
            } else {
                setHasApplied(false);
                setApplicationStatus(null);
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
                    applicants: campaign.total_app_count || 0,
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
            router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
            return;
        }

        // 중복 신청 방지
        if (hasApplied) {
            toast.error('이미 신청한 캠페인입니다.');
            return;
        }

        // 모집 인원(선정 인원) 초과 체크 - 선정 완료된 인원 기준
        const approvedCount = campaign.approved_app_count || 0;
        if (approvedCount >= campaign.recruit_count && campaign.recruit_count > 0) {
            toast.error('선정 인원이 마감되었습니다.');
            return;
        }

        // 모집 기간 종료 체크
        if (campaign.end_date) {
            const endDate = new Date(campaign.end_date);
            const now = new Date();
            // 시간까지는 정확히 안 따지고 날짜 기준으로 체크하도록 함
            if (now > endDate && !isAlwaysRecruiting) {
                toast.error('모집 기간이 종료된 캠페인입니다.');
                return;
            }
        }

        // 캠페인 상태 체크 (RECRUITING 상태만 신청 가능)
        if (campaign.status !== 'RECRUITING') {
            toast.error('현재 모집 중인 캠페인이 아닙니다.');
            return;
        }

        // 프로필 필수 정보 검증 (배송형/구매평 케이스)
        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) {
                toast.error('사용자 정보를 불러올 수 없습니다.');
                return;
            }

            // 🔥 전화번호 체크 (모든 캠페인 신청 시 필수) - 공백 및 길이 검증 강화
            if (!profile.phone_number || profile.phone_number.trim().length < 10) {
                setShowPhoneModal(true);
                return;
            }

            const campaignType = campaign.type?.toUpperCase();

            if (campaignType === 'PURCHASE') {
                // 구매평 캠페인: 계좌 정보 필수
                if (!profile.bank_name || !profile.account_number || !profile.account_holder) {
                    setMissingInfoType('BANK');
                    setIsProfileAlertOpen(true);
                    return;
                }
            } else if (campaignType === 'DELIVERY') {
                // 단순 배송형 캠페인: 배송지 정보 필수
                if (!profile.zip_code || !profile.address_base || !profile.address_detail || !profile.name || !profile.phone_number) {
                    setMissingInfoType('ADDRESS');
                    setIsProfileAlertOpen(true);
                    return;
                }
            }
        } catch (err) {
            console.error('Profile validation error:', err);
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

        if (isApplying) return;
        setIsApplying(true);

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

            // 상태 즉시 업데이트
            setHasApplied(true);
            setApplicationStatus('PENDING');
            toast.success('캠페인 신청이 완료되었습니다!');

            fetchCampaign();

            // 캠페인 생성자(광고주/관리자)에게 마일스톤 알림 발송
            if (campaign.created_by) {
                // 현재 총 신청자 수 다시 확인 (정확한 유효 신청자 수)
                const { count: currentCount } = await supabase
                    .from('applications')
                    .select('*', { count: 'exact', head: true })
                    .eq('campaign_id', id);

                if (currentCount !== null) {
                    const recruitCount = campaign.recruit_count;
                    const milestones = [
                        { percent: 50, count: Math.floor(recruitCount * 0.5) },
                        { percent: 100, count: recruitCount },
                        { percent: 120, count: Math.floor(recruitCount * 1.2) }
                    ];

                    const milestone = milestones.find(m => m.count === currentCount);

                    if (milestone) {
                        const message = milestone.percent === 120
                            ? `[${campaign.title}] 캠페인 모집 인원이 정원의 ${milestone.percent}%를 초과했습니다! 🔥`
                            : `[${campaign.title}] 캠페인 모집 인원이 정원의 ${milestone.percent}%를 달성했습니다! 🎉`;

                        await supabase.from('notifications').insert({
                            user_id: campaign.created_by,
                            type: 'CAMPAIGN_MILESTONE',
                            title: `📈 모집 현황 ${milestone.percent}% 달성`,
                            content: message,
                            link: `/dashboard/advertiser/applicants?campaignId=${id}`
                        });
                    }
                }
            }

        } catch (error: any) {
            console.error('Error applying:', error);
            // 중복 신청 에러 처리 (DB 제약 조건 위반 포함)
            if (error?.code === '23505') {
                toast.error('이미 신청한 캠페인입니다.');
                setHasApplied(true);
            } else {
                toast.error(error?.message || '신청 중 오류가 발생했습니다.');
            }
        } finally {
            setIsApplying(false);
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
            setApplicationStatus(null); // 상태 초기화
            setSelectedOptions([]);
            setApplicationMessage('');
            fetchCampaign();
        } catch (error) {
            console.error('Error canceling application:', error);
            toast.error('취소 중 오류가 발생했습니다.');
        }
    }

    // UI Helpers (derived from campaign data)
    const appCount = campaign.total_app_count ?? campaign.applications?.[0]?.count ?? campaign.applications?.count ?? 0;
    const approvedCount = campaign.approved_app_count ?? 0;
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
        // [무결성] campaign_options 내의 데이터가 폼 상태와 더 밀접하므로 우선 순위 부여
        const rootOptions = Array.isArray(campaign.campaign_options) ? campaign.campaign_options[0] : campaign.campaign_options;
        if (rootOptions) {
            if (rootOptions.step1Data?.optionConfig) return rootOptions.step1Data.optionConfig;
            if (rootOptions.optionConfig) return rootOptions.optionConfig;
            if (rootOptions.option_config) return rootOptions.option_config;
        }

        // 2. Check direct option_config (DB column)
        if (campaign.option_config) return campaign.option_config;

        return { mode: 'SINGLE', maxSelect: 1 };
    };
    const optionConfig = getOptionConfig();

    // Title fallback
    const displayTitle = step2Data.campaignTitle || campaign.title;

    // 캠페인 소개 (Step1에서 입력)
    const campaignIntro = campaign.description || campaign.experience_details || step1Data.experienceDetails || '';

    // 구매평 가이드 (Step2 구매평 영역)
    const purchaseNotes = step2Data.purchaseNotes || campaign.purchase_notes || '';
    const purchaseReviewGuide = step2Data.reviewMissionContent || campaign.review_mission_content || '';

    // 상세 가이드 (Step2 블로그/인스타 가이드 영역)
    const missionGuide = campaign.mission_guide || step2Data.missionGuide || '';
    const blogTitleGuide = step2Data.blogTitleGuide || '';
    const blogContentGuide = step2Data.blogContentGuide || '';
    const additionalNotes = step2Data.additionalNotes || '';

    // 키워드 추출 로직 개선 (메인/서브 분리)
    const mainKeywords = Array.isArray(step2Data.blogMainKeywords) && step2Data.blogMainKeywords.length > 0
        ? step2Data.blogMainKeywords
        : (Array.isArray(campaign.keywords) && campaign.keywords.length > 0
            ? campaign.keywords
            : (typeof step2Data.blogMainKeyword === 'string' && step2Data.blogMainKeyword
                ? [step2Data.blogMainKeyword]
                : (Array.isArray(step2Data.keywords) ? step2Data.keywords : [])));

    const subKeywords = Array.isArray(step2Data.blogSubKeywords) ? step2Data.blogSubKeywords : [];
    const instagramHashtags = Array.isArray(step2Data.instagramHashtags) ? step2Data.instagramHashtags : [];
    const photoCount = campaign.photo_count || step2Data.photoCount || '';
    const videoRequired = campaign.video_required || step2Data.videoRequired || 'no';

    // 추가 상세 정보 추출
    const category = campaign.category || step1Data.category || '';
    const region = campaign.region || step1Data.region || '';
    const contactPhone = campaign.contact_phone || step1Data.contactPhone || '';
    const contactMethod = campaign.contact_method || step1Data.contactMethod || 'TEXT_ONLY';
    const advertiserWillContact = campaign.advertiser_will_contact || step1Data.advertiserWillContact || false;
    const visitTime = campaign.visit_time || step1Data.visitTime || '';
    const visitTimeNegotiable = campaign.visit_time_negotiable || step1Data.visitTimeNegotiable || false;
    const visitDays = Array.isArray(campaign.visit_days) ? campaign.visit_days : (step1Data.visitDays || []);
    const visitNotes = campaign.visit_notes || step1Data.visitNotes || '';
    // 우선순위: store_locations (DB 컬럼) > campaign_options.stores (레거시)
    // store_locations에 좌표가 저장되어 있으면 API 호출 없이 지도 표시 가능
    const stores = Array.isArray(campaign.store_locations) && campaign.store_locations.length > 0
        ? campaign.store_locations
        : (Array.isArray(campaign.stores) ? campaign.stores : (step1Data.stores || []));

    // Recruitment Closure Logic
    const nowStr = new Date().toISOString().split('T')[0];
    const isPastDeadline = (campaign.end_date && !isAlwaysRecruiting) ? nowStr > campaign.end_date : false;
    const isFull = approvedCount >= campaign.recruit_count && campaign.recruit_count > 0;
    const isNotRecruiting = campaign.status !== 'RECRUITING';
    const isClosed = isPastDeadline || isFull || isNotRecruiting;

    let closureText = '';
    if (isPastDeadline) closureText = '모집 기간이 종료되었습니다';
    else if (isFull) closureText = '선정 완료되어 마감되었습니다';
    else if (isNotRecruiting) closureText = '현재 신청 가능한 상태가 아닙니다';

    return (
        <div className="bg-white pb-0">
            <div className="container py-4 md:py-8 max-w-[1240px] w-full px-6 mx-auto">
                {/* Breadcrumb - Reduced bottom margin */}
                <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-400">
                    <Link href="/campaigns" className="hover:text-rose-500 transition-colors flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> 캠페인 목록
                    </Link>
                </div>

                {/* Campaign Header Section */}
                <div className="mb-6 mt-0 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <TypeBadge type={campaign.type} />

                            {/* 배송형일 경우 includeReview, includeNaver, includeInstagram 체크하여 뱃지 표시 */}
                            {campaign.type?.toUpperCase() === 'DELIVERY' ? (
                                <>
                                    {step1Data.includeReview && <PlatformBadge platform="PURCHASE" />}
                                    {step1Data.includeNaver && <PlatformBadge platform="BLOG" />}
                                    {step1Data.includeInstagram && <PlatformBadge platform="INSTAGRAM" />}
                                    {/* 위 항목들이 하나도 없을 때만 기본 platform 표시 (하위 호환) */}
                                    {!step1Data.includeReview && !step1Data.includeNaver && !step1Data.includeInstagram && (
                                        <PlatformBadge platform={campaign.platform} />
                                    )}
                                </>
                            ) : (
                                <PlatformBadge platform={campaign.platform} />
                            )}

                            {campaign.type?.toUpperCase() === 'VISIT' && <RegionBadge region={campaign.region} />}
                            <DDayBadge dday={isAlwaysRecruiting ? '상시' : formatDDay(campaign.end_date)} />
                        </div>
                        <AdminControls campaignId={campaign.id} createdBy={campaign.created_by} />
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight tracking-tight">
                        {displayTitle}
                    </h1>
                </div>

                {/* Main Layout: Left Content + Right Sticky Aside */}
                <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-slate-100">
                    {/* Left Content Area (Scrollable) */}
                    <div className="lg:col-span-8 pb-10 pr-2 md:pr-6">
                        {/* Main Image Slider */}
                        <div className="pt-4 mb-8">
                            <div className="w-full max-w-xl mx-auto">
                                <div className="w-full h-auto rounded-2xl overflow-hidden shadow-sm relative group bg-slate-50 border border-slate-100 aspect-square">
                                    {images.length > 0 ? (
                                        <>
                                            <Carousel 
                                                setApi={setMainApi} 
                                                className="w-full h-full"
                                                opts={{
                                                    loop: true,
                                                    align: "start",
                                                }}
                                            >
                                                <CarouselContent className="h-full ml-0">
                                                    {images.map((img, index) => (
                                                        <CarouselItem key={index} className="pl-0 h-full">
                                                            <div className="relative w-full h-full cursor-zoom-in" onClick={() => setIsImageModalOpen(true)}>
                                                                <img
                                                                    src={img}
                                                                    alt={`${displayTitle} - ${index + 1}`}
                                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                                />
                                                            </div>
                                                        </CarouselItem>
                                                    ))}
                                                </CarouselContent>
                                                
                                                {/* Full Screen Modal Integrated with Dialog */}
                                                <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                                                    <DialogContent className="max-w-[100vw] w-full h-[100vh] p-0 overflow-hidden border-none bg-black/60 backdrop-blur-md shadow-none flex flex-col items-center justify-center outline-none z-[100]">
                                                        <style dangerouslySetInnerHTML={{
                                                            __html: `
                                                            [data-radix-portal] > div[data-state='open'] { background-color: rgba(0, 0, 0, 0.4) !important; }
                                                        `}} />
                                                        <DialogHeader className="sr-only">
                                                            <DialogTitle>{displayTitle} 이미지 확대</DialogTitle>
                                                        </DialogHeader>

                                                        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/40 to-transparent z-50 flex items-center justify-end px-6 pointer-events-none">
                                                            <button
                                                                onClick={() => setIsImageModalOpen(false)}
                                                                className="pointer-events-auto bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-md text-sm font-bold transition-all border border-white/10"
                                                            >
                                                                닫기
                                                            </button>
                                                        </div>

                                                        <div
                                                            className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center py-10 px-4 md:px-0 scrollbar-hide"
                                                            onClick={(e) => {
                                                                if (e.target === e.currentTarget) setIsImageModalOpen(false);
                                                            }}
                                                        >
                                                            <img
                                                                src={images[currentImageIndex]}
                                                                alt={`${displayTitle} - Expanded`}
                                                                className="w-full max-w-3xl h-auto object-contain shadow-2xl rounded-sm"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>

                                                {/* Navigation Arrows for Main View */}
                                                {images.length > 1 && (
                                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                mainApi?.scrollPrev();
                                                            }}
                                                            className="pointer-events-auto w-9 h-9 rounded-full bg-white/80 backdrop-blur text-slate-700 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-md active:scale-95"
                                                        >
                                                            <ChevronLeft size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                mainApi?.scrollNext();
                                                            }}
                                                            className="pointer-events-auto w-9 h-9 rounded-full bg-white/80 backdrop-blur text-slate-700 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-md active:scale-95"
                                                        >
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Indicator Dots */}
                                                {images.length > 1 && (
                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10">
                                                        {images.map((_, i) => (
                                                            <div key={i} className={`h-1.5 rounded-full transition-all shadow-sm ${i === currentImageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`} />
                                                        ))}
                                                    </div>
                                                )}
                                            </Carousel>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold text-lg">NO IMAGE</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 제공 내역 Section */}
                        <section className="py-10 border-t border-slate-100">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                    <Gift className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">제공 내역</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Provision Details</p>
                                </div>
                            </div>

                            <div className="space-y-6">


                                <div className="relative overflow-hidden">
                                    <p className="text-[16px] text-slate-600 leading-[1.8] whitespace-pre-line font-medium">
                                        {campaignIntro || '제공 내역 정보가 없습니다.'}
                                    </p>
                                    {campaign.official_price && (
                                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
                                            <span className="text-sm font-bold text-slate-400">정가</span>
                                            <p className="text-xl font-bold text-slate-900">
                                                {parseInt(campaign.official_price).toLocaleString()}<span className="text-sm ml-1 font-medium">원</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* 체험 미션 Section */}
                        <section id="guide" className="py-10 border-t border-slate-100">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                    <Target className="w-5 h-5" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">체험 미션 가이드</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Experience Mission Guide</p>
                                </div>
                            </div>

                            <div className="space-y-12">
                                {/* 1. 구매평 작성 가이드 (배송형 + 구매평 미션이 있을 때) */}
                                {(purchaseReviewGuide || purchaseNotes) && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                                <ShoppingBag size={20} strokeWidth={2.5} />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">구매평 작성 가이드</h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {purchaseNotes && (
                                                <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
                                                    <p className="text-[11px] text-blue-600 font-bold mb-2 uppercase tracking-widest">💡 구매 시 주의사항</p>
                                                    <p className="text-sm text-slate-700 leading-7 whitespace-pre-line font-medium">{purchaseNotes}</p>
                                                </div>
                                            )}
                                            {purchaseReviewGuide && (
                                                <div className="p-7 bg-slate-50 rounded-3xl border border-slate-100">
                                                    <p className="text-[11px] text-slate-400 font-bold mb-4 uppercase tracking-widest text-left">✍️ 구매평 미션 내용</p>
                                                    <div className="text-[14px] text-slate-700 leading-8 whitespace-pre-line font-medium">
                                                        {purchaseReviewGuide}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 2. 플랫폼 포스팅 가이드 (블로그/인스타그램 등) */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                                            {campaign.platform?.toUpperCase().includes('INSTAGRAM') ? <Instagram size={20} strokeWidth={2.5} /> : <PenTool size={20} strokeWidth={2.5} />}
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900">
                                            {campaign.platform?.toUpperCase().includes('BLOG') ? '네이버 블로그 포스팅 가이드' :
                                                campaign.platform?.toUpperCase().includes('INSTAGRAM') ? '인스타그램 업로드 가이드' :
                                                    `${campaign.platform || '플랫폼'} 가이드`}
                                        </h3>
                                    </div>

                                    {/* 사진/영상 조건 */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                                            <p className="text-[11px] text-slate-400 font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> 📸 사진 촬영
                                            </p>
                                            <p className="font-black text-slate-900 text-base">{photoCount ? `${photoCount}장 이상` : '자율 촬영'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                                            <p className="text-[11px] text-slate-400 font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> 🎥 영상 포함
                                            </p>
                                            <p className="font-black text-slate-900 text-base">{videoRequired === 'yes' ? '필수 포함' : '선택 사항'}</p>
                                        </div>
                                    </div>

                                    {/* 키워드 가이드 (블로그용) */}
                                    {(mainKeywords.length > 0 || subKeywords.length > 0) && (
                                        <div className="space-y-4">
                                            {mainKeywords.length > 0 && (
                                                <div className="p-6 bg-white rounded-2xl border border-slate-100">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[10px] font-black border border-purple-100 text-left">
                                                            필수 메인 키워드
                                                        </div>
                                                        <span className="text-[11px] font-bold text-purple-500 bg-purple-50/50 px-2 py-0.5 rounded-full border border-purple-100 animate-pulse">
                                                            💡 1개 선택하여 작성
                                                        </span>
                                                    </div>

                                                    <div className="p-4 bg-purple-50/20 rounded-xl border border-dashed border-purple-100 mb-4">
                                                        <p className="text-[13px] text-slate-600 font-bold leading-relaxed">
                                                            인플루언서 미션: 아래의 키워드 중 <span className="text-purple-600">가장 자신 있는 키워드 1개를 선택</span>하여 포스팅 제목과 본문에 포함해주세요.
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {mainKeywords.map((kw: string, i: number) => (
                                                            <span key={i} className="px-4 py-2 bg-white text-purple-900 rounded-xl text-sm font-bold border border-purple-200 shadow-sm hover:border-purple-400 hover:text-purple-600 transition-all cursor-default">
                                                                #{kw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {subKeywords.length > 0 && (
                                                <div className="p-6 bg-white rounded-2xl border border-slate-100">
                                                    <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black mb-4 border border-emerald-100 text-left">
                                                        서브 키워드
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {subKeywords.map((kw: string, i: number) => (
                                                            <span key={i} className="px-3 py-1.5 bg-emerald-50/30 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100">
                                                                #{kw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 인스타그램 해시태그 */}
                                    {instagramHashtags.length > 0 && (
                                        <div className="p-6 bg-white rounded-2xl border border-slate-100">
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-pink-50 text-pink-600 text-[10px] font-black mb-4 border border-pink-100 text-left">
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

                                    {/* 상세 포스팅 가이드 (제목 + 본문 통합) */}
                                    {(blogTitleGuide || blogContentGuide || missionGuide) && (
                                        <div className="p-7 bg-white rounded-2xl border border-slate-100 space-y-10">
                                            {/* 제목 가이드 섹션 */}
                                            <div>
                                                <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black mb-4 border border-indigo-100 text-left">
                                                    제목 가이드
                                                </div>
                                                <div className="text-[16px] text-slate-900 leading-8 whitespace-pre-line font-bold pl-1">
                                                    {blogTitleGuide || '노출 잘되는 제목 필수 키워드를 하나 선택하여 자연스럽게 조합해주세요'}
                                                </div>
                                            </div>

                                            {/* 본문 가이드 섹션 */}
                                            {(blogContentGuide || missionGuide) && (
                                                <div className="relative">
                                                    <div className="absolute -top-5 left-0 right-0 h-px bg-slate-50" />
                                                    <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black mb-4 border border-slate-200 text-left">
                                                        본문 작성 가이드
                                                    </div>
                                                    <div className="text-[15px] text-slate-600 leading-8 whitespace-pre-line font-medium pl-1">
                                                        {blogContentGuide || missionGuide}
                                                    </div>

                                                    {/* 공통 가이드 섹션 - 행간 및 간격 축소 */}
                                                    <div className="mt-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100/80">
                                                        <ul className="space-y-1.5">
                                                            {[
                                                                '체험 후 솔직한 생각, 느낌, 경험을 긍정적이고 구체적으로 적어주세요.',
                                                                '가이드 내용 참고하여 본인의 문체로 가공하여 적어주세요.',
                                                                '사진 15장 이상 / 글자수 1000자 이상 꼭 지켜주세요.',
                                                                '1분 내외의 사용 영상 한 개 이상 꼭 첨부해주세요.'
                                                            ].map((text, idx) => (
                                                                <li key={idx} className="flex items-start gap-3 text-[13px] text-slate-600 font-bold leading-tight">
                                                                    <span className="w-1 h-1 bg-slate-400 rounded-full mt-[7px] shrink-0" />
                                                                    <span className="flex-1">{text}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 금지 키워드 */}
                                    {(step2Data.prohibitedWords?.length > 0 || campaign.prohibited_words?.length > 0) && (
                                        <div className="p-5 bg-rose-50/30 rounded-2xl border border-rose-100 flex items-start gap-3">
                                            <div className="text-rose-500 mt-1">⚠️</div>
                                            <div>
                                                <p className="text-[11px] font-bold text-rose-500 mb-2 uppercase tracking-widest text-left">금지 키워드</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(campaign.prohibited_words || step2Data.prohibitedWords).map((word: string, i: number) => (
                                                        <span key={i} className="text-xs text-rose-600 font-bold">#{word}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 추가 안내사항 (시안 A) */}
                                    {additionalNotes && (
                                        <div className="p-6 bg-indigo-50/40 rounded-3xl border border-indigo-100/60 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                                                    <Info size={16} strokeWidth={3} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Notice</p>
                                                    <h4 className="text-sm font-black text-indigo-900">추가 안내사항</h4>
                                                </div>
                                            </div>
                                            <div className="h-px bg-indigo-100/50 w-full" />
                                            <p className="text-[14px] text-slate-600 leading-7 whitespace-pre-line font-medium pl-1">
                                                {additionalNotes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* 방문 및 예약 안내 */}
                        {campaign.type === 'VISIT' && (
                            <section className="py-10 border-t border-slate-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                        <CalendarCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">방문 및 예약</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Visit & Reservation</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                            <p className="text-[11px] text-slate-400 font-bold mb-2 uppercase tracking-widest">🗓️ 방문 요일</p>
                                            <p className="font-black text-slate-900 text-base">{visitDays.length > 0 ? visitDays.join(', ') : '무관'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                            <p className="text-[11px] text-slate-400 font-bold mb-2 uppercase tracking-widest">⏰ 방문 시간</p>
                                            <p className="font-black text-slate-900 text-base">
                                                {visitTimeNegotiable ? '조율 가능' : (visitTime || '무관')}
                                            </p>
                                        </div>
                                    </div>

                                    {visitNotes && (
                                        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                            <p className="text-[11px] text-amber-700 font-bold mb-2 uppercase tracking-widest">💡 참고사항</p>
                                            <p className="text-sm text-slate-700 leading-7 whitespace-pre-line font-medium">{visitNotes}</p>
                                        </div>
                                    )}

                                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-[10px] text-blue-500 font-black mb-1.5 uppercase tracking-widest">📞 예약 연락처</p>
                                            <div className="flex items-center gap-3">
                                                {advertiserWillContact ? (
                                                    <p className="font-black text-slate-900 text-lg">선정 후 광고주 직접 연락</p>
                                                ) : (isAdmin || user?.id === campaign.created_by || applicationStatus === 'APPROVED' || applicationStatus === 'SELECTED') ? (
                                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                                                        <span className="font-black text-slate-900 text-xl tracking-tight">{contactPhone || '정보 없음'}</span>
                                                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-indigo-50 rounded-full text-indigo-600 font-bold border border-indigo-100 shadow-sm w-fit">
                                                            {contactMethod === 'TEXT_ONLY' ? '💬 문자예약 가능' :
                                                                contactMethod === 'CALL_ONLY' ? '📞 전화예약 전용' : '📱 문자/전화 가능'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 font-bold text-sm">선정된 인원에게만 노출됩니다.</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center text-blue-500">
                                            <Phone className="w-5 h-5 fill-current" />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 매장 정보 */}
                        {campaign.type === 'VISIT' && stores.length > 0 && (
                            <section className="py-10 border-t border-slate-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">매장 정보</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Location Details</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {stores.map((store: any, i: number) => (
                                        <div key={i} className="group">
                                            <div className="flex items-center gap-2 mb-4">
                                                <h3 className="text-lg font-bold text-slate-900">{store.storeName}</h3>
                                                {store.naverPlaceUrl && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedStore(store);
                                                            setIsStoreSheetOpen(true);
                                                        }}
                                                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center gap-1"
                                                    >
                                                        지도로 보기
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <MapPin size={14} className="text-slate-300 shrink-0" />
                                                <p className="text-sm text-slate-500 font-medium">
                                                    {store.address || '주소 정보 없음'}
                                                </p>
                                            </div>
                                            {/* Dynamic Map 사용 - DB 저장된 좌표로 빠른 로딩 */}
                                            {store.address && store.lat && store.lng && (
                                                <div className="mt-4">
                                                    <NaverMap
                                                        address={store.address}
                                                        storeName={store.storeName}
                                                        lat={store.lat}
                                                        lng={store.lng}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Sticky Aside */}
                    <div className="lg:col-span-4 border-l border-slate-100 bg-slate-50/30 relative">
                        <div className="lg:sticky lg:top-24 p-5 md:p-6 text-left">
                            <div id="options-section" className="flex flex-col">
                                {/* Campaign Info Summary */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-500">모집 기간</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900">
                                                {isAlwaysRecruiting ? '상시 모집' : `${startDate} ~ ${endDateLabel}`}
                                            </p>
                                            <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                                                {isAlwaysRecruiting ? '중지 시까지' : formatDDay(campaign.end_date)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-500">모집 인원</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900">
                                                <span className="text-rose-500 font-extrabold">{appCount}</span>명 신청중
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                모집 정원: {campaign.recruit_count >= 999 ? <span className="text-indigo-600 font-black">∞</span> : `${campaign.recruit_count}명`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                                        <PenLine className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 mb-0.5">신청 정보</h2>
                                        <p className="text-[11px] text-slate-400 font-medium">옵션과 한마디를 적어주세요.</p>
                                    </div>
                                </div>

                                {!hasApplied ? (
                                    <div className="flex-1 flex flex-col">
                                        <div className="space-y-6">
                                            {options.length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between py-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                                                {optionConfig.mode === 'RANKED' ? '지망 순위 선택' : '옵션 선택'}
                                                            </p>
                                                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all duration-300 ${selectedOptions.length === optionConfig.maxSelect ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                                                                <span className={`w-1 h-1 rounded-full ${selectedOptions.length === optionConfig.maxSelect ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`} />
                                                                <span className="text-[9px] font-black leading-none translate-y-[0.5px]">
                                                                    {selectedOptions.length} / {optionConfig.maxSelect} {optionConfig.mode === 'RANKED' ? '지망' : '개'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {selectedOptions.length > 0 && (
                                                            <button
                                                                onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
                                                                className="text-[10px] font-black text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-all"
                                                            >
                                                                {isOptionsExpanded ? '간략히 보기' : '옵션 변경하기'}
                                                                <ChevronDown size={14} className={`transition-transform duration-300 ${isOptionsExpanded ? 'rotate-180' : ''}`} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Collapsed State: Selected Summary */}
                                                    {!isOptionsExpanded && selectedOptions.length > 0 && (
                                                        <div
                                                            onClick={() => setIsOptionsExpanded(true)}
                                                            className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-100/60 cursor-pointer hover:bg-rose-50 transition-all group"
                                                        >
                                                            <div className="space-y-2">
                                                                {selectedOptions.map((s, i) => (
                                                                    <div key={i} className="flex items-center gap-2.5">
                                                                        <span className="shrink-0 w-5 h-5 bg-rose-500 text-white rounded-md flex items-center justify-center text-[9px] font-black shadow-sm">
                                                                            {optionConfig.mode === 'RANKED' ? i + 1 : '✓'}
                                                                        </span>
                                                                        <p className="text-xs font-bold text-gray-700 truncate flex-1 leading-none">
                                                                            {typeof s === 'object' ? s.optionName : s}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="mt-2.5 pt-2.5 border-t border-rose-100/40 flex justify-center">
                                                                <p className="text-[10px] text-rose-400 font-bold group-hover:text-rose-500">클릭하여 옵션 수정하기</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Expanded State: Option List */}
                                                    {isOptionsExpanded && (
                                                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                            {options.map((opt: any, idx: number) => {
                                                                const label = typeof opt === 'object' ? opt.optionName : opt;
                                                                const config = optionConfig;
                                                                const selectedIdx = selectedOptions.findIndex(s => (typeof s === 'object' ? s.optionName : s) === label);
                                                                const isSelected = selectedIdx !== -1;

                                                                const handleOptionClick = () => {
                                                                    let newSelected: any[] = [];
                                                                    if (config.mode === 'SINGLE') {
                                                                        newSelected = [opt];
                                                                    } else if (config.mode === 'MULTI' || config.mode === 'RANKED') {
                                                                        if (isSelected) {
                                                                            newSelected = selectedOptions.filter((_, i) => i !== selectedIdx);
                                                                        } else if (selectedOptions.length < (config.maxSelect || 1)) {
                                                                            newSelected = [...selectedOptions, opt];
                                                                        } else {
                                                                            toast.error(`최대 ${config.maxSelect}${config.mode === 'RANKED' ? '순위' : '개'}까지 선택 가능합니다.`);
                                                                            return;
                                                                        }
                                                                    }

                                                                    if (newSelected.length >= 0) {
                                                                        setSelectedOptions(newSelected);

                                                                        // Auto-collapse if selection is complete
                                                                        if (newSelected.length === (config.maxSelect || 1)) {
                                                                            setTimeout(() => setIsOptionsExpanded(false), 300);
                                                                        }
                                                                    }
                                                                };

                                                                return (
                                                                    <button
                                                                        key={idx}
                                                                        onClick={handleOptionClick}
                                                                        className={`group relative w-full px-4 py-3 rounded-xl border-[1.5px] text-left transition-all flex items-start justify-between ${isSelected
                                                                            ? 'border-rose-500 bg-rose-50/50'
                                                                            : 'border-gray-50 bg-gray-50/50 hover:border-gray-100 hover:bg-gray-100'
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                                                <TooltipProvider delayDuration={300}>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <p className={`text-[13px] font-bold leading-snug whitespace-normal break-keep ${isSelected ? 'text-rose-600' : 'text-gray-700'} cursor-help`}>
                                                                                                {label}
                                                                                            </p>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent side="top" className="max-w-xs bg-slate-900 text-white border-slate-700">
                                                                                            <p className="text-xs font-medium leading-relaxed">{label}</p>
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                                {typeof opt === 'object' && (opt.optionPrice || opt.recruitmentCount) && (
                                                                                    <div className="flex items-center gap-2">
                                                                                        {opt.optionPrice && opt.optionPrice !== '0' && (
                                                                                            <span className="text-[9px] text-gray-400 font-bold">
                                                                                                {Number(opt.optionPrice).toLocaleString()}원 상당
                                                                                            </span>
                                                                                        )}
                                                                                        {opt.recruitmentCount && opt.recruitmentCount !== '0' && (
                                                                                            <span className="text-[9px] text-blue-500 font-black px-1.5 py-0.5 bg-blue-50/50 rounded">
                                                                                                {opt.recruitmentCount}명 모집
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {isSelected && (config.mode === 'RANKED' ? (
                                                                            <span className="shrink-0 w-6 h-6 bg-rose-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg shadow-rose-200 ml-3">
                                                                                {selectedIdx + 1}
                                                                            </span>
                                                                        ) : (
                                                                            <div className="shrink-0 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-200 ml-3">
                                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            </div>
                                                                        ))}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="pt-4 border-t border-slate-50">
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">광고주에게 전하는 한마디</p>
                                                    <input
                                                        type="text"
                                                        value={applicationMessage}
                                                        onChange={(e) => setApplicationMessage(e.target.value)}
                                                        placeholder="광고주님이 좋아할 어필 포인트를 적어주세요!"
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-rose-300 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                                    />
                                                </div>
                                            </div>

                                            {/* Fixed Bottom Button Area - Premium Style */}
                                            <div className="pt-2 flex gap-3">
                                                <button
                                                    onClick={handleApply}
                                                    disabled={isClosed || isApplying}
                                                    className={`group relative flex-1 h-16 md:h-14 rounded-[20px] text-lg font-black flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl overflow-hidden active:scale-[0.97] ${isClosed || isApplying
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                                        : !user
                                                            ? 'bg-gray-800 text-white'
                                                            : 'bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500 bg-[length:200%_auto] hover:bg-right text-white shadow-rose-200'
                                                        }`}
                                                >
                                                    {isApplying ? (
                                                        <span className="flex items-center gap-2">
                                                            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                                                            처리중...
                                                        </span>
                                                    ) : isClosed ? closureText : (
                                                        <>
                                                            <span className="relative z-10 flex items-center gap-3 uppercase tracking-tight">
                                                                {user ? '캠페인 신청하기' : '로그인이 필요합니다'}
                                                                {!isClosed && <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />}
                                                            </span>
                                                            {!isClosed && user && (
                                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none"></div>
                                                            )}
                                                        </>
                                                    )}
                                                </button>
                                                {!isClosed && (
                                                    <div className="shrink-0 flex items-center justify-center">
                                                        <CampaignShare
                                                            campaignId={id}
                                                            title={displayTitle}
                                                            description={campaignIntro}
                                                            thumbnailUrl={campaign.thumbnail_url}
                                                            campaignType={campaign.type}
                                                            variant="large"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-6">
                                        {/* Status Icon */}
                                        <div className="relative">
                                            <div className={`w-20 h-20 rounded-full flex items-center justify-center animate-bounce ${(applicationStatus === 'SELECTED' || applicationStatus === 'APPROVED') ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                                                {(applicationStatus === 'SELECTED' || applicationStatus === 'APPROVED')
                                                    ? <Gift size={40} className="text-rose-500" />
                                                    : <CheckCircle2 size={40} className="text-emerald-500" />
                                                }
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                                <span className="text-[10px] text-white font-black">!</span>
                                            </div>
                                        </div>

                                        {/* Status Message */}
                                        <div className="space-y-2 text-center">
                                            {(applicationStatus === 'SELECTED' || applicationStatus === 'APPROVED') ? (
                                                <>
                                                    <h3 className="text-xl font-black text-rose-600">🎉 체험단 선정 완료!</h3>
                                                    <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                                        축하합니다! 체험단에 선정되셨습니다.<br />
                                                        미션 가이드를 확인하고 리뷰를 등록해 주세요.
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <h3 className="text-xl font-black text-gray-900">신청이 완료되었습니다!</h3>
                                                    <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                                        광고주님이 회원님의 채널을 검토 중입니다.<br />
                                                        선정 결과는 알림톡으로 보내드릴게요. ✨
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="w-full space-y-3 pt-4">
                                            {(applicationStatus === 'SELECTED' || applicationStatus === 'APPROVED') && (
                                                <button
                                                    onClick={() => setIsReviewModalOpen(true)}
                                                    className="w-full py-4 rounded-2xl bg-rose-500 text-white text-base font-black hover:bg-rose-600 transition-all shadow-xl shadow-rose-100 flex items-center justify-center gap-2"
                                                >
                                                    <Camera size={20} />
                                                    리뷰 제출하기
                                                </button>
                                            )}

                                            <button
                                                onClick={() => {
                                                    if (applicationStatus === 'SELECTED' || applicationStatus === 'APPROVED') {
                                                        toast.info('이미 선정된 캠페인의 예약 변경 및 신청 취소는 다온뷰 운영자에게 연락 부탁드립니다.', {
                                                            duration: 4000,
                                                            position: 'top-center'
                                                        });
                                                    } else {
                                                        setShowCancelDialog(true);
                                                    }
                                                }}
                                                className="w-full py-4 rounded-2xl bg-gray-50 text-gray-400 text-sm font-bold hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-[0.98] border border-transparent hover:border-rose-100"
                                            >
                                                신청 취소하기
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Campaigns Section (Slider) */}
            {relatedCampaigns.length > 0 && (
                <div className="bg-slate-50 border-t border-slate-100 py-4 md:py-6">
                    <div className="container max-w-[1240px] px-6 mx-auto">
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">추천 캠페인</h2>
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Recommended for you</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-xl border-slate-200 bg-white w-9 h-9 md:w-10 md:h-10 hover:bg-slate-50 transition-colors"
                                    onClick={() => relatedApi?.scrollPrev()}
                                >
                                    <ChevronLeft className="w-4 h-4 md:w-5 h-5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-xl border-slate-200 bg-white w-9 h-9 md:w-10 md:h-10 hover:bg-slate-50 transition-colors"
                                    onClick={() => relatedApi?.scrollNext()}
                                >
                                    <ChevronRight className="w-4 h-4 md:w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <Carousel
                            opts={{ align: "start", loop: false }}
                            setApi={setRelatedApi}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-4 pb-4">
                                {relatedCampaigns.map((rc) => {
                                    const options = Array.isArray(rc.campaign_options) ? rc.campaign_options[0] : rc.campaign_options;
                                    const s1 = options?.step1Data || {};
                                    return (
                                        <CarouselItem key={rc.id} className="pl-4 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                                            <div className="h-full">
                                                <CampaignCard
                                                    id={rc.id}
                                                    title={rc.title}
                                                    platform={rc.platform}
                                                    type={rc.type}
                                                    applicants={rc.app_count || 0}
                                                    total={rc.recruit_count || 0}
                                                    dday={(rc.is_always || (rc.recruit_count && rc.recruit_count >= 999)) ? '상시' : formatDDay(rc.end_date)}
                                                    imageUrl={rc.thumbnail_url}
                                                    provision={rc.provision_details}
                                                    region={rc.region}
                                                    includeReview={s1.includeReview}
                                                    includeNaver={s1.includeNaver}
                                                    includeInstagram={s1.includeInstagram}
                                                />
                                            </div>
                                        </CarouselItem>
                                    );
                                })}
                            </CarouselContent>
                        </Carousel>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
                title="캠페인 신청 취소"
                message="정말로 이 캠페인 신청을 취소하시겠습니까? 심사 중인 상태에서만 취소 가능합니다."
                onConfirm={confirmCancel}
                confirmText="신청 취소"
                type="danger"
            />

            {/* Mobile Bottom Action Bar */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 p-4 bg-white/90 backdrop-blur-2xl border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.1)]">
                {!hasApplied ? (
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (!user) {
                                    handleApply();
                                    return;
                                }
                                setIsApplySheetOpen(true);
                            }}
                            disabled={isClosed || isApplying}
                            className={`flex-1 h-14 rounded-[24px] text-base font-black shadow-[0_8px_20px_-6px_rgba(244,63,94,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isClosed || isApplying
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                : !user
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-rose-200'
                                }`}
                        >
                            {isApplying ? '처리 중...' : isClosed ? closureText : user
                                ? (selectedOptions.length > 0 ? '캠페인 신청하기' : '옵션 선택하고 신청하기')
                                : '로그인이 필요합니다'}
                            {!isClosed && !isApplying && <ArrowRight size={20} />}
                        </button>
                        {!isClosed && (
                            <div className="shrink-0 flex items-center justify-center">
                                <CampaignShare
                                    campaignId={id}
                                    title={displayTitle}
                                    description={campaignIntro || campaign.description || ''}
                                    thumbnailUrl={images[0]}
                                    campaignType={campaign.type}
                                    variant="large"
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-3">
                        {(applicationStatus === 'SELECTED' || applicationStatus === 'APPROVED') ? (
                            <button
                                onClick={() => setIsReviewModalOpen(true)}
                                className="px-5 py-3.5 bg-rose-500 text-white rounded-2xl font-black text-sm flex-1 text-center shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
                            >
                                <Camera size={16} />
                                리뷰 제출하기
                            </button>
                        ) : (
                            <div className="px-5 py-3.5 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-sm flex-1 text-center">
                                신청 완료 ✨
                            </div>
                        )}
                        <CampaignShare
                            campaignId={id}
                            title={displayTitle}
                            description={campaignIntro}
                            thumbnailUrl={campaign.thumbnail_url}
                            variant="large"
                        />
                        <button
                            onClick={() => {
                                if (applicationStatus === 'SELECTED' || applicationStatus === 'APPROVED') {
                                    toast.info('이미 선정된 캠페인은 다온뷰 운영자에게 예약 변경/취소 문의 부탁드립니다.', {
                                        position: 'top-center'
                                    });
                                } else {
                                    setShowCancelDialog(true);
                                }
                            }}
                            className="w-14 h-14 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"
                        >
                            <span className="text-[10px] font-black leading-none text-center">신청<br />취소</span>
                        </button>
                    </div>
                )}
            </div>

            {/* ReviewSubmitModal 추가 */}
            <ReviewSubmitModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                applicationId={applicationId}
                campaignId={parseInt(id)}
                campaignTitle={campaign.title}
                creatorId={campaign.created_by}
                onSuccess={() => {
                    checkUserStatus(user);
                }}
            />

            {/* Mobile Apply Sheet */}
            <Sheet open={isApplySheetOpen} onOpenChange={setIsApplySheetOpen}>
                <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-[32px] border-none bg-white shadow-2xl flex flex-col overflow-hidden">
                    <SheetHeader className="p-6 pb-2">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
                        <SheetTitle className="text-xl font-black text-gray-900 text-left">
                            캠페인 신청하기
                        </SheetTitle>
                        <p className="text-xs text-gray-400 text-left">원하는 옵션과 메시지를 남겨주세요.</p>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 pb-32">
                        {/* Options Selection in Sheet */}
                        {options.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                        {optionConfig.mode === 'RANKED' ? '지망 순위 선택' : '옵션 선택'}
                                    </h3>
                                    {optionConfig.mode !== 'SINGLE' && (
                                        <p className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                                            {selectedOptions.length} / {optionConfig.maxSelect || 1} 선택됨
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {options.map((opt: any, idx: number) => {
                                        const label = typeof opt === 'object' ? opt.optionName : opt;
                                        const config = optionConfig;
                                        const selectedIdx = selectedOptions.findIndex(s => (typeof s === 'object' ? s.optionName : s) === label);
                                        const isSelected = selectedIdx !== -1;

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    if (config.mode === 'SINGLE') setSelectedOptions([opt]);
                                                    else if (config.mode === 'MULTI' || config.mode === 'RANKED') {
                                                        if (isSelected) setSelectedOptions(selectedOptions.filter((_, i) => i !== selectedIdx));
                                                        else if (selectedOptions.length < (config.maxSelect || 1)) setSelectedOptions([...selectedOptions, opt]);
                                                        else toast.error(`최대 ${config.maxSelect}개까지 선택 가능합니다.`);
                                                    }
                                                }}
                                                className={`group relative w-full px-5 py-4 rounded-2xl border-2 text-left transition-all ${isSelected
                                                    ? 'border-rose-500 bg-rose-50/30'
                                                    : 'border-gray-50 bg-gray-50/50 active:bg-gray-100'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <TooltipProvider delayDuration={300}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <p className={`text-sm font-bold leading-snug whitespace-normal break-keep ${isSelected ? 'text-rose-600' : 'text-gray-700'} cursor-help`}>
                                                                        {label}
                                                                    </p>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="max-w-xs bg-slate-900 text-white border-slate-700">
                                                                    <p className="text-xs font-medium leading-relaxed">{label}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        {typeof opt === 'object' && (opt.optionPrice !== '0' || opt.recruitmentCount !== '0') && (
                                                            <div className="flex items-center gap-2 mt-2">
                                                                {opt.optionPrice && opt.optionPrice !== '0' && (
                                                                    <span className="text-[10px] text-gray-400 font-bold">
                                                                        {Number(opt.optionPrice).toLocaleString()}원 상당
                                                                    </span>
                                                                )}
                                                                {opt.recruitmentCount && opt.recruitmentCount !== '0' && (
                                                                    <span className="text-[10px] text-blue-500 font-black px-1.5 py-0.5 bg-blue-50/50 rounded-md">
                                                                        모집 {opt.recruitmentCount}명
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isSelected && (config.mode === 'RANKED' ? (
                                                        <span className="shrink-0 w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-lg shadow-rose-200">
                                                            {selectedIdx + 1}
                                                        </span>
                                                    ) : (
                                                        <div className="shrink-0 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-200">
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    ))}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Message Input in Sheet */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">광고주에게 전하는 한마디</h3>
                            <input
                                type="text"
                                value={applicationMessage}
                                onChange={(e) => setApplicationMessage(e.target.value)}
                                placeholder="광고주님께 어필할 수 있는 한마디!"
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-sm focus:border-rose-200 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    {/* Final Action Button In Sheet (Fixed at bottom of sheet) */}
                    <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
                        <button
                            onClick={() => {
                                handleApply();
                                setIsApplySheetOpen(false);
                            }}
                            className="w-full py-5 rounded-[24px] bg-gradient-to-r from-rose-500 to-rose-600 text-white text-base font-black flex items-center justify-center gap-2 shadow-2xl shadow-rose-200 active:scale-[0.96] transition-all"
                        >
                            캠페인 신청하기
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* 매장 지도 Sheet */}
            <Sheet open={isStoreSheetOpen} onOpenChange={setIsStoreSheetOpen}>
                <SheetContent side="bottom" className="h-[38vh] rounded-t-3xl p-0 overflow-hidden border-none bg-slate-50 max-w-[1240px] mx-auto">
                    <SheetHeader className="p-6 bg-white border-b border-slate-100 flex flex-row items-center justify-between">
                        <div className="text-left">
                            <SheetTitle className="text-xl font-black text-slate-900">{selectedStore?.storeName}</SheetTitle>
                            <p className="text-xs text-slate-500 font-medium mt-1">{selectedStore?.address}</p>
                        </div>
                    </SheetHeader>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <a
                                href={selectedStore?.naverPlaceUrl}
                                target="_blank"
                                className="group flex flex-col items-center justify-center p-6 bg-[#03C75A] text-white rounded-2xl gap-3 shadow-lg shadow-green-100 active:scale-95 transition-all"
                            >
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <MapPin className="text-white w-6 h-6" />
                                </div>
                                <span className="font-bold text-sm">네이버 지도 앱</span>
                            </a>
                            <button
                                onClick={() => {
                                    if (selectedStore?.address) {
                                        navigator.clipboard.writeText(selectedStore.address);
                                        toast.success('주소가 복사되었습니다.');
                                    }
                                }}
                                className="flex flex-col items-center justify-center p-6 bg-white text-slate-800 rounded-2xl gap-3 border border-slate-200 shadow-sm active:scale-95 hover:bg-slate-50 transition-all"
                            >
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                    <CheckCircle2 className="text-slate-400 w-6 h-6" />
                                </div>
                                <span className="font-bold text-sm">주소 복사하기</span>
                            </button>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                                ※ 네이버 보안 정책상 외부 앱 연결을 통해 상세 지도를 확인하실 수 있습니다.
                            </p>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Missing Info Alert Dialog */}
            <Dialog open={isProfileAlertOpen} onOpenChange={setIsProfileAlertOpen}>
                <DialogContent className="max-w-[360px] rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-center">
                            {missingInfoType === 'BANK' ? '계좌 정보 등록 필요' : '배송지 정보 등록 필요'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-center text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {missingInfoType === 'BANK'
                            ? '캠페인 참여 및 정산을 위해\n계좌 정보를 먼저 등록해 주세요.'
                            : '제품 발송을 위해\n배송 정보(수령인/연락처/주소)가 필요합니다.\n등록 페이지로 이동하시겠습니까?'}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl h-12"
                            onClick={() => setIsProfileAlertOpen(false)}
                        >
                            취소
                        </Button>
                        <Button
                            className="flex-1 rounded-xl h-12 bg-rose-500 hover:bg-rose-600 text-white font-bold"
                            onClick={() => {
                                setIsProfileAlertOpen(false);
                                router.push('/profile/edit?tab=payout');
                            }}
                        >
                            {missingInfoType === 'BANK' ? '계좌 등록하러 가기' : '배송지 등록하러 가기'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 전화번호 입력 모달 */}
            {showPhoneModal && user && (
                <PhoneInputModal
                    userId={user.id}
                    onComplete={(phoneNumber) => {
                        setShowPhoneModal(false);
                        // 전화번호 저장 후 자동으로 신청 진행
                        handleApply();
                    }}
                    onClose={() => setShowPhoneModal(false)}
                />
            )}
        </div>
    );
}
