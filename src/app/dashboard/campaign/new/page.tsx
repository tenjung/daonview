'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

type CampaignType = 'VISIT' | 'DELIVERY' | 'PURCHASE';

export default function NewCampaignPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<CampaignType>('VISIT');
    
    // Form States
    const [title, setTitle] = useState('');
    const [platform, setPlatform] = useState('BLOG');
    const [category, setCategory] = useState('맛집'); // Default category
    const [recruitCount, setRecruitCount] = useState(0);
    const [recruitStartDate, setRecruitStartDate] = useState('');
    const [recruitEndDate, setRecruitEndDate] = useState('');
    const [announceDate, setAnnounceDate] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    
    // Detail States
    const [storeName, setStoreName] = useState('');
    const [storeAddress, setStoreAddress] = useState('');
    const [productName, setProductName] = useState('');
    const [mission, setMission] = useState('');
    const [keywords, setKeywords] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate required fields
            if (!title || !recruitEndDate || !mission) {
                toast.error('필수 정보를 모두 입력해주세요.');
                setLoading(false);
                return;
            }

            const { error } = await supabase
                .from('campaigns')
                .insert([
                    {
                        type,
                        platform,
                        category,
                        title,
                        description: mission, // Using mission/guide as description
                        recruit_count: Number(recruitCount),
                        end_date: recruitEndDate, // Recruiting ends
                        status: 'RECRUITING',
                        thumbnail_url: thumbnailUrl || null,
                        // Additional fields could be stored in a JSONB column if the schema supported it, 
                        // but for now we map to existing columns. 
                        // If we had 'region' in DB, we could map storeAddress to it.
                    }
                ]);

            if (error) throw error;

            toast.success('캠페인이 성공적으로 등록되었습니다!');
            router.push('/dashboard/admin'); // Redirect to admin dashboard

        } catch (error: any) {
            console.error('Campaign Create Error:', error);
            toast.error(`등록 실패: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center py-10">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8">새 캠페인 등록</h1>

                {/* Type Selection */}
                <div className="flex gap-4 mb-10 p-2 bg-gray-100 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setType('VISIT')}
                        className={`flex-1 py-4 px-6 rounded-lg text-lg font-bold transition-all ${type === 'VISIT'
                                ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:bg-gray-200/50'
                            }`}
                    >
                        🏢 방문 체험
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('DELIVERY')}
                        className={`flex-1 py-4 px-6 rounded-lg text-lg font-bold transition-all ${type === 'DELIVERY'
                                ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:bg-gray-200/50'
                            }`}
                    >
                        📦 배송 체험
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('PURCHASE')}
                        className={`flex-1 py-4 px-6 rounded-lg text-lg font-bold transition-all ${type === 'PURCHASE'
                                ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:bg-gray-200/50'
                            }`}
                    >
                        🛒 구매평/기자단
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Section 1: Basic Info */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">기본 정보</h2>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">캠페인 제목 <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                                placeholder="예: [강남] 분위기 좋은 데이트 코스 파스타 맛집 체험단" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">채널 선택 <span className="text-red-500">*</span></label>
                                <select 
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                    required
                                >
                                    <option value="BLOG">블로그</option>
                                    <option value="INSTAGRAM">인스타그램</option>
                                    <option value="YOUTUBE">유튜브</option>
                                    <option value="TIKTOK">틱톡/릴스/숏츠</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리 <span className="text-red-500">*</span></label>
                                <select 
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    required
                                >
                                    <option value="맛집">맛집</option>
                                    <option value="뷰티">뷰티</option>
                                    <option value="여행">여행/숙박</option>
                                    <option value="생활">생활/리빙</option>
                                    <option value="푸드">푸드</option>
                                    <option value="IT">IT/가전</option>
                                    <option value="패션">패션</option>
                                    <option value="유아동">유아동</option>
                                    <option value="반려동물">반려동물</option>
                                    <option value="기타">기타</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">모집 인원 <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                                        placeholder="0" 
                                        min="1" 
                                        value={recruitCount}
                                        onChange={(e) => setRecruitCount(Number(e.target.value))}
                                        required 
                                    />
                                    <span className="text-gray-500 font-medium">명</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">당첨자 발표일 <span className="text-red-500">*</span></label>
                                <input 
                                    type="date" 
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300" 
                                    value={announceDate}
                                    onChange={(e) => setAnnounceDate(e.target.value)}
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                             <label className="block text-sm font-semibold text-gray-700 mb-2">모집 기간 <span className="text-red-500">*</span></label>
                             <div className="flex items-center gap-2">
                                 <input 
                                     type="date" 
                                     className="w-full px-4 py-3 rounded-lg border border-gray-300" 
                                     value={recruitStartDate}
                                     onChange={(e) => setRecruitStartDate(e.target.value)}
                                     required 
                                 />
                                 <span>~</span>
                                 <input 
                                     type="date" 
                                     className="w-full px-4 py-3 rounded-lg border border-gray-300" 
                                     value={recruitEndDate}
                                     onChange={(e) => setRecruitEndDate(e.target.value)}
                                     required 
                                 />
                             </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">대표 이미지 <span className="text-red-500">*</span></label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                                <p className="text-sm text-gray-500 mb-2">대표 이미지 URL을 입력해주세요 (임시)</p>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded" 
                                    placeholder="https://example.com/image.jpg"
                                    value={thumbnailUrl}
                                    onChange={(e) => setThumbnailUrl(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Detail Info (Conditional) */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">
                            {type === 'VISIT' && '방문 정보 및 미션'}
                            {type === 'DELIVERY' && '배송 상품 정보 및 미션'}
                            {type === 'PURCHASE' && '구매 및 페이백 정보'}
                        </h2>

                        {/* ---------- VISIT TYPE ---------- */}
                        {type === 'VISIT' && (
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">업체명 (상호명) <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300" 
                                        placeholder="네이버 플레이스에 등록된 정확한 상호명" 
                                        value={storeName}
                                        onChange={(e) => setStoreName(e.target.value)}
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">업체 주소 <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300" 
                                        placeholder="방문하실 매장 주소를 입력해주세요" 
                                        value={storeAddress}
                                        onChange={(e) => setStoreAddress(e.target.value)}
                                        required 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">영업시간 및 휴무일</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="예: 매일 10:00~22:00, 연중무휴" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">체험 가능 시간 <span className="text-red-500">*</span></label>
                                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="예: 평일 14:00 이후, 주말 불가" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">예약 방법</label>
                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="예: 방문 2일 전 문자 예약 (010-XXXX-XXXX)" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">원하는 인플루언서 유형</label>
                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="예: 20-30대 커플, 맛집 전문 블로거" />
                                </div>
                            </div>
                        )}

                        {/* ---------- DELIVERY TYPE ---------- */}
                        {type === 'DELIVERY' && (
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">제공 상품명 <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300" 
                                        placeholder="리뷰어에게 배송될 정확한 상품명" 
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        required 
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">시중 판매가</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="예: 35,000원" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">쇼핑몰 링크</label>
                                        <input type="url" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="http://" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">제품 상세 정보 / 사양 (참고용)</label>
                                    <textarea className="w-full px-4 py-3 rounded-lg border border-gray-300 h-24 resize-none" placeholder="포스팅 시 참고할 수 있는 제품의 특장점이나 스펙을 적어주세요."></textarea>
                                </div>
                            </div>
                        )}

                        {/* ---------- PURCHASE TYPE (Simple) ---------- */}
                        {type === 'PURCHASE' && (
                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800 mb-2">
                                    🛍️ <strong>구매형 캠페인 안내:</strong> 리뷰어가 직접 상품을 구매하고 리뷰 작성 후 포인트(페이백)를 받는 방식입니다.
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">구매처 링크 <span className="text-red-500">*</span></label>
                                    <input type="url" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="구매가 일어날 쇼핑몰 URL" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">구매 필수 옵션/가격</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="예: 1+1 세트 필수 구매" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">페이백 포인트 <span className="text-red-500">*</span></label>
                                        <input type="number" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="리뷰 완료 시 지급할 포인트" required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Common Mission Fields (All Types) */}
                        <div className="border-t border-gray-100 pt-6 mt-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">필수 키워드 <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2 mb-2">
                                        <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-500"># 없이 입력 (예: 강남맛집, 파스타)</span>
                                    </div>
                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="제목/본문에 들어갈 키워드를 쉼표(,)로 구분하여 입력해주세요" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">리뷰 가이드 / 요청사항 <span className="text-red-500">*</span></label>
                                    <textarea 
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 h-40 resize-none" 
                                        placeholder="포스팅 시 꼭 들어가야 할 내용, 사진 가이드, 강조하고 싶은 점 등을 자세히 적어주세요." 
                                        value={mission}
                                        onChange={(e) => setMission(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                {type === 'VISIT' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">추가 제공 내역 / 비용 부담</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="기본 제공 내역 외 추가 주문 시 본인 부담 여부 등" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Policies & Privacy (Especially for Delivery) */}
                        <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200 text-sm text-gray-600">
                            <h3 className="font-bold text-gray-900 mb-4">📢 필독 확인사항</h3>

                            <div className="space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" className="mt-1 w-4 h-4 accent-primary shrink-0" required />
                                    <span>
                                        <strong>[환불/취소 규정]</strong> 체험단 모집 공고 게시 후 단순 변심에 의한 취소/환불은 불가합니다.
                                        모집 미달 시 다온뷰 정책에 따라 미달된 인원만큼 부분 환불(포인트) 처리됩니다.
                                    </span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" className="mt-1 w-4 h-4 accent-primary shrink-0" required />
                                    <span>
                                        <strong>[공정위 문구]</strong> 모든 리뷰 컨텐츠 최하단에는 "본 포스팅은 다온뷰를 통해 업체로부터 서비스를 제공받아 작성된 글입니다"
                                        라는 공정거래위원회 표준 문구가 반드시 포함되어야 함을 확인했습니다.
                                    </span>
                                </label>
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                        <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">
                            취소하기
                        </button>
                        <button type="submit" disabled={loading} className="px-10 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark hover:-translate-y-1 transition-all disabled:opacity-50">
                            {loading ? '등록 중...' : '캠페인 등록 신청'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
