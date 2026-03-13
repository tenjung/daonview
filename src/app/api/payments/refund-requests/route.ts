import { NextResponse } from 'next/server';
import {
  RefundRequestError,
  createRefundRequest,
  getAuthenticatedUserContext,
  listRefundRequests,
} from '@/lib/payments/refund';

export async function GET() {
  try {
    const { user, role } = await getAuthenticatedUserContext();
    const requests = await listRefundRequests(role, user.id);
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    if (error instanceof RefundRequestError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error('Refund requests GET error:', error);
    return NextResponse.json(
      { success: false, message: '환불 요청 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUserContext();
    const body = await request.json().catch(() => ({}));

    const refundRequest = await createRefundRequest({
      paymentId: body.paymentId,
      requestReason: body.requestReason,
      requesterUserId: user.id,
    });

    return NextResponse.json({ success: true, refundRequest });
  } catch (error) {
    if (error instanceof RefundRequestError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error('Refund requests POST error:', error);
    return NextResponse.json(
      { success: false, message: '환불 요청 접수 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
