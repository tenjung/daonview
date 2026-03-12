'use client';

import { toast } from 'sonner';

interface PortOnePaymentResponse {
    code?: string | number | null;
    message?: string;
    [key: string]: unknown;
}

interface PortOneBrowserSDK {
    requestPayment: (request: Record<string, unknown>) => Promise<PortOnePaymentResponse>;
    requestIssueBillingKey: (request: Record<string, unknown>) => Promise<PortOnePaymentResponse>;
}

declare global {
    interface Window {
        PortOne?: PortOneBrowserSDK;
    }
}

const PORTONE_SDK_URL = 'https://cdn.portone.io/v2/browser-sdk.js';
let portOneSdkPromise: Promise<PortOneBrowserSDK> | null = null;

const loadPortOneSdk = async (): Promise<PortOneBrowserSDK> => {
    if (typeof window === 'undefined') {
        throw new Error('브라우저 환경에서만 결제를 진행할 수 있습니다.');
    }

    if (window.PortOne) {
        return window.PortOne;
    }

    if (!portOneSdkPromise) {
        portOneSdkPromise = new Promise((resolve, reject) => {
            const existingScript = document.querySelector<HTMLScriptElement>('script[data-portone-sdk="v2"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => {
                    if (window.PortOne) resolve(window.PortOne);
                    else reject(new Error('포트원 SDK 로드에 실패했습니다.'));
                });
                existingScript.addEventListener('error', () => reject(new Error('포트원 SDK 스크립트 로딩 실패')));
                return;
            }

            const script = document.createElement('script');
            script.src = PORTONE_SDK_URL;
            script.async = true;
            script.dataset.portoneSdk = 'v2';
            script.onload = () => {
                if (window.PortOne) resolve(window.PortOne);
                else reject(new Error('포트원 SDK 초기화에 실패했습니다.'));
            };
            script.onerror = () => reject(new Error('포트원 SDK 스크립트 로딩 실패'));
            document.head.appendChild(script);
        });
    }

    return portOneSdkPromise;
};

interface PaymentRequest {
    paymentId: string;
    orderName: string;
    totalAmount: number;
    customerName?: string;
    customerEmail?: string;
    customerTel?: string;
    userId: string;
    campaignId?: number;
    itemType?: 'CAMPAIGN' | 'UNLIMITED';
    planMonths?: number;
    payMethod?: 'CARD' | 'TRANSFER' | 'VIRTUAL_ACCOUNT' | 'MOBILE' | 'EASY_PAY';
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
        itemType = 'CAMPAIGN',
        planMonths,
        payMethod,
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
                payMethod: payMethod || 'CARD',
                customer: {
                    fullName: customerName || '구매자',
                    email: customerEmail || 'customer@example.com',
                    phoneNumber: customerTel?.replace(/[^0-9]/g, '') || '01000000000',
                },
                customData: {
                    item: itemType === 'UNLIMITED' ? 'unlimited-plan' : 'campaign-payment',
                    userId,
                    campaignId,
                    ...(itemType === 'UNLIMITED' && planMonths ? { planMonths } : {}),
                },
            };
            console.log(JSON.stringify(requestObject, null, 2));

            // 공식 가이드 기반 + 필수 고객 정보 포함
            const portOne = await loadPortOneSdk();
            const response = await portOne.requestPayment(requestObject);

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

    const requestIssueBillingKey = async ({
        issueName,
        displayAmount,
        customerName,
        customerEmail,
        customerTel,
        userId,
        itemType = 'UNLIMITED',
        planMonths,
    }: {
        issueName: string;
        displayAmount: number;
        customerName?: string;
        customerEmail?: string;
        customerTel?: string;
        userId: string;
        itemType?: 'UNLIMITED';
        planMonths?: number;
    }) => {
        try {
            const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
            // 정기결제 전용 채널키 (env에서 읽기)
            const channelKey = process.env.NEXT_PUBLIC_PORTONE_SUBSCRIPTION_CHANNEL_KEY;

            if (!storeId || !channelKey) {
                throw new Error('포트원 정기결제 설정이 올바르지 않습니다. 환경 변수를 확인해주세요.');
            }

            const customData = {
                item: itemType === 'UNLIMITED' ? 'unlimited-plan' : 'campaign-payment',
                userId,
                ...(itemType === 'UNLIMITED' && planMonths ? { planMonths } : {}),
            };

            const portOne = await loadPortOneSdk();

            // 이니시스 V2: issueId 필수
            const issueId = [
                ...crypto.getRandomValues(new Uint32Array(2))
            ].map(w => w.toString(16).padStart(8, '0')).join('');

            // 제공기간 (월간 정기결제: 오늘 ~ 1개월 후) - ISO8601 full format 필수
            const now = new Date();
            const nextMonth = new Date(now);
            nextMonth.setMonth(now.getMonth() + 1);

            const response = await portOne.requestIssueBillingKey({
                storeId,
                channelKey,
                issueId,
                billingKeyMethod: 'CARD', // 정기결제 빌링키는 CARD만 지원
                issueName: issueName.replace(/[^a-zA-Z0-9\s가-힣]/g, '').substring(0, 40),
                displayAmount: Math.floor(Number(displayAmount)),
                currency: 'KRW',
                offerPeriod: {
                    range: { from: now.toISOString(), to: nextMonth.toISOString() },
                },
                customer: {
                    fullName: customerName || '구매자',
                    email: customerEmail || 'customer@example.com',
                    phoneNumber: customerTel?.replace(/[^0-9]/g, '') || '01000000000',
                },
                customData,
            });

            if (response?.code != null) {
                if (response.message?.includes('취소')) {
                    toast.warning(response.message);
                } else {
                    toast.error(response.message || '빌링키 발급에 실패했습니다.');
                }
                return response;
            }

            return response;
        } catch (error: any) {
            console.error('PortOne billing key issue error:', error);
            const errorMessage = error.message || '빌링키 발급 요청 중 오류가 발생했습니다.';
            toast.error(errorMessage);
            throw error;
        }
    };

    return { requestPayment: requestPortonePayment, requestIssueBillingKey };
};
