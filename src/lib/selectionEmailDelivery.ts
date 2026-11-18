import { createAdminClient } from '@/lib/supabase/admin';

interface SelectionSendResult { success: boolean; messageId?: string; mock?: boolean; skipped?: boolean; message?: string }

/** Persist the application/recipient before sending. Never retry an email after acceptance. */
export async function trackSelectionEmail(applicationId: number, recipient: string, send: () => Promise<SelectionSendResult>) {
  const force = ['TRUE','1','YES','ON'].includes(String(process.env.EMAIL_FORCE_SEND || '').toUpperCase());
  if (!process.env.AWS_ACCESS_KEY_ID || (process.env.NODE_ENV === 'development' && !force)) return send();
  const admin = createAdminClient();
  const { data: deliveryId, error: beginError } = await admin.rpc('begin_selection_email_delivery', {
    p_application_id: applicationId, p_recipient: recipient,
  });
  if (beginError || !Number.isSafeInteger(deliveryId)) throw new Error('선정 메일 추적을 준비하지 못해 발송하지 않았습니다.');
  let result: SelectionSendResult;
  try { result = await send(); } catch (error) {
    const { error: trackingError } = await admin.rpc('finish_selection_email_delivery', { p_delivery_id: deliveryId, p_status: 'UNKNOWN', p_message_id: null });
    if (trackingError) console.error('Selection email tracking incomplete', { deliveryId });
    throw error;
  }
  const accepted = result.success && !result.mock && Boolean(result.messageId);
  const { error } = await admin.rpc('finish_selection_email_delivery', {
    p_delivery_id: deliveryId, p_status: accepted ? 'ACCEPTED' : result.mock || result.skipped || !result.success ? 'SKIPPED' : 'UNKNOWN',
    p_message_id: accepted ? result.messageId : null,
  });
  if (error) {
    console.error('Selection email outcome not persisted', { deliveryId, messageId: result.messageId });
    return { ...result, success: false, message: '메일 발송 결과의 추적 저장이 실패했습니다. 재발송 전에 발송 내역을 확인해 주세요.' };
  }
  return result;
}
