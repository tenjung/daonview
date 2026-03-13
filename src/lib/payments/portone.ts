import type { SupabaseClient } from '@supabase/supabase-js';

interface PortOnePaymentAmount {
  total?: number;
}

interface PortOnePaymentMethod {
  type?: string;
}

interface PortOnePaymentCustomData {
  userId?: string;
  campaignId?: number | string;
  item?: string;
  planMonths?: number | string;
}

export interface PortOnePaymentRecord {
  merchantUid?: string | null;
  amount?: PortOnePaymentAmount;
  method?: PortOnePaymentMethod;
  status?: string;
  customData?: PortOnePaymentCustomData | string | null;
  receiptUrl?: string | null;
  [key: string]: unknown;
}

const getPortOneApiSecret = () => {
  const apiSecret = process.env.PORTONE_API_SECRET;

  if (!apiSecret) {
    throw new Error('PORTONE_API_SECRET is not configured');
  }

  return apiSecret;
};

const parseCustomData = (
  customData: PortOnePaymentRecord['customData']
): PortOnePaymentCustomData => {
  if (!customData) {
    return {};
  }

  if (typeof customData === 'string') {
    try {
      const parsed = JSON.parse(customData) as unknown;
      if (parsed && typeof parsed === 'object') {
        return parsed as PortOnePaymentCustomData;
      }
    } catch {
      return {};
    }

    return {};
  }

  return customData;
};

const normalizeCampaignId = (campaignId?: number | string) => {
  if (campaignId == null || campaignId === '') {
    return null;
  }

  const parsed = Number(campaignId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizePlanMonths = (planMonths?: number | string) => {
  if (planMonths == null || planMonths === '') {
    return null;
  }

  const parsed = Number(planMonths);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export async function fetchPortOnePayment(paymentId: string): Promise<PortOnePaymentRecord> {
  const apiSecret = getPortOneApiSecret();
  const response = await fetch(`https://api.portone.io/v2/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      Authorization: `PortOne ${apiSecret}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('PortOne API error:', errorData);
    throw new Error('결제 검증 API 호출 실패');
  }

  return response.json();
}

export async function syncPortOnePayment(
  supabase: SupabaseClient,
  paymentId: string
) {
  const payment = await fetchPortOnePayment(paymentId);
  const customData = parseCustomData(payment.customData);
  const userId = customData.userId ?? null;
  const campaignId = normalizeCampaignId(customData.campaignId);
  const status = String(payment.status || 'PAID').toUpperCase();
  const nowIso = new Date().toISOString();

  const paymentRecord = {
    user_id: userId,
    campaign_id: campaignId,
    payment_id: paymentId,
    merchant_uid: payment.merchantUid || null,
    amount: payment.amount?.total || 0,
    method: String(payment.method?.type || 'CARD').toUpperCase(),
    status,
    payment_data: payment,
    receipt_url: payment.receiptUrl || null,
    updated_at: nowIso,
  };

  const { error: upsertError } = await supabase
    .from('payments')
    .upsert(paymentRecord, { onConflict: 'payment_id' });

  if (upsertError) {
    console.error('Error saving payment record:', upsertError);
  }

  if (status === 'PAID' && customData.item === 'unlimited-plan' && userId) {
    const planMonths = normalizePlanMonths(customData.planMonths);

    if (planMonths) {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(now.getMonth() + planMonths);

      const subscriptionRecord = {
        user_id: userId,
        plan: 'UNLIMITED',
        status: 'ACTIVE',
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_id: paymentId,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionRecord, { onConflict: 'user_id' });

      if (subscriptionError) {
        console.error('Error saving subscription record:', subscriptionError);
      }
    }
  }

  return {
    payment,
    status,
  };
}
