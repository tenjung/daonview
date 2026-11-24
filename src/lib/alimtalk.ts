/**
 * 솔라피 카카오 알림톡 유틸리티 함수
 */

import { AlimtalkRequest, AlimtalkResponse } from '@/types/alimtalk';

export const ALIMTALK_PAUSED = true;

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
 * 인플루언서 리뷰 승인 알림톡 발송
 * @param to - 수신자 전화번호
 * @param influencerName - 인플루언서 이름
 * @param campaignTitle - 캠페인 제목
 */
export async function sendReviewApprovedAlimtalk(
    to: string,
    influencerName: string,
    campaignTitle: string
): Promise<AlimtalkResponse> {
    if (!isValidPhoneNumber(to)) {
        return {
            success: false,
            error: '유효하지 않은 전화번호입니다.'
        };
    }

    const request: AlimtalkRequest = {
        to: formatPhoneNumber(to),
        templateCode: process.env.SOLAPI_TEMPLATE_REVIEW_APPROVED || 'REVIEW_APPROVED',
        variables: {
            '인플루언서명': influencerName,
            '캠페인명': campaignTitle,
            '승인일': new Date().toLocaleDateString('ko-KR')
        }
    };

    return sendAlimtalk(request);
}

/**
 * 인플루언서 배송 시작 알림톡 발송
 * @param to - 수신자 전화번호
 * @param influencerName - 인플루언서 이름
 * @param campaignTitle - 캠페인 제목
 * @param trackingCompany - 택배사
 * @param trackingNumber - 운송장 번호
 */
export async function sendShippingStartedAlimtalk(
    to: string,
    influencerName: string,
    campaignTitle: string,
    trackingCompany: string,
    trackingNumber: string
): Promise<AlimtalkResponse> {
    if (!isValidPhoneNumber(to)) {
        return {
            success: false,
            error: '유효하지 않은 전화번호입니다.'
        };
    }

    const request: AlimtalkRequest = {
        to: formatPhoneNumber(to),
        templateCode: process.env.SOLAPI_TEMPLATE_SHIPPING_STARTED || 'SHIPPING_STARTED',
        variables: {
            '인플루언서명': influencerName,
            '캠페인명': campaignTitle,
            '택배사': trackingCompany,
            '운송장번호': trackingNumber,
            '안내문구': '체험 후 1주일 이내에 리뷰 작성을 꼭 완료해주세요!'
        }
    };

    return sendAlimtalk(request);
}

/**
 * 알림톡 발송 공통 함수
 * @param request - 알림톡 요청 데이터
 */
async function sendAlimtalk(request: AlimtalkRequest): Promise<AlimtalkResponse> {
    if (ALIMTALK_PAUSED) {
        return { success: false, error: '카카오 알림톡 발송이 일시 중지되었습니다.', statusCode: 503 };
    }

    try {
        const isServerRuntime = typeof window === 'undefined';
        const siteUrl =
            process.env.NEXT_PUBLIC_SITE_URL ||
            process.env.SITE_URL ||
            'http://localhost:3000';
        const endpoint = isServerRuntime
            ? `${siteUrl.replace(/\/$/, '')}/api/send-alimtalk`
            : '/api/send-alimtalk';

        const response = await fetch(endpoint, {
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
