import { PaymentClient } from '@portone/server-sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  fetchPortOnePayment,
  syncPortOnePayment,
  type PortOnePaymentRecord,
} from '@/lib/payments/portone';
import type { RefundRequestPresenter, RefundRequestRecord, RefundType } from '@/types/paymentRefund';

type AppRole = 'ADMIN' | 'ADVERTISER' | 'INFLUENCER' | null;

const OPEN_REQUEST_STATUSES = new Set(['REQUESTED', 'APPROVED']);
const REFUND_REQUEST_STATUSES = new Set(['REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']);
const PAYMENT_REFUNDABLE_STATUSES = new Set(['PAID', 'PARTIAL_CANCELLED']);

export class RefundRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'RefundRequestError';
    this.statusCode = statusCode;
  }
}

const getPortOneApiSecret = () => {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) {
    throw new RefundRequestError('PORTONE_API_SECRET is not configured', 500);
  }
  return secret;
};

const adminClient = () => createAdminClient();

export async function getAuthenticatedUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new RefundRequestError('인증이 필요합니다.', 401);
  }

  const admin = adminClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, nickname, email, company_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new RefundRequestError('사용자 정보를 확인할 수 없습니다.', 403);
  }

  return {
    user,
    role: String(profile.role || '').toUpperCase() as AppRole,
    profile,
    admin,
  };
}

export async function requireAdminContext() {
  const context = await getAuthenticatedUserContext();

  if (context.role !== 'ADMIN') {
    throw new RefundRequestError('관리자 권한이 필요합니다.', 403);
  }

  return context;
}

export async function getOwnedPaymentOrThrow(paymentId: string, userId: string) {
  const admin = adminClient();
  const { data: payment, error } = await admin
    .from('payments')
    .select('id, payment_id, user_id, amount, status, cancel_reason, cancelled_at, payment_data, campaign_id')
    .eq('payment_id', paymentId)
    .maybeSingle();

  if (error || !payment) {
    throw new RefundRequestError('결제 정보를 찾을 수 없습니다.', 404);
  }

  if (payment.user_id !== userId) {
    throw new RefundRequestError('해당 결제에 대한 요청 권한이 없습니다.', 403);
  }

  const normalizedStatus = String(payment.status || '').toUpperCase();
  if (!PAYMENT_REFUNDABLE_STATUSES.has(normalizedStatus)) {
    throw new RefundRequestError('취소 요청은 결제 완료 건에만 가능합니다.', 400);
  }

  return payment;
}

export async function getPaymentOrThrow(paymentId: string) {
  const admin = adminClient();
  const { data: payment, error } = await admin
    .from('payments')
    .select('id, payment_id, user_id, amount, status, cancel_reason, cancelled_at, payment_data, campaign_id')
    .eq('payment_id', paymentId)
    .maybeSingle();

  if (error || !payment) {
    throw new RefundRequestError('결제 정보를 찾을 수 없습니다.', 404);
  }

  return payment;
}

export async function ensureNoOpenRefundRequest(paymentId: string) {
  const admin = adminClient();
  const { data: existing, error } = await admin
    .from('payment_refund_requests')
    .select('id, status')
    .eq('payment_id', paymentId)
    .in('status', Array.from(OPEN_REQUEST_STATUSES))
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new RefundRequestError('기존 환불 요청 상태를 확인하지 못했습니다.', 500);
  }

  if (existing) {
    throw new RefundRequestError('이미 처리 중인 환불 요청이 있습니다.', 409);
  }
}

const normalizeRefundStatus = (status: string) => {
  const normalized = String(status || '').toUpperCase();
  if (!REFUND_REQUEST_STATUSES.has(normalized)) {
    throw new RefundRequestError('유효하지 않은 환불 요청 상태입니다.', 400);
  }
  return normalized as RefundRequestRecord['status'];
};

