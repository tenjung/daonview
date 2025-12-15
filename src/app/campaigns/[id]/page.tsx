import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminControls from '@/components/AdminControls';

export const revalidate = 0; // Disable static caching for real-time updates

export default async function CampaignDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    // Fetch Data
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*, applications(count)')
        .eq('id', id)
        .single();

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
    // @ts-ignore
    const appCount = campaign.applications?.[0]?.count ?? campaign.applications?.count ?? 0;

    // Date Formatting
    const startDate = new Date(campaign.created_at).toLocaleDateString(); // Using Created At as start for now
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

                    <div className="mt-auto">
                        <p className="text-center text-xs text-gray-400 mb-2">
                            * 로그인 후 신청 가능합니다
                        </p>
                        <button className="btn btn-primary w-full py-4 text-xl shadow-lg shadow-primary/20 hover:-translate-y-1 transition-transform">
                            체험단 신청하기
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Details */}
            <div className="bg-white border border-border rounded-2xl p-8 sm:p-12 shadow-sm">

                {/* Options Section */}
                {options.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                            <span className="text-2xl">✨</span> 제공 옵션 (선택)
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {options.map((opt: string, idx: number) => (
                                <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50 font-medium text-gray-700 flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-400">{idx + 1}</span>
                                    {opt}
                                </div>
                            ))}
                        </div>
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

            </div>
        </div>
    );
}
