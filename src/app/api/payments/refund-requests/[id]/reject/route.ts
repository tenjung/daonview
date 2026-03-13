import { NextResponse } from 'next/server';
import { rejectRefundRequest, RefundRequestError, requireAdminContext } from '@/lib/payments/refund';

interface RejectRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, context: RejectRouteContext) {
  try {
    const { user } = await requireAdminContext();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const refundRequest = await rejectRefundRequest({
      requestId: id,
      reviewerUserId: user.id,
      adminNote: body.adminNote,
    });

    return NextResponse.json({ success: true, refundRequest });
  } catch (error) {
    if (error instanceof RefundRequestError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error('Refund reject error:', error);
    return NextResponse.json(
      { success: false, message: '환불 반려 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
