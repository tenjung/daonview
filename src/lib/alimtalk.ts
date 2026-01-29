/**
 * 솔라피 카카오 알림톡 유틸리티 함수
 */

import { AlimtalkRequest, AlimtalkResponse } from '@/types/alimtalk';

/**
 * 전화번호 포맷팅 (하이픈 제거)
 * @param phone - 전화번호 (010-1234-5678 또는 01012345678)
 * @returns 하이픈이 제거된 전화번호 (01012345678)
 */
export function formatPhoneNumber(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
}

/**
 * 전화번호 유효성 검사
 * @param phone - 전화번호
 * @returns 유효 여부
 */
export function isValidPhoneNumber(phone: string): boolean {
    const cleaned = formatPhoneNumber(phone);
    return /^01[0-9]{8,9}$/.test(cleaned);
}

/**
 * 인플루언서 체험 선정 알림톡 발송
 * @param to - 수신자 전화번호
 * @param influencerName - 인플루언서 이름
 * @param campaignTitle - 캠페인 제목
 * @param campaignId - 캠페인 ID
 */
export async function sendInfluencerSelectedAlimtalk(
    to: string,
    influencerName: string,
    campaignTitle: string,
    campaignId: number
): Promise<AlimtalkResponse> {
    if (!isValidPhoneNumber(to)) {
        return {
            success: false,
            error: '유효하지 않은 전화번호입니다.'
        };
    }

    try {
        // Supabase에서 캠페인 상세 정보 가져오기
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: campaign, error } = await supabase
            .from('campaigns')
            .select('type, end_date, product_name, experience_details')
            .eq('id', campaignId)
            .single();

        if (error || !campaign) {
            console.error('캠페인 정보 조회 실패:', error);
            // 캠페인 정보 없어도 기본 알림은 발송
        }

        const campaignUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://daonview.com'}/campaigns/${campaignId}`;

        // 체험 유형 한글 변환
        const typeText = campaign?.type === 'VISIT' ? '방문형' : campaign?.type === 'DELIVERY' ? '배송형' : '체험형';

        // 마감일 포맷팅
        const endDate = campaign?.end_date
            ? new Date(campaign.end_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : '상시 모집';

        // 제공내역 (product_name 또는 experience_details)
        const providedItems = campaign?.product_name || campaign?.experience_details || '캠페인 상세 페이지 참조';

        const request: AlimtalkRequest = {
            to: formatPhoneNumber(to),
            templateCode: process.env.SOLAPI_TEMPLATE_INFLUENCER_SELECTED || 'INFLUENCER_SELECTED',
            variables: {
                '인플루언서명': influencerName,
                '캠페인명': campaignTitle,
                '체험유형': typeText,
                '마감일': endDate,
                '제공내역': providedItems.length > 50 ? providedItems.substring(0, 47) + '...' : providedItems
            },
            buttons: [
                {
                    name: '캠페인 확인하기',
                    type: 'WL',
                    url_mobile: campaignUrl
                }
            ]
        };

        return sendAlimtalk(request);
    } catch (error) {
        console.error('알림톡 발송 준비 중 오류:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
        };
    }
}

/**
 * 광고주 리뷰 등록 알림톡 발송
 * @param to - 수신자 전화번호
 * @param advertiserName - 광고주 이름
 * @param campaignTitle - 캠페인 제목
 * @param influencerName - 인플루언서 이름
 * @param reviewUrl - 리뷰 URL
 */
export async function sendReviewSubmittedAlimtalk(
    to: string,
    advertiserName: string,
    campaignTitle: string,
    influencerName: string,
    reviewUrl: string
): Promise<AlimtalkResponse> {
    if (!isValidPhoneNumber(to)) {
        return {
            success: false,
            error: '유효하지 않은 전화번호입니다.'
        };
    }

    const today = new Date().toLocaleDateString('ko-KR');

    const request: AlimtalkRequest = {
        to: formatPhoneNumber(to),
        templateCode: process.env.SOLAPI_TEMPLATE_REVIEW_SUBMITTED || 'REVIEW_SUBMITTED',
        variables: {
            '광고주명': advertiserName,
            '캠페인명': campaignTitle,
            '인플루언서명': influencerName,
            '등록일': today,
            '리뷰링크': reviewUrl
        },
        buttons: [
            {
                name: '리뷰 확인하기',
                type: 'WL',
                url_mobile: reviewUrl
            }
        ]
    };

    return sendAlimtalk(request);
}

/**
 * 알림톡 발송 공통 함수
 * @param request - 알림톡 요청 데이터
 */
async function sendAlimtalk(request: AlimtalkRequest): Promise<AlimtalkResponse> {
    try {
        const response = await fetch('/api/send-alimtalk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || '알림톡 발송에 실패했습니다.',
                statusCode: response.status
            };
        }

        return {
            success: true,
            messageId: data.messageId
        };
    } catch (error) {
        console.error('알림톡 발송 오류:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
        };
    }
}