export const getCancellableAmount = (payment: PortOnePaymentRecord) => {
  const total = Number(payment.amount?.total || 0);
  const cancelled = Number(payment.amount?.cancelled || 0);
  const currentCancellableAmount = total - cancelled;

  return currentCancellableAmount > 0 ? currentCancellableAmount : 0;
};

export async function listRefundRequests(role: AppRole, userId: string): Promise<RefundRequestPresenter[]> {
  const admin = adminClient();
  let query = admin
    .from('payment_refund_requests')
    .select('*')
    .order('requested_at', { ascending: false });

  if (role !== 'ADMIN') {
    query = query.eq('requester_user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    throw new RefundRequestError('환불 요청 목록을 불러오지 못했습니다.', 500);
  }

  const requests = (data || []) as RefundRequestRecord[];
  if (requests.length === 0) {
    return [];
  }

  const profileIds = Array.from(
    new Set(
      requests
        .flatMap((request) => [request.requester_user_id, request.reviewed_by])
        .filter((value): value is string => Boolean(value))
    )
  );

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, nickname, email, company_name')
    .in('id', profileIds);

  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, profile])
  );

  return requests.map((request) => ({
    ...request,
    status: normalizeRefundStatus(request.status),
    requester: profileMap.get(request.requester_user_id) || null,
    reviewer: request.reviewed_by ? profileMap.get(request.reviewed_by) || null : null,
  }));
}

