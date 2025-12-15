'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminControls from '@/components/AdminControls';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'sonner';

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
    const [showCancelDialog, setShowCancelDialog] = useState(false);

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
                    .select('id, selected_option')
                    .eq('user_id', currentUser.id)
                    .eq('campaign_id', id)
                    .maybeSingle();

                if (!appError && applicationData) {
                    setHasApplied(true);
                    setSelectedOption(applicationData.selected_option || '');
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

        // Parse Options
        const options = Array.isArray(campaign.campaign_options) ? campaign.campaign_options : [];

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
                    selected_option: selectedOption || null
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

    // Parse Options
    const options = Array.isArray(campaign.campaign_options) ? campaign.campaign_options : [];

    return (
        <div className="container py-16 max-w-[1000px] w-[90%] mx-auto">
            {/* Top Section: Img + Info */}
            <div className="flex flex-col md:flex-row gap-12 mb-16">
                {/* Image Area */}
                <div className="flex-1 bg-gray-50 rounded-2xl min-h-[400px] max-h-[500px] border border-border flex items-center justify-center overflow-hidden relative shadow-sm">
                    {campaign.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={campaign.thumbnail_url}
                            alt={campaign.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-2xl text-gray-300 font-bold">No Image</div>
                    )}
                    <button
                        onClick={toggleFavorite}
                        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                    >
                        {isFavorite ? (
                            <span className="text-2xl">❤️</span>
                        ) : (
                            <span className="text-2xl">🤍</span>
                        )}
                    </button>
                </div>

                {/* Info Area */}
                <div className="flex-1 flex flex-col">
                    <div>
                        <AdminControls campaignId={campaign.id} />
                        <div className="flex gap-2 mb-4">
                            <span className="inline-block bg-slate-800 text-white px-3 py-1 rounded font-bold text-xs uppercase tracking-wider">{campaign.platform}</span>
                            <span className={`inline-block px-3 py-1 rounded font-bold text-xs ${isVisit ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {isVisit ? '방문형' : (isDelivery ? '배송형' : '기자단')}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-text-main mb-6 leading-tight break-keep">
                            {campaign.title}
                        </h1>
                    </div>

                    <div className="mb-8 border-y border-slate-100 py-6 space-y-3">
                        <div className="flex justify-between text-base">
                            <span className="text-gray-500 font-medium">모집기간</span>
                            <span className="text-gray-900 font-bold">{startDate} ~ {endDate}</span>
                        </div>
                        <div className="flex justify-between text-base">
                            <span className="text-gray-500 font-medium">모집인원</span>
                            <span className="text-gray-900 font-bold">
                                {campaign.recruit_count}명
                                <span className="text-primary ml-1">(현재 {appCount}명 신청)</span>
                            </span>
                        </div>

                        {isVisit && campaign.store_address && (
                            <div className="flex justify-between text-base">
                                <span className="text-gray-500 font-medium">지역/위치</span>
                                <span className="text-gray-900 font-bold text-right break-keep w-2/3">{campaign.store_address}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-base">
                            <span className="text-gray-500 font-medium">제공내역</span>
                            <span className="text-primary font-bold">{campaign.provision || '별도 표기'}</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800 text-center">
                            📋 <strong>아래 캠페인 내용을 모두 확인</strong>하신 후<br />
                            하단의 <strong>체험단 신청하기</strong> 버튼을 눌러주세요
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Details */}
            <div className="bg-white border border-border rounded-2xl p-8 sm:p-12 shadow-sm">

                {/* Options Section */}
                {options.length > 0 && (
                    <div className="mb-12" id="options-section">
                        <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center gap-2">
                            <span className="text-2xl">✨</span> 제공 옵션 (선택)
                            <span className="text-red-500 text-sm">*필수</span>
                        </h2>
                        <p className="text-sm text-gray-600 mb-6">원하시는 옵션을 선택해주세요</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {options.map((opt: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => !hasApplied && setSelectedOption(opt)}
                                    disabled={hasApplied}
                                    className={`p-4 rounded-xl border-2 font-medium text-left flex items-center gap-3 transition-all ${selectedOption === opt
                                        ? 'border-primary bg-rose-50 text-primary'
                                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-primary hover:bg-rose-50'
                                        } ${hasApplied ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                >
                                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${selectedOption === opt
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-gray-300 bg-white text-gray-400'
                                        }`}>
                                        {selectedOption === opt ? '✓' : idx + 1}
                                    </span>
                                    <span className="flex-1">{opt}</span>
                                </button>
                            ))}
                        </div>
                        {selectedOption && !hasApplied && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                    ✓ 선택된 옵션: <strong>{selectedOption}</strong>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <h2 className="text-2xl font-bold mb-6 text-text-main border-b-2 border-pink-100 pb-2 inline-block">캠페인 미션 & 가이드</h2>

                {/* Description Body */}
                <div className="text-base leading-loose text-gray-700 mb-12 whitespace-pre-line min-h-[100px]">
                    {campaign.description}
                </div>

                {/* Sub Images */}
                {(campaign.sub_image_1 || campaign.sub_image_2) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {campaign.sub_image_1 && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={campaign.sub_image_1} alt="Detail 1" className="rounded-xl w-full object-cover border border-gray-100" />
                        )}
                        {campaign.sub_image_2 && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={campaign.sub_image_2} alt="Detail 2" className="rounded-xl w-full object-cover border border-gray-100" />
                        )}
                    </div>
                )}

                {/* Map Section */}
                {campaign.naver_map_url && (
                    <div className="bg-green-50 p-6 rounded-xl border border-green-100 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-green-800 mb-1">📍 체험 매장 위치</h3>
                            <p className="text-green-700 text-sm">{campaign.store_name} ({campaign.store_address})</p>
                        </div>
                        <a
                            href={campaign.naver_map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap"
                        >
                            네이버 지도로 보기
                        </a>
                    </div>
                )}

                <div className="bg-rose-50 p-8 rounded-xl border border-dashed border-primary-light mb-8">
                    <h3 className="text-lg font-bold text-primary-dark mb-4">📢 주의사항</h3>
                    <ul className="list-disc pl-5 text-gray-700 space-y-2 text-sm">
                        <li>예약 후 노쇼(No-Show) 시 향후 캠페인 참여에 제한이 있을 수 있습니다.</li>
                        <li>제공받은 서비스/제품에 대한 리뷰는 반드시 캠페인 마감일 내에 등록해야 합니다.</li>
                        <li>리뷰 유지 기간은 최소 6개월이며, 임의 삭제 시 위약금이 청구될 수 있습니다.</li>
                    </ul>
                </div>


                {/* Apply Button Section - Moved to Bottom */}
                <div className="border-t-2 border-gray-200 pt-8">
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
                                선택하신 옵션: <strong>{selectedOption}</strong>
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
