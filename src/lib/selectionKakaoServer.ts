import 'server-only';
import { SolapiMessageService } from 'solapi';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/alimtalk';
import { buildSelectionContent, type SelectionContent, type SelectionContentApplication } from '@/lib/selectionContent';
import { isSelectedApplication } from '@/lib/selectionEmailHold';

export class SelectionKakaoError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// 알림톡 본문은 1,000자 제한. 템플릿 고정 문구는 130자(변수 제외).
const MESSAGE_LIMIT = 1000;
const TEMPLATE_FIXED_LENGTH = 130;
const LIMITS = { name: 20, title: 60, items: 150, notes: 200, minGuide: 60 } as const;
const FALLBACK = '캠페인 상세 페이지 참조';
const REJECTED_ERROR_TAGS = new Set(['BadRequestError', 'MessageNotReceivedError', 'ClientError', 'VariableValidationError', 'ApiKeyError']);

export function clipVariable(value: unknown, max: number) {
  const text = String(value ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) return FALLBACK;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function isHttpUrl(value?: string) {
  if (!value) return false;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

/** 선정 메일(buildSelectionDetailsHtml)의 확정옵션·구매링크 규칙을 그대로 텍스트로 옮긴다. 링크는 자르지 않는다. */
export function buildPurchaseLines(content: SelectionContent) {
  const lines: string[] = [];
  const purchases = content.assignedPurchases.filter((item) => item.optionLabel && isHttpUrl(item.url)).slice(0, 2);
  if (isHttpUrl(content.commonPurchaseLink)) {
    if (content.assignedOptionLabel) lines.push(`확정 옵션: ${content.assignedOptionLabel}`);
    lines.push(`구매 링크: ${content.commonPurchaseLink}`);
  } else if (purchases.length > 0) {
    purchases.forEach((item, index) => {
      lines.push(`확정 옵션${purchases.length > 1 ? ` ${index + 1}` : ''}: ${item.optionLabel}`);
      lines.push(`구매 링크${purchases.length > 1 ? ` ${index + 1}` : ''}: ${item.url}`);
    });
  } else {
    if (content.assignedOptionLabel) lines.push(`확정 옵션: ${content.assignedOptionLabel}`);
    if (isHttpUrl(content.assignedPurchaseLink)) lines.push(`개별 구매 링크: ${content.assignedPurchaseLink}`);
  }
  return lines;
}

/**
 * 승인 템플릿 변수(인플루언서명·캠페인명·제공내역·진행가이드·주의사항·캠페인ID)에
 * 선정 메일과 같은 정보(제공내역·확정옵션·구매링크·핵심 가이드·주의사항·체험 마감기한)를 담는다.
 */
export function buildSelectionKakaoVariables(input: {
  recipientName: string; campaignId: number; campaignTitle: string; content: SelectionContent;
}) {
  const { content } = input;
  const name = clipVariable(input.recipientName, LIMITS.name);
  const title = clipVariable(input.campaignTitle, LIMITS.title);
  const id = String(input.campaignId);
  const items = [clipVariable(content.providedItems, LIMITS.items), ...buildPurchaseLines(content)].join('\n');
  const notesSource = content.purchaseNotes.trim();
  const guideSource = content.guideSummary.trim() || '캠페인 상세 페이지에서 작성 가이드를 확인해 주세요.';
  const deadline = `\n\n체험 마감기한: ${content.deadlineDate}`;
  const fixed = TEMPLATE_FIXED_LENGTH + name.length + title.length + id.length + items.length + deadline.length;
  let notes = notesSource ? clipVariable(notesSource, LIMITS.notes) : '별도 주의사항 없음';
  let guideBudget = MESSAGE_LIMIT - fixed - notes.length;
  if (guideBudget < LIMITS.minGuide && notesSource) {
    notes = clipVariable(notesSource, Math.max(20, notes.length - (LIMITS.minGuide - guideBudget)));
    guideBudget = MESSAGE_LIMIT - fixed - notes.length;
  }
  if (guideBudget < 20) throw new SelectionKakaoError(422, '구매링크가 너무 길어 알림톡 글자 수(1,000자)를 넘습니다.');
  return {
    '인플루언서명': name,
    '캠페인명': title,
    '제공내역': items,
    '진행가이드': `${clipVariable(guideSource, guideBudget)}${deadline}`,
    '주의사항': notes,
    '캠페인ID': id,
  };
}

/**
 * 메일 반송 보류 건에 선정 안내 알림톡을 1회 발송한다(관리자 수동).
 * 기록을 먼저 남기고(PREPARED) 발송하므로 동시 클릭은 유니크 인덱스로 차단된다.
 */
export async function sendSelectionKakaoForHold(params: {
  applicationId: number; campaignId: number; holdId: string; actorId: string;
}) {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_SENDER_PHONE;
  const pfId = process.env.SOLAPI_KAKAO_CHANNEL_ID;
  const templateId = process.env.SOLAPI_TEMPLATE_INFLUENCER_SELECTED;
  if (!apiKey || !apiSecret || !from || !pfId || !templateId) throw new SelectionKakaoError(503, '알림톡 설정이 완료되지 않았습니다.');

  const admin = createAdminClient();
  const { data: hold, error: holdError } = await admin.from('selection_email_holds')
    .select('id,resolved_at,application:applications!inner(id,status,campaign_id,user_id,assigned_option_label,assigned_purchase_link_url,assigned_purchase_links)')
    .eq('id', params.holdId).eq('application_id', params.applicationId).maybeSingle();
  if (holdError) throw new Error('Hold lookup failed');
  const application = hold?.application as unknown as ({ status: string; campaign_id: number; user_id: string } & SelectionContentApplication) | undefined;
  if (!hold || !application || application.campaign_id !== params.campaignId) throw new SelectionKakaoError(404, '보류 내역을 찾을 수 없습니다.');
  if (hold.resolved_at || !isSelectedApplication(application.status)) throw new SelectionKakaoError(409, '이미 해제됐거나 선정 상태가 아닌 신청입니다. 새로고침 후 확인해 주세요.');

  const [{ data: profile, error: profileError }, { data: campaign, error: campaignError }] = await Promise.all([
    admin.from('profiles').select('phone_number,name,nickname').eq('id', application.user_id).maybeSingle(),
    admin.from('campaigns').select('id,title,end_date,experience_details,product_name,campaign_options').eq('id', params.campaignId).maybeSingle(),
  ]);
  if (profileError || campaignError || !campaign) throw new Error('Recipient lookup failed');
  const phone = formatPhoneNumber(profile?.phone_number || '');
  if (!isValidPhoneNumber(phone)) throw new SelectionKakaoError(422, '수신자 휴대폰 번호가 없거나 올바르지 않습니다.');
  const built = buildSelectionContent(campaign, application);
  if (!built.ok) throw new SelectionKakaoError(422, built.error);
  // 기록을 남기기 전에 변수를 만들어 글자 수 초과 등은 발송 시도 없이 거부한다.
  const variables = buildSelectionKakaoVariables({
    recipientName: profile?.nickname || profile?.name || '인플루언서',
    campaignId: campaign.id, campaignTitle: campaign.title, content: built.content,
  });

  const { data: delivery, error: beginError } = await admin.from('selection_kakao_deliveries')
    .insert({ application_id: params.applicationId, hold_id: params.holdId, recipient_phone: phone, sent_by: params.actorId })
    .select('id').single();
  if (beginError?.code === '23505') throw new SelectionKakaoError(409, '이미 발송했거나 발송 중인 건입니다.');
  if (beginError || !delivery) throw new Error('Delivery tracking failed');

  const finish = (status: 'SENT' | 'FAILED' | 'UNKNOWN', messageId: string | null, errorMessage: string | null) =>
    admin.from('selection_kakao_deliveries')
      .update({ status, message_id: messageId, error_message: errorMessage?.slice(0, 500) ?? null, completed_at: new Date().toISOString() })
      .eq('id', delivery.id).eq('status', 'PREPARED');

  let messageId: string;
  try {
    const response = await new SolapiMessageService(apiKey, apiSecret).sendOne({
      to: phone, from,
      kakaoOptions: {
        pfId, templateId, disableSms: true,
        variables,
      },
    });
    messageId = response.messageId;
  } catch (error) {
    const message = String(error);
    // 솔라피 SDK 오류는 _tag로 구분. 접수 거부가 확실한 경우만 FAILED(재시도 허용),
    // 네트워크·서버 오류처럼 발송 여부가 불확실하면 UNKNOWN(재발송 차단).
    const tag = String((error as { _tag?: string } | null)?._tag || (error as Error | null)?.name || '');
    const rejected = REJECTED_ERROR_TAGS.has(tag);
    await finish(rejected ? 'FAILED' : 'UNKNOWN', null, message);
    console.error('Selection kakao send failed', { deliveryId: delivery.id, rejected, message });
    throw new SelectionKakaoError(502, rejected
      ? '알림톡 발송이 거부됐습니다. 번호·템플릿 확인 후 다시 시도해 주세요.'
      : '알림톡 발송 결과를 확인하지 못했습니다. 솔라피 발송 내역을 확인해 주세요.');
  }
  const { error: finishError } = await finish('SENT', messageId, null);
  if (finishError) console.error('Selection kakao outcome not persisted', { deliveryId: delivery.id, messageId });
  return { status: 'SENT' as const, sentAt: new Date().toISOString() };
}
