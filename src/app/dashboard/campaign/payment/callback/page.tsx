'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function PaymentCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handlePaymentResult = async () => {
            const searchParams = new URLSearchParams(window.location.search);
            const paymentId = searchParams.get('paymentId');

            if (!paymentId) {
                toast.error('결제 정보가 없습니다.');
                router.push('/dashboard/campaign/new');
                return;
            }

            // 결제 검증 API 호출
            try {
                const response = await fetch('/api/payments/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ paymentId }),
                });

                const result = await response.json();

                if (result.success) {
                    toast.success('결제가 완료되었습니다!');
                    // 캠페인 등록 완료 처리
                    setTimeout(() => {
                        router.push('/dashboard/advertiser/campaigns');
                    }, 1500);
                } else {
                    toast.error(`결제 실패: ${result.message || '알 수 없는 오류'}`);
                    setTimeout(() => {
                        router.push('/dashboard/campaign/new');
                    }, 2000);
                }
            } catch (error) {
                console.error('Payment verification error:', error);
                toast.error('결제 검증 중 오류가 발생했습니다.');
                setTimeout(() => {
                    router.push('/dashboard/campaign/new');
                }, 2000);
            }
        };

        handlePaymentResult();
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-12 text-center max-w-md">
                <div className="mb-6">
                    <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    결제 처리 중
                </h2>
                <p className="text-gray-600 leading-relaxed">
                    결제 결과를 확인하고 있습니다.<br />
                    잠시만 기다려주세요...
                </p>
            </div>
        </div>
    );
}
