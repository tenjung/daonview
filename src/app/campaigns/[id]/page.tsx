'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminControls from '@/components/AdminControls';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, MapPin, Package, Heart, ShoppingBag, PenTool, Instagram, Gift } from 'lucide-react';

export default function CampaignDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [applicationMessage, setApplicationMessage] = useState<string>('');
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (id) {
            fetchCampaign();
            checkUserStatus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function fetchCampaign() {
        console.log('Fetching campaign with ID:', id);
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*, applications(count)')
                .eq('id', id)
                .single();

            console.log('Campaign data:', data);
            console.log('Campaign error:', error);

            if (error) {
                console.error('Campaign fetch error:', error);
                setError(error);
            } else {
                setCampaign(data);
            }
            setLoading(false);
        } catch (err) {
            console.error('Campaign fetch exception:', err);
            setError(err);
            setLoading(false);
        }
    }

    async function checkUserStatus() {
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            if (!currentUser) return;

            // Check if favorited (with error handling for missing table)
            try {
                const { data: favoriteData, error: favError } = await supabase
                    .from('favorites')
                    .select('id')
                    .eq('user_id', currentUser.id)
                    .eq('campaign_id', id)
                    .maybeSingle();

                if (!favError) {
                    setIsFavorite(!!favoriteData);
                }
            } catch (favErr) {
                console.log('Favorites table not available yet');
            }

            // Check if already applied
            try {
                const { data: applicationData, error: appError } = await supabase
                    .from('applications')
                    .select('id, selected_option, application_message')
                    .eq('user_id', currentUser.id)
                    .eq('campaign_id', id)
                    .maybeSingle();

                if (!appError && applicationData) {
                    setHasApplied(true);
                    setSelectedOption(applicationData.selected_option || '');
                    setApplicationMessage(applicationData.application_message || '');
                }
            } catch (appErr) {
                console.log('Applications check error:', appErr);
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
                    .insert({
                        user_id: user.id,
                        campaign_id: id
                    });
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

        if (hasApplied) {
            toast.info('이미 신청한 캠페인입니다.');
            return;
        }

        // Parse Options from product_options field (selection options for applicants)
        const options = Array.isArray(campaign.product_options) ? campaign.product_options : [];

        // Check if option selection is required
        if (options.length > 0 && !selectedOption) {
            toast.error('제공 옵션을 선택해주세요.');
            // Scroll to options section
            document.getElementById('options-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        try {
            const { error } = await supabase
                .from('applications')
                .insert({
                    user_id: user.id,
                    campaign_id: id,
                    status: 'pending',
                    selected_option: (typeof selectedOption === 'object' ? (selectedOption as any).optionName : selectedOption) || null,
                    application_message: applicationMessage || null
                });

            if (error) throw error;

            toast.success('캠페인 신청이 완료되었습니다!', {
                description: '심사 결과는 마이페이지에서 확인하실 수 있습니다.'
            });
            setHasApplied(true);
            fetchCampaign(); // Refresh to update application count
        } catch (error) {
            console.error('Error applying:', error);
            toast.error('신청 중 오류가 발생했습니다.');
        }
    }

    async function handleCancel() {
        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        if (!hasApplied) {
            toast.error('신청하지 않은 캠페인입니다.');
            return;
        }

        // Show confirmation dialog
        setShowCancelDialog(true);
    }

    async function confirmCancel() {
        try {
            // 먼저 신청 상태 확인
            const { data: appData } = await supabase
                .from('applications')
                .select('status')
                .eq('user_id', user.id)
                .eq('campaign_id', id)
                .single();

            if (appData?.status !== 'pending') {
                toast.error('심사중인 신청만 취소할 수 있습니다.', {
                    description: `현재 상태: ${appData?.status === 'approved' ? '선정됨' :
                        appData?.status === 'rejected' ? '미선정' :
                            appData?.status === 'completed' ? '완료' : appData?.status
                        }`
                });
                return;
            }

            const { error } = await supabase
                .from('applications')
                .delete()
                .eq('user_id', user.id)
                .eq('campaign_id', id);

            if (error) throw error;

            toast.success('신청이 취소되었습니다.', {
                description: '언제든지 다시 신청하실 수 있습니다.'
            });
            setHasApplied(false);
            setSelectedOption('');
            setApplicationMessage('');
            fetchCampaign(); // Refresh to update application count
        } catch (error) {
            console.error('Error canceling application:', error);
            toast.error('취소 중 오류가 발생했습니다.');
        }
    }

    if (loading) {
        return (
            <div className="container py-20 text-center">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">데이터 조회 오류</h1>
                <p className="bg-gray-100 p-4 rounded text-left inline-block">
                    {JSON.stringify(error, null, 2)}
                </p>
                <p className="mt-4 text-gray-500">ID: {id}</p>
            </div>
        );
    }

    if (!campaign) {
        return <div className="container py-20 text-center">해당 캠페인({id})을 찾을 수 없습니다.</div>;
    }

    // Process Application Count
    const appCount = campaign.applications?.[0]?.count ?? campaign.applications?.count ?? 0;

    // Date Formatting
    const startDate = new Date(campaign.created_at).toLocaleDateString();
    const endDate = new Date(campaign.end_date).toLocaleDateString();

    const isVisit = campaign.type === 'VISIT';
    const isDelivery = campaign.type === 'DELIVERY';

    // Parse Options from product_options field
    const options = Array.isArray(campaign.product_options) ? campaign.product_options : [];

    // Prepare image array for slider
    const images = [
        campaign.thumbnail_url,
        campaign.sub_image_1,
        campaign.sub_image_2
    ].filter(Boolean); // Remove null/undefined values

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="container py-16 max-w-[1000px] w-[90%] mx-auto">
            {/* Top Section: Img + Info */}
            <div className="flex flex-col md:flex-row gap-12 mb-16">
                {/* Image Slider Area */}
                <div className="flex-1 bg-gray-50 rounded-2xl min-h-[400px] max-h-[500px] border border-border flex items-center justify-center overflow-hidden relative shadow-sm group">
                    {images.length > 0 ? (
                        <>
                            {/* Main Image */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={images[currentImageIndex]}
                                alt={`${campaign.title} - Image ${currentImageIndex + 1}`}
                                className="w-full h-full object-cover transition-opacity duration-300"
                            />

                            {/* Navigation Arrows - Only show if multiple images */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                                        aria-label="Next image"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>

                                    {/* Dot Indicators */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {images.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex
                                                        ? 'bg-white w-6'
                                                        : 'bg-white/50 hover:bg-white/75'
                                                    }`}
                                                aria-label={`Go to image ${idx + 1}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Image Counter */}
                                    <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                                        {currentImageIndex + 1} / {images.length}
                                    </div>
                                </>
                            )}

                            {/* Favorite Button */}
                            <button
                                onClick={toggleFavorite}
                                className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-all z-10 group"
                            >
                                {isFavorite ? (
                                    <Heart className="w-6 h-6 fill-red-500 text-red-500" />
                                ) : (
                                    <Heart className="w-6 h-6 text-gray-400 group-hover:text-red-400 transition-colors" />
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="text-2xl text-gray-300 font-bold">No Image</div>
                    )}
                </div>

                {/* Info Area */}
                <div className="flex-1 flex flex-col">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            {/* Platform Badge */}
                            {(() => {
                                const p = campaign.platform;
                                let label = p;
                                let colorClass = "bg-slate-800 text-white";
                                
                                if (p === '기타' || p === 'OTHER') {
                                    label = "구매평";
                                    colorClass = "bg-orange-500 text-white";
                                } else if (p === '블로그' || p === 'BLOG') {
                                    label = "블로그";
                                    colorClass = "bg-green-600 text-white";
                                } else if (p === '인스타' || p === 'INSTAGRAM') {
                                    label = "인스타그램";
                                    colorClass = "bg-pink-500 text-white";
                                }
                                
                                return <span className={`inline-block px-3 py-1 rounded font-bold text-xs uppercase tracking-wider ${colorClass}`}>{label}</span>;
                            })()}

                            {/* Type Badge */}
                            {(() => {
                                const t = campaign.type;
                                let label = t;
                                let colorClass = "bg-blue-100 text-blue-700";
                                
                                if (t === '방문형' || t === 'VISIT') {
                                    label = "방문";
                                    colorClass = "bg-blue-100 text-blue-700";
                                } else if (t === '배송형' || t === 'DELIVERY') {
                                    label = "배송";
                                    colorClass = "bg-green-100 text-green-700";
                                } else if (t === '기자단' || t === 'PRESS' || t === 'PURCHASE') {
                                    label = "기자단";
                                    colorClass = "bg-purple-100 text-purple-700";
                                }
                                
                                return <span className={`inline-block px-3 py-1 rounded font-bold text-xs ${colorClass}`}>{label}</span>;
                            })()}

                            {/* Region Badge for VISIT type */}
                            {(campaign.type === '방문형' || campaign.type === 'VISIT') && campaign.region && (
                                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded font-bold text-xs">
                                    {campaign.region}
                                </span>
                            )}
                            {/* Category Badge for DELIVERY type */}
                            {(campaign.type === '배송형' || campaign.type === 'DELIVERY') && campaign.category && (
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded font-bold text-xs">
                                    <Package className="w-3 h-3" /> {campaign.category}
                                </span>
                            )}
                            {/* Admin Controls - Inline */}
                            <AdminControls campaignId={campaign.id} />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-text-main mb-6 leading-snug break-keep">
                            {campaign.title}
                        </h1>
                    </div>

                    {/* Campaign Info - Compact */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                        <div className="space-y-4">
                            {/* Period */}
                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                                <span className="text-2xl">📅</span>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">모집기간</p>
                                    <p className="text-sm font-bold text-gray-900">{startDate} ~ {endDate}</p>
                                </div>
                            </div>

                            {/* Recruit Count */}
                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                                <span className="text-2xl">👥</span>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">모집인원</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {campaign.recruit_count}명
                                        <span className="text-primary text-xs ml-2">(현재 {appCount}명 신청)</span>
                                    </p>
                                </div>
                            </div>

                            {/* Location (VISIT only) */}
                            {isVisit && campaign.store_address && (
                                <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                                    <span className="text-2xl">📍</span>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">지역/위치</p>
                                        <p className="text-sm font-bold text-gray-900 break-keep">{campaign.store_address}</p>
                                    </div>
                                </div>
                            )}

                            {/* Provision */}
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🎁</span>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">제공내역</p>
                                    <p className="text-sm font-bold text-primary">{campaign.provision || '별도 표기'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Notice - Compact */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-xs text-blue-800 text-center leading-relaxed">
                            📋 <strong>아래 캠페인 내용을 모두 확인</strong>하신 후 하단의 <strong className="text-primary">체험단 신청하기</strong> 버튼을 눌러주세요
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Details */}
            <div className="bg-white border border-border rounded-2xl p-8 sm:p-12 shadow-sm">
                <h2 className="text-2xl font-bold mb-8 text-text-main border-b-2 border-pink-100 pb-2 inline-block">캠페인 미션 & 가이드</h2>

                {/* DB 데이터 기반 상세 가이드 영역 */}
                <div className="space-y-12">
                    {/* 1. 기본 설명 (기존 description) */}
                    {campaign.description && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                캠페인 소개
                            </h3>
                            <div className="text-base leading-loose text-gray-700 whitespace-pre-line bg-gray-50 p-6 rounded-xl border border-gray-100">
                                {campaign.description}
                            </div>
                        </div>
                    )}

                    {/* campaign_options에서 step2Data 추출 */}
                    {(() => {
                        const opt = Array.isArray(campaign.campaign_options) ? campaign.campaign_options[0] : campaign.campaign_options;
                        const s2 = opt?.step2Data;
                        const s1 = opt?.step1Data;
                        if (!s2) return null;

                        return (
                            <>
                                {/* 2. 구매평 가이드 (배송형/구매평 케이스) */}
                                {(campaign.type === '배송형' || campaign.type === 'DELIVERY') && s1?.includeReview && (
                                    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                                        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                            <ShoppingBag className="w-5 h-5" />
                                            구매평 작성 가이드
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            {s2.purchaseLink && (
                                                <div className="col-span-full bg-white p-4 rounded-lg border border-blue-50">
                                                    <p className="text-blue-700 font-bold mb-1">구매 링크</p>
                                                    <a href={s2.purchaseLink} target="_blank" className="text-blue-600 underline break-all">{s2.purchaseLink}</a>
                                                </div>
                                            )}
                                            {s2.purchaseOption && (
                                                <div className="bg-white p-4 rounded-lg border border-blue-50">
                                                    <p className="text-blue-700 font-bold mb-1">구매 옵션</p>
                                                    <p className="text-gray-900">{s2.purchaseOption}</p>
                                                </div>
                                            )}
                                            {s2.paybackAmount && (
                                                <div className="bg-white p-4 rounded-lg border border-blue-50">
                                                    <p className="text-blue-700 font-bold mb-1">페이백 금액</p>
                                                    <p className="text-rose-600 font-bold">{Number(s2.paybackAmount).toLocaleString()}원</p>
                                                </div>
                                            )}
                                            {s2.reviewMissionContent && (
                                                <div className="col-span-full bg-white p-4 rounded-lg border border-blue-50">
                                                    <p className="text-blue-700 font-bold mb-1">리뷰 미션</p>
                                                    <p className="text-gray-900 whitespace-pre-line">{s2.reviewMissionContent}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 3. 블로그 미션 (네이버 플랫폼) */}
                                {(campaign.platform === '블로그' || campaign.platform === 'BLOG' || s1?.includeNaver) && (
                                    <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100">
                                        <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                            <PenTool className="w-5 h-5" />
                                            블로그 포스팅 가이드
                                        </h3>
                                        <div className="space-y-4 text-sm">
                                            <div className="bg-white p-4 rounded-lg border border-green-50">
                                                <p className="text-green-700 font-bold mb-2">필수 키워드</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-3 py-1 bg-green-600 text-white rounded-full font-bold">제목: {s2.blogMainKeyword}</span>
                                                    {s2.blogSubKeywords?.map((k: string) => (
                                                        <span key={k} className="px-3 py-1 bg-green-100 text-green-700 rounded-full">#{k}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            {s2.blogTitleGuide && (
                                                <div className="bg-white p-4 rounded-lg border border-green-50">
                                                    <p className="text-green-700 font-bold mb-1">제목 작성 가이드</p>
                                                    <p className="text-gray-900">{s2.blogTitleGuide}</p>
                                                </div>
                                            )}
                                            {s2.blogContentGuide && (
                                                <div className="bg-white p-4 rounded-lg border border-green-50">
                                                    <p className="text-green-700 font-bold mb-1">본문 작성 가이드</p>
                                                    <p className="text-gray-900 whitespace-pre-line">{s2.blogContentGuide}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 4. 인스타그램 미션 */}
                                {(campaign.platform === '인스타' || campaign.platform === 'INSTAGRAM' || s1?.includeInstagram) && (
                                    <div className="bg-pink-50/50 rounded-2xl p-6 border border-pink-100">
                                        <h3 className="text-lg font-bold text-pink-900 mb-4 flex items-center gap-2">
                                            <Instagram className="w-5 h-5" />
                                            인스타그램 업로드 가이드
                                        </h3>
                                        <div className="space-y-4 text-sm">
                                            <div className="bg-white p-4 rounded-lg border border-pink-50">
                                                <p className="text-pink-700 font-bold mb-2">필수 해시태그</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {s2.instagramHashtags?.map((h: string) => (
                                                        <span key={h} className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full font-medium">{h}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            {s2.instagramAccountTag && (
                                                <div className="bg-white p-4 rounded-lg border border-pink-50">
                                                    <p className="text-pink-700 font-bold mb-1">계정 태그</p>
                                                    <p className="text-gray-900 font-bold">@{s2.instagramAccountTag.replace('@', '')}</p>
                                                </div>
                                            )}
                                            {s2.instagramPhotoGuide && (
                                                <div className="bg-white p-4 rounded-lg border border-pink-50">
                                                    <p className="text-pink-700 font-bold mb-1">촬영 가이드</p>
                                                    <p className="text-gray-900 whitespace-pre-line">{s2.instagramPhotoGuide}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 5. 공통 가이드 & 작성 조건 */}
                                {(s2.missionGuide || s2.additionalNotes || s2.photoCount || s2.textLength) && (
                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Gift className="w-5 h-5" />
                                            체험 및 작성 상세 가이드
                                        </h3>
                                        <div className="space-y-4 text-sm">
                                            {/* 작성 조건 요약 */}
                                            {(s2.photoCount || s2.textLength || s2.videoRequired) && (
                                                <div className="flex flex-wrap gap-3 mb-4">
                                                    {s2.photoCount && s2.photoCount !== 'none' && (
                                                        <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
                                                            <span className="text-gray-400">사진</span>
                                                            <span className="font-bold text-gray-900">{s2.photoCount}장 이상</span>
                                                        </div>
                                                    )}
                                                    {s2.videoRequired === 'yes' && (
                                                        <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
                                                            <span className="text-gray-400">동영상</span>
                                                            <span className="font-bold text-primary">필수 포함</span>
                                                        </div>
                                                    )}
                                                    {s2.textLength && s2.textLength !== 'free' && (
                                                        <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
                                                            <span className="text-gray-400">리뷰 분량</span>
                                                            <span className="font-bold text-gray-900">
                                                                {s2.textLength === 'short' ? '20자 내외 간단히' :
                                                                 s2.textLength === 'medium' ? '150자 내외' :
                                                                 s2.textLength === 'long' ? '300자 이상' : 
                                                                 s2.textLength === 'custom' ? '가이드 참조' : '자유'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {s2.missionGuide && (
                                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm leading-relaxed">
                                                    <p className="font-bold text-gray-400 mb-3 border-b border-gray-50 pb-2">작성 가이드</p>
                                                    <p className="text-gray-800 whitespace-pre-line">{s2.missionGuide}</p>
                                                </div>
                                            )}
                                            {s2.additionalNotes && (
                                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm leading-relaxed">
                                                    <p className="font-bold text-gray-400 mb-3 border-b border-gray-50 pb-2">기타 추가 안내</p>
                                                    <p className="text-gray-800 whitespace-pre-line">{s2.additionalNotes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>

                <div className="mt-12 bg-rose-50 p-8 rounded-xl border border-dashed border-primary-light">
                    <h3 className="text-lg font-bold text-primary-dark mb-4 flex items-center gap-2">
                        <span className="text-xl">📢</span> 주의사항
                    </h3>
                    <ul className="list-disc pl-5 text-gray-700 space-y-2 text-sm">
                        <li>예약 후 노쇼(No-Show) 시 향후 캠페인 참여에 제한이 있을 수 있습니다.</li>
                        <li>제공받은 서비스/제품에 대한 리뷰는 반드시 캠페인 마감일 내에 등록해야 합니다.</li>
                        <li>리뷰 유지 기간은 최소 6개월이며, 임의 삭제 시 위약금이 청구될 수 있습니다.</li>
                    </ul>
                </div>


                {/* Apply Button Section - Moved to Bottom */}
                <div className="border-t-2 border-gray-200 pt-8">

                    {/* Options Section - Only show if campaign has options */}
                    {options.length > 0 && (
                        <div className="mb-8" id="options-section">
                            <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center gap-2">
                                <span className="text-2xl">✨</span> 제공 옵션
                                <span className="text-red-500 text-sm">*필수</span>
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">원하시는 옵션을 선택해주세요</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {options.map((opt: any, idx: number) => {
                                    // 옵션이 객체인 경우(최신형)와 문자열인 경우(레거시) 모두 대응
                                    const optionLabel = typeof opt === 'object' ? opt.optionName : opt;
                                    const isSelected = typeof selectedOption === 'object' 
                                        ? (selectedOption as any).optionName === optionLabel
                                        : selectedOption === optionLabel;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => !hasApplied && setSelectedOption(opt)}
                                            disabled={hasApplied}
                                            className={`p-4 rounded-xl border-2 font-medium text-left flex items-center gap-3 transition-all ${isSelected
                                                ? 'border-primary bg-rose-50 text-primary'
                                                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-primary hover:bg-rose-50'
                                                } ${hasApplied ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                        >
                                            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSelected
                                                ? 'border-primary bg-primary text-white'
                                                : 'border-gray-300 bg-white text-gray-400'
                                                }`}>
                                                {isSelected ? '✓' : idx + 1}
                                            </span>
                                            <span className="flex-1">{optionLabel}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedOption && !hasApplied && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">
                                        ✓ 선택된 옵션: <strong>{typeof selectedOption === 'object' ? (selectedOption as any).optionName : selectedOption}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Application Message Section */}
                    {!hasApplied && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center gap-2">
                                <span className="text-2xl">💬</span> 자유 멘트
                                <span className="text-gray-400 text-sm font-normal">(선택사항)</span>
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                어필할 점이나 하고 싶은 말씀을 자유롭게 작성해주세요. 리뷰어 선정 시 참고자료로 활용됩니다.
                            </p>
                            <textarea
                                value={applicationMessage}
                                onChange={(e) => setApplicationMessage(e.target.value)}
                                placeholder="예) 해당 분야에 관심이 많아 신청하게 되었습니다. 성실하게 리뷰 작성하겠습니다!"
                                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none resize-none transition-colors"
                                rows={5}
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-400 mt-2 text-right">
                                {applicationMessage.length} / 500자
                            </p>
                        </div>
                    )}

                    {/* Display submitted message if already applied */}
                    {hasApplied && applicationMessage && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center gap-2">
                                <span className="text-2xl">💬</span> 제출한 자유 멘트
                            </h2>
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                <p className="text-gray-700 whitespace-pre-wrap">{applicationMessage}</p>
                            </div>
                        </div>
                    )}

                    {!user && (
                        <p className="text-center text-sm text-gray-500 mb-4">
                            * 로그인 후 신청 가능합니다
                        </p>
                    )}
                    {options.length > 0 && !hasApplied && (
                        <p className="text-center text-sm text-orange-600 mb-4 font-medium">
                            ⚠️ 제공 옵션을 선택하신 후 신청해주세요
                        </p>
                    )}

                    {!hasApplied ? (
                        <button
                            onClick={handleApply}
                            disabled={!user}
                            className={`btn w-full py-5 text-xl font-bold shadow-lg transition-all ${!user
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'btn-primary shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1'
                                }`}
                        >
                            체험단 신청하기
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 py-5 bg-green-50 border-2 border-green-200 rounded-lg">
                                <span className="text-2xl">✓</span>
                                <span className="text-xl font-bold text-green-700">신청 완료</span>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="w-full py-3 text-sm font-medium text-red-600 hover:text-white hover:bg-red-500 border-2 border-red-300 rounded-lg transition-all hover:border-red-500"
                            >
                                신청 취소하기
                            </button>
                            <p className="text-xs text-center text-gray-500">
                                * 심사중인 신청만 취소할 수 있습니다
                            </p>
                        </div>
                    )}

                    {hasApplied && selectedOption && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <p className="text-sm text-blue-800">
                                선택하신 옵션: <strong>{typeof selectedOption === 'object' ? (selectedOption as any).optionName : selectedOption}</strong>
                            </p>
                        </div>
                    )}
                </div>

            </div>

            {/* Cancel Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
                onConfirm={confirmCancel}
                title="신청 취소"
                message={`정말 이 캠페인 신청을 취소하시겠습니까?\n\n취소 후 다시 신청하실 수 있습니다.`}
                confirmText="취소하기"
                cancelText="돌아가기"
                type="danger"
            />
        </div>
    );
}
