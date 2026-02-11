'use client';

import PortOne from '@portone/browser-sdk/v2';
import { toast } from 'sonner';

interface PaymentRequest {
    paymentId: string;
    orderName: string;
    totalAmount: number;
    customerName?: string;
    customerEmail?: string;
    customerTel?: string;
    userId: string;
    campaignId: number;
}

export const usePortonePayment = () => {
    const requestPortonePayment = async ({
        paymentId: originalPaymentId,
        orderName,
        totalAmount,
        customerName,
        customerEmail,
        customerTel,
        userId,
        campaignId,
    }: PaymentRequest) => {
        try {
            const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
            const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

            if (!storeId || !channelKey) {
                throw new Error('포트원 설정이 올바르지 않습니다. 환경 변수를 확인해주세요.');
            }

            // 공식 예제 방식의 랜덤 ID 생성 (16진수)
            const randomId = () => {
                return [...crypto.getRandomValues(new Uint32Array(2))]
                    .map((word) => word.toString(16).padStart(8, '0'))
                    .join('');
            };

            const paymentId = randomId();
            const sanitizedOrderName = orderName.replace(/[^a-zA-Z0-9\s가-힣]/g, '').substring(0, 40);

            console.log('--- PortOne V2 Final (Sync with Official Reference + Mandatory Customer) ---');
            
            const requestObject = {
                storeId,
                channelKey,
                paymentId,
                orderName: sanitizedOrderName,
                totalAmount: Math.floor(Number(totalAmount)),
                currency: 'KRW',
                payMethod: 'CARD',
                customer: {
                    fullName: customerName || '구매자',
                    email: customerEmail || 'customer@example.com',
                    phoneNumber: customerTel?.replace(/[^0-9]/g, '') || '01000000000',
                },
                customData: {
                    item: 'campaign-payment',
                    userId,
                    campaignId,
                },
            };
            console.log(JSON.stringify(requestObject, null, 2));

            // 공식 가이드 기반 + 필수 고객 정보 포함
            const response = await PortOne.requestPayment(requestObject as any);

            // 결과 처리
            if (response?.code != null) {
                // 사용자가 취소한 경우는 에러 토스트를 띄우지 않거나 경고 정도로 표시
                if (response.message?.includes('취소')) {
                    toast.warning(response.message);
                } else {
                    toast.error(response.message || '결제에 실패했습니다.');
                }
                return response; // 에러가 있어도 response 반환 (throw 하지 않음)
            }

            return response;
        } catch (error: any) {
            console.error('PortOne payment error:', error);
            const errorMessage = error.message || '결제 요청 중 오류가 발생했습니다.';
            toast.error(errorMessage);
            throw error;
        }
    };

    return { requestPayment: requestPortonePayment };
};
