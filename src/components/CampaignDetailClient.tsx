'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
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
import AdminControls from '@/components/AdminControls';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';

interface CampaignDetailClientProps {
    campaign: any;
    id: string;
}

export default function CampaignDetailClient({ campaign: initialCampaign, id }: CampaignDetailClientProps) {
    const [campaign, setCampaign] = useState(initialCampaign);
    const [isFavorite, setIsFavorite] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [applicationMessage, setApplicationMessage] = useState<string>('');
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        checkUserStatus();
    }, []);

    const fetchCampaign = async () => {
        const { data } = await supabase
            .from('campaigns')
            .select('*, applications(count)')
            .eq('id', id)
            .single();
        if (data) setCampaign(data);
    };

    async function checkUserStatus() {
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            if (!currentUser) return;

            // Check favorite
            const { data: favoriteData } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', currentUser.id)
                .eq('campaign_id', id)
                .maybeSingle();
            setIsFavorite(!!favoriteData);

            // Check application
            const { data: appData } = await supabase
                .from('applications')
                .select('id, selected_option, application_message')
                .eq('user_id', currentUser.id)
                .eq('campaign_id', id)
                .maybeSingle();

            if (appData) {
                setHasApplied(true);
                setSelectedOption(appData.selected_option || '');
                setApplicationMessage(appData.application_message || '');
            }
        } catch (err) {
            console.error('Error checking user status:', err);
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

        const options = Array.isArray(campaign.product_options) ? campaign.product_options : [];
        if (options.length > 0 && !selectedOption) {
            toast.error('제공 옵션을 선택해주세요.');
            document.getElementById('options-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('applications')
                .insert({
                    user_id: user.id,
                    campaign_id: id,
                    status: 'pending',
                    selected_option: (typeof selectedOption === 'object' ? (selectedOption as any).optionName : selectedOption) || null,
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

            if (appData?.status !== 'pending') {
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
            setSelectedOption('');
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
    const options = Array.isArray(campaign.product_options) ? campaign.product_options : [];

    // JSON options fallback (for data in step1Data/step2Data)
    const campaignOptions = Array.isArray(campaign.campaign_options) ? campaign.campaign_options[0] : campaign.campaign_options;
    const step2Data = campaignOptions?.step2Data || {};

    // Title fallback
    const displayTitle = step2Data.campaignTitle || campaign.title;

    const missionGuide = campaign.mission_guide || step2Data.missionGuide || step2Data.reviewMissionContent || '';
    const keywords = Array.isArray(campaign.keywords) ? campaign.keywords :
        Array.isArray(step2Data.keywords) ? step2Data.keywords :
            typeof step2Data.blogMainKeyword === 'string' ? [step2Data.blogMainKeyword, ...(step2Data.blogSubKeywords || [])] : [];
    const photoCount = campaign.photo_count || step2Data.photoCount || '';
    const videoRequired = campaign.video_required || step2Data.videoRequired || 'no';

    return (
        <div className="container py-16 max-w-[1000px] w-[90%] mx-auto pb-40">
            {/* Top Section */}
            <div className="flex flex-col md:flex-row gap-12 mb-16">
                {/* Image Slider */}
                <div className="flex-1 bg-gray-50 rounded-2xl min-h-[400px] max-h-[500px] border border-border flex items-center justify-center overflow-hidden relative shadow-2xl group">
                    {images.length > 0 ? (
                        <>
                            <img
                                src={images[currentImageIndex]}
                                alt={displayTitle}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {images.length > 1 && (
                                <>
                                    <button onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md text-gray-800 flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-lg"><ChevronLeft /></button>
                                    <button onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md text-gray-800 flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-lg"><ChevronRight /></button>
                                </>
                            )}
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={toggleFavorite}
                                className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-black/5 hover:bg-black/20 backdrop-blur-md text-white border-0 transition-all hover:scale-110"
                            >
                                <Heart className={`w-6 h-6 drop-shadow-sm ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                            </Button>
                        </>
                    ) : (
                        <div className="text-gray-300 font-black text-2xl">NO IMAGE</div>
                    )}
                </div>

                {/* Info Panel */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        {/* 1. Type Badge */}
                        <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold ${campaign.type === 'DELIVERY' ? 'bg-indigo-100 text-indigo-700' :
                            campaign.type === 'PURCHASE' ? 'bg-orange-100 text-orange-700' :
                                campaign.type === 'PRESS' ? 'bg-purple-100 text-purple-700' :
                                    'bg-blue-100 text-blue-700'
                            }`}>
                            {campaign.type === 'DELIVERY' ? <Package className="w-3.5 h-3.5" /> :
                                campaign.type === 'PURCHASE' ? <ShoppingBag className="w-3.5 h-3.5" /> :
                                    campaign.type === 'PRESS' ? <PenTool className="w-3.5 h-3.5" /> :
                                        <MapPin className="w-3.5 h-3.5" />}
                            <span className="leading-none pt-[1px]">
                                {campaign.type === 'VISIT' ? '방문' :
                                    campaign.type === 'DELIVERY' ? '배송' :
                                        campaign.type === 'PURCHASE' ? '구매' :
                                            campaign.type === 'PRESS' ? '기자단' : campaign.type}
                            </span>
                        </div>

                        {/* 2. Optional Purchase Badge for Delivery */}
                        {campaign.type === 'DELIVERY' && campaign.platform !== 'PURCHASE' && (
                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-700">
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span className="leading-none pt-[1px]">구매평</span>
                            </div>
                        )}

                        {/* 3. Platform Badge */}
                        <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold ${['INSTAGRAM', 'REELS'].includes(campaign.platform) ? 'bg-pink-100 text-pink-700' :
                            ['YOUTUBE', 'SHORTS'].includes(campaign.platform) ? 'bg-red-100 text-red-700' :
                                campaign.platform === 'TIKTOK' ? 'bg-slate-900 text-white' :
                                    ['PURCHASE', 'OTHER', '기타'].includes(campaign.platform) ? 'bg-orange-100 text-orange-700' :
                                        'bg-emerald-100 text-emerald-700'
                            }`}>
                            {['INSTAGRAM', 'REELS'].includes(campaign.platform) ? <Instagram className="w-3.5 h-3.5" /> :
                                ['PURCHASE', 'OTHER', '기타'].includes(campaign.platform) ? <ShoppingBag className="w-3.5 h-3.5" /> :
                                    <PenTool className="w-3.5 h-3.5" />}

                            <span className="leading-none pt-[1px]">
                                {campaign.platform === 'BLOG' ? '블로그' :
                                    campaign.platform === 'INSTAGRAM' ? '인스타그램' :
                                        campaign.platform === 'YOUTUBE' ? '유튜브' :
                                            campaign.platform === 'REELS' ? '릴스' :
                                                campaign.platform === 'SHORTS' ? '쇼츠' :
                                                    ['PURCHASE', 'OTHER', '기타'].includes(campaign.platform) ? '구매평' :
                                                        campaign.platform}
                            </span>
                        </div>

                        {/* 4. Region Badge (for Visit campaigns) */}
                        {campaign.type === 'VISIT' && campaign.platform !== 'PURCHASE' && (
                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="leading-none pt-[1px]">{campaign.region || '전국'}</span>
                            </div>
                        )}

                        <AdminControls campaignId={campaign.id} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 leading-tight">{displayTitle}</h1>

                    <div className="space-y-6 bg-slate-50 p-8 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-xl">📅</div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold mb-0.5">모집 기간</p>
                                <p className="text-sm font-black text-slate-800">{startDate} ~ {endDate}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-xl">👥</div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold mb-0.5">모집 인원</p>
                                <p className="text-sm font-black text-slate-800">{campaign.recruit_count}명 <span className="text-rose-500 ml-2">(현재 {appCount}명 신청)</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 pt-4 border-t border-slate-200/50">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg text-xl tracking-tighter">🎁</div>
                            <div className="flex-1">
                                <p className="text-xs text-rose-400 font-bold mb-0.5">제공 내역</p>
                                <p className="text-base font-black text-rose-600 leading-snug">{campaign.provision}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaign Guide Section */}
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-10 md:p-16 shadow-xl mb-16">
                <h2 className="text-3xl font-black mb-12 text-slate-900 flex items-center gap-3">
                    <span className="w-2 h-10 bg-rose-500 rounded-full" />
                    캠페인 가이드
                </h2>

                <div className="space-y-16">
                    {/* Intro */}
                    <div className="prose max-w-none text-slate-700 leading-relaxed">
                        <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                            <span className="text-rose-500">✨</span> 캠페인 소개
                        </h3>
                        <div className="whitespace-pre-line bg-slate-50 p-8 rounded-2xl border border-slate-100">
                            {campaign.description || '상세 소개 내용이 없습니다.'}
                        </div>
                    </div>

                    {/* Keywords */}
                    {keywords.length > 0 && (
                        <div>
                            <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                                <span className="text-rose-500">🔑</span> 필수 키워드
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {keywords.map((kw: string, i: number) => (
                                    <span key={i} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold border border-slate-200">
                                        #{kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missions */}
                    <div className="prose max-w-none text-slate-700 leading-relaxed">
                        <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                            <span className="text-rose-500">📝</span> 리뷰 미션
                        </h3>
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/50">
                                    <p className="text-xs text-slate-400 font-bold mb-1">사진 촬영 조건</p>
                                    <p className="font-black text-slate-800">{photoCount ? `${photoCount}장 이상` : '자율 촬영'}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/50">
                                    <p className="text-xs text-slate-400 font-bold mb-1">동영상 포함 여부</p>
                                    <p className="font-black text-slate-800">{videoRequired === 'yes' ? '필수 포함' : '선택 사항'}</p>
                                </div>
                            </div>
                            {missionGuide && (
                                <div className="pt-4 border-t border-slate-200">
                                    <p className="text-xs text-slate-400 font-bold mb-3">상세 가이드라인</p>
                                    <div className="whitespace-pre-line text-slate-700">{missionGuide}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div id="options-section" className="bg-slate-900 rounded-2xl p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-4">함께 하실까요?</h2>
                    <p className="text-slate-400 mb-12">원하시는 옵션을 선택하고 신청 메세지를 남겨주세요.</p>

                    {options.length > 0 && !hasApplied && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {options.map((opt: any, idx: number) => {
                                const label = typeof opt === 'object' ? opt.optionName : opt;
                                const isSelected = (typeof selectedOption === 'object' ? (selectedOption as any).optionName : selectedOption) === label;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedOption(opt)}
                                        className={`p-6 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-rose-500 bg-rose-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30'}`}
                                    >
                                        <p className="text-xs font-bold mb-1 opacity-50">Option {idx + 1}</p>
                                        <p className="font-black">{label}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!hasApplied ? (
                        <div className="space-y-6">
                            <textarea
                                value={applicationMessage}
                                onChange={(e) => setApplicationMessage(e.target.value)}
                                placeholder="광고주에게 전달할 짧은 메세지를 적어주세요 (어필 포인트 등)"
                                className="w-full bg-white/5 border-2 border-white/10 rounded-xl p-6 text-white focus:border-rose-500 focus:outline-none transition-all placeholder:text-white/20"
                                rows={4}
                            />
                            <button
                                onClick={handleApply}
                                disabled={!user}
                                className={`w-full py-6 rounded-full text-xl font-black flex items-center justify-center gap-3 transition-all ${!user ? 'bg-slate-700 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/30'}`}
                            >
                                {user ? '캠페인 신청하기' : '로그인이 필요합니다'}
                                <ArrowRight />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full text-emerald-400 font-black text-xl mb-6">
                                <Gift className="w-6 h-6" />
                                신청이 완료되었습니다
                            </div>
                            <button onClick={() => setShowCancelDialog(true)} className="block w-full text-slate-500 hover:text-rose-400 text-sm underline transition-colors">신청 취소하기</button>
                        </div>
                    )}
                </div>

                {/* Decorative background circle */}
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px]" />
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
