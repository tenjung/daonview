import { NextResponse } from 'next/server';
import { approveRefundRequest, RefundRequestError, requireAdminContext } from '@/lib/payments/refund';

interface ApproveRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, context: ApproveRouteContext) {
  try {
    const { user } = await requireAdminContext();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const result = await approveRefundRequest({
      requestId: id,
      reviewerUserId: user.id,
      refundType: body.refundType,
      refundAmount: body.refundAmount,
      adminNote: body.adminNote,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof RefundRequestError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error('Refund approve error:', error);
    return NextResponse.json(
      { success: false, message: '환불 승인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