export async function createRefundRequest(input: {
  paymentId: string;
  requestReason: string;
  requesterUserId: string;
}) {
  const paymentId = String(input.paymentId || '').trim();
  const requestReason = String(input.requestReason || '').trim();

  if (!paymentId) {
    throw new RefundRequestError('paymentId가 필요합니다.', 400);
  }

  if (!requestReason) {
    throw new RefundRequestError('취소 요청 사유를 입력해 주세요.', 400);
  }

  await getOwnedPaymentOrThrow(paymentId, input.requesterUserId);
  await ensureNoOpenRefundRequest(paymentId);

  const admin = adminClient();
  const { data, error } = await admin
    .from('payment_refund_requests')
    .insert({
      payment_id: paymentId,
      requester_user_id: input.requesterUserId,
      status: 'REQUESTED',
      request_reason: requestReason,
      requested_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new RefundRequestError(error?.message || '환불 요청 생성에 실패했습니다.', 500);
  }

  return data as RefundRequestRecord;
}

export async function rejectRefundRequest(input: {
  requestId: string;
  reviewerUserId: string;
  adminNote: string;
}) {
  const adminNote = String(input.adminNote || '').trim();
  if (!adminNote) {
    throw new RefundRequestError('반려 사유를 입력해 주세요.', 400);
  }

  const admin = adminClient();
  const { data: request, error: fetchError } = await admin
    .from('payment_refund_requests')
    .select('*')
    .eq('id', input.requestId)
    .maybeSingle();

  if (fetchError || !request) {
    throw new RefundRequestError('환불 요청을 찾을 수 없습니다.', 404);
  }

  if (String(request.status || '').toUpperCase() !== 'REQUESTED') {
    throw new RefundRequestError('대기 중인 요청만 반려할 수 있습니다.', 400);
  }

  const { data, error } = await admin
    .from('payment_refund_requests')
    .update({
      status: 'REJECTED',
      admin_note: adminNote,
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.reviewerUserId,
    })
    .eq('id', input.requestId)
    .select('*')
    .single();

  if (error || !data) {
    throw new RefundRequestError(error?.message || '환불 요청 반려에 실패했습니다.', 500);
  }

  return data as RefundRequestRecord;
}

export async function approveRefundRequest(input: {
  requestId: string;
  reviewerUserId: string;
  refundType: RefundType;
  refundAmount?: number | null;
  adminNote?: string | null;
}) {
  const refundType = String(input.refundType || '').toUpperCase() as RefundType;
  if (refundType !== 'FULL' && refundType !== 'PARTIAL') {
    throw new RefundRequestError('refundType은 FULL 또는 PARTIAL 이어야 합니다.', 400);
  }

  const admin = adminClient();
  const { data: request, error: requestError } = await admin
    .from('payment_refund_requests')
    .select('*')
    .eq('id', input.requestId)
    .maybeSingle();

  if (requestError || !request) {
    throw new RefundRequestError('환불 요청을 찾을 수 없습니다.', 404);
  }

  if (String(request.status || '').toUpperCase() !== 'REQUESTED') {
    throw new RefundRequestError('대기 중인 요청만 승인할 수 있습니다.', 400);
  }

  const paymentRow = await getPaymentOrThrow(request.payment_id);
  const payment = await fetchPortOnePayment(request.payment_id);
  const paymentStatus = String(payment.status || '').toUpperCase();

  if (!PAYMENT_REFUNDABLE_STATUSES.has(paymentStatus)) {
    throw new RefundRequestError('현재 상태에서는 환불을 실행할 수 없습니다.', 400);
  }

  const currentCancellableAmount = getCancellableAmount(payment);
  if (currentCancellableAmount <= 0) {
    throw new RefundRequestError('취소 가능한 잔액이 없습니다.', 400);
  }

  const requestedAmount =
    refundType === 'FULL'
      ? currentCancellableAmount
      : Number(input.refundAmount);

  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    throw new RefundRequestError('부분 환불 금액이 올바르지 않습니다.', 400);
  }

  if (requestedAmount > currentCancellableAmount) {
    throw new RefundRequestError('부분 환불 금액이 취소 가능 잔액을 초과합니다.', 400);
  }

  const paymentClient = PaymentClient({ secret: getPortOneApiSecret() });
  const cancelResult = await paymentClient.cancelPayment({
    paymentId: request.payment_id,
    amount: requestedAmount,
    reason: request.request_reason,
    requester: 'ADMIN',
    currentCancellableAmount,
  });
  const cancellation = cancelResult.cancellation;
  const cancellationAmount =
    'totalAmount' in cancellation && typeof cancellation.totalAmount === 'number'
      ? cancellation.totalAmount
      : requestedAmount;
  const cancellationReceiptUrl =
    'receiptUrl' in cancellation && typeof cancellation.receiptUrl === 'string'
      ? cancellation.receiptUrl
      : null;
  const cancellationTimestamp =
    ('cancelledAt' in cancellation && cancellation.cancelledAt) ||
    ('requestedAt' in cancellation && cancellation.requestedAt) ||
    new Date().toISOString();

  const { payment: syncedPayment, status } = await syncPortOnePayment(admin, request.payment_id);

  const { error: paymentUpdateError } = await admin
    .from('payments')
    .update({
      status,
      cancel_reason: request.request_reason,
      cancelled_at: cancellationTimestamp,
      receipt_url:
        cancellationReceiptUrl ||
        syncedPayment.receiptUrl ||
        paymentRow.payment_data?.receiptUrl ||
        paymentRow.payment_data?.receipt_url ||
        null,
      updated_at: new Date().toISOString(),
    })
    .eq('payment_id', request.payment_id);

  if (paymentUpdateError) {
    throw new RefundRequestError('결제 상태 업데이트에 실패했습니다.', 500);
  }

  const { data: updatedRequest, error: updateError } = await admin
    .from('payment_refund_requests')
    .update({
      status: 'COMPLETED',
      refund_type: refundType,
      refund_amount: cancellationAmount,
      admin_note: input.adminNote?.trim() || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.reviewerUserId,
    })
    .eq('id', input.requestId)
    .select('*')
    .single();

  if (updateError || !updatedRequest) {
    throw new RefundRequestError(updateError?.message || '환불 요청 상태 업데이트에 실패했습니다.', 500);
  }

  return {
    request: updatedRequest as RefundRequestRecord,
    paymentStatus: status,
    cancellation: cancelResult.cancellation,
  };
}
