import Link from 'next/link';

// Using server component for detail page ideally, but for now we skip data fetching
export default function CampaignDetailPage({ params }: { params: { id: string } }) {
    // Mock Data
    const data = {
        id: params.id,
        title: "[강남] 프리미엄 오마카세 2인 식사권 제공",
        platform: "BLOG",
        category: "맛집",
        address: "서울 강남구 테헤란로 123",
        recruitCount: 5,
        applicantCount: 15,
        startDate: "2024.12.10",
        endDate: "2024.12.20",
        points: 0,
        description: `강남 중심에서 즐기는 프리미엄 스시 오마카세입니다.
    신선한 제철 식재료를 사용하여 셰프가 직접 눈앞에서 만들어드립니다.
    조용하고 프라이빗한 공간에서 특별한 미식 경험을 해보세요.`,
        mission: [
            "매장 내/외부 사진 10장 이상 포함",
            "메인 메뉴 동영상 1개 이상 필수",
            "키워드: #강남맛집 #오마카세 #스시맛집 필수 태그",
            "지도 위치 첨부 필수"
        ],
        caution: "예약 후 노쇼 시 패널티가 부과될 수 있습니다."
    };

    return (
        <div className="container py-16 max-w-[1000px] w-[90%] mx-auto">
            {/* Top Section: Img + Info */}
            <div className="flex flex-col md:flex-row gap-12 mb-16">
                <div className="flex-1 bg-pink-100 rounded-2xl min-h-[400px] border border-border flex items-center justify-center text-2xl text-primary-light">
                    이미지 영역
                </div>
                <div className="flex-1 flex flex-col">
                    <div>
                        <span className="inline-block bg-primary text-white px-3 py-1.5 rounded-full font-bold text-sm mb-4">{data.platform}</span>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-text-main mb-6 leading-tight">{data.title}</h1>
                    </div>

                    <div className="mb-8 border-y border-slate-100 py-6">
                        <div className="flex justify-between mb-3 last:mb-0 text-base">
                            <span className="text-text-secondary font-medium">모집기간</span>
                            <span className="text-text-main font-semibold">{data.startDate} ~ {data.endDate}</span>
                        </div>
                        <div className="flex justify-between mb-3 last:mb-0 text-base">
                            <span className="text-text-secondary font-medium">모집인원</span>
                            <span className="text-text-main font-semibold">{data.recruitCount}명 (현재 {data.applicantCount}명 신청중)</span>
                        </div>
                        <div className="flex justify-between mb-3 last:mb-0 text-base">
                            <span className="text-text-secondary font-medium">제공내역</span>
                            <span className="text-text-main font-semibold">디너 오마카세 2인 (25만원 상당)</span>
                        </div>
                        <div className="flex justify-between mb-3 last:mb-0 text-base">
                            <span className="text-text-secondary font-medium">지역</span>
                            <span className="text-text-main font-semibold">{data.address}</span>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button className="btn btn-primary w-full py-4 text-xl shadow-lg shadow-primary/20">
                            체험단 신청하기
                        </button>
                        <div className="text-center mt-4 text-sm text-gray-400">
                            로그인이 필요합니다
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Details */}
            <div className="bg-white border border-border rounded-2xl p-12">
                <h2 className="text-2xl font-bold mb-6 text-text-main border-b-2 border-pink-100 pb-2 inline-block">캠페인 소개</h2>
                <div className="text-base leading-loose text-gray-700 mb-12 whitespace-pre-line">
                    {data.description}
                </div>

                <div className="bg-rose-50 p-8 rounded-xl border border-dashed border-primary-light mb-8">
                    <h3 className="text-lg font-bold text-primary-dark mb-4">🎯 필수 미션</h3>
                    <ul className="list-disc pl-6 text-text-main space-y-2">
                        {data.mission.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                </div>

                <h2 className="text-2xl font-bold mb-6 text-text-main border-b-2 border-pink-100 pb-2 inline-block">주의사항</h2>
                <div className="text-base leading-loose text-red-500">
                    {data.caution}
                </div>
            </div>
        </div>
    );
}
