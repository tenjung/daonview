import 'server-only';
import { createHash } from 'node:crypto';
import { SolapiMessageService } from 'solapi';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/alimtalk';
import { buildSelectionContent, type SelectionContent, type SelectionContentApplication, type SelectionContentCampaign } from '@/lib/selectionContent';
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


function getSolapiConfig() {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_SENDER_PHONE;
  const pfId = process.env.SOLAPI_KAKAO_CHANNEL_ID;
  const templateId = process.env.SOLAPI_TEMPLATE_INFLUENCER_SELECTED;
  if (!apiKey || !apiSecret || !from || !pfId || !templateId) throw new SelectionKakaoError(503, '알림톡 설정이 완료되지 않았습니다.');
  return { apiKey, apiSecret, from, pfId, templateId };
}

export interface SelectionKakaoTemplate { content: string; buttonName: string | null; buttonLink: string | null }
let templateCache: { id: string; at: number; value: SelectionKakaoTemplate } | null = null;
const TEMPLATE_CACHE_MS = 10 * 60 * 1000;

/** 솔라피에 승인된 템플릿 원문(고정 문구·버튼). 미리보기를 실제 수신 화면과 같게 만든다. 실패하면 null. */
export async function getSelectionKakaoTemplate(): Promise<SelectionKakaoTemplate | null> {
  const { apiKey, apiSecret, templateId } = getSolapiConfig();
  if (templateCache && templateCache.id === templateId && Date.now() - templateCache.at < TEMPLATE_CACHE_MS) return templateCache.value;
  try {
    const template = await new SolapiMessageService(apiKey, apiSecret).getKakaoAlimtalkTemplate(templateId);
    const button = (template.buttons || [])[0] as { buttonName?: string; linkMo?: string } | undefined;
    const value = { content: String(template.content || ''), buttonName: button?.buttonName || null, buttonLink: button?.linkMo || null };
    if (!value.content) return null;
    templateCache = { id: templateId, at: Date.now(), value };
    return value;
  } catch {
    console.error('Selection kakao template lookup failed');
    return null;
  }
}

export function fillTemplate(text: string, variables: Record<string, string>) {
  return text.replace(/#\{([^}]+)\}/g, (match, key: string) => (key in variables ? variables[key] : match));
}

/** 템플릿 원문이 있으면 실제 수신 문구, 없으면 변수만 이어 붙인 기록용 문구. */
export function renderSelectionKakaoText(template: SelectionKakaoTemplate | null, variables: Record<string, string>) {
  if (template) return fillTemplate(template.content, variables);
  return ['제공내역', '진행가이드', '주의사항'].map((key) => `■ ${key}\n${variables[key]}`).join('\n\n');
}

/** 관리자가 본 미리보기와 실제 발송 내용이 같은지 확인하는 지문. 번호·템플릿·변수가 하나라도 바뀌면 달라진다. */
export function selectionKakaoHash(input: { templateId: string; phone: string; variables: Record<string, string> }) {
  const variables = Object.keys(input.variables).sort().map((key) => [key, input.variables[key]]);
  return createHash('sha256').update(JSON.stringify([input.templateId, input.phone, variables])).digest('hex');
}

type ContextApplication = { id: number; status: string; campaign_id: number; user_id: string } & SelectionContentApplication;
export type SelectionMessageCampaign = SelectionContentCampaign & { title: string; created_by?: string | null };
export interface SelectionMessageContext {
  application: ContextApplication;
  campaign: SelectionMessageCampaign;
  profile: { phone_number: string | null; name: string | null; nickname: string | null; email: string | null };
  recipientName: string;
  phone: string;
  content: SelectionContent;
}

/** 선정 메일·알림톡 미리보기와 발송이 같은 값을 쓰도록 신청·캠페인·수신자를 한 번에 읽는다. */
export async function loadSelectionMessageContext(applicationId: number, campaignId: number): Promise<SelectionMessageContext> {
  const admin = createAdminClient();
  const { data: application, error } = await admin.from('applications')
    .select('id,status,campaign_id,user_id,assigned_option_label,assigned_purchase_link_url,assigned_purchase_links')
    .eq('id', applicationId).maybeSingle();
  if (error) throw new Error('Application lookup failed');
  if (!application || application.campaign_id !== campaignId) throw new SelectionKakaoError(404, '신청서를 찾을 수 없습니다.');
  if (!isSelectedApplication(application.status)) throw new SelectionKakaoError(409, '선정 상태가 아닌 신청입니다. 새로고침 후 확인해 주세요.');
  const [{ data: profile, error: profileError }, { data: campaign, error: campaignError }] = await Promise.all([
    admin.from('profiles').select('phone_number,name,nickname,email').eq('id', application.user_id).maybeSingle(),
    admin.from('campaigns').select('id,title,created_by,end_date,experience_details,product_name,campaign_options').eq('id', campaignId).maybeSingle(),
  ]);
  if (profileError || campaignError || !campaign) throw new Error('Recipient lookup failed');
  const built = buildSelectionContent(campaign, application);
  if (!built.ok) throw new SelectionKakaoError(422, built.error);
  const phone = formatPhoneNumber(profile?.phone_number || '');
  return {
    application, campaign, content: built.content,
    profile: { phone_number: profile?.phone_number ?? null, name: profile?.name ?? null, nickname: profile?.nickname ?? null, email: profile?.email ?? null },
    recipientName: profile?.nickname || profile?.name || '인플루언서',
    phone: isValidPhoneNumber(phone) ? phone : '',
  };
}

export function buildContextKakaoVariables(context: SelectionMessageContext) {
  return buildSelectionKakaoVariables({
    recipientName: context.recipientName, campaignId: context.campaign.id, campaignTitle: context.campaign.title, content: context.content,
  });
}

/**
 * 선정 안내 알림톡 발송(관리자 수동). 미리보기 지문(expectedHash)과 같을 때만 보낸다.
 * - RECIPIENT: 기록(PREPARED)을 먼저 남기고 발송. 신청 1건당 활성 발송 1건(유니크 인덱스), 접수 거부만 재시도.
 *   메일 반송 보류가 열려 있으면 그 보류에 연결한다.
 * - SELF: 같은 내용을 관리자 본인 번호로 테스트 발송. 발송 기록을 남기지 않는다.
 */
export async function sendSelectionKakao(params: {
  applicationId: number; campaignId: number; actorId: string; expectedHash: string; target: 'RECIPIENT' | 'SELF';
}) {
  const { apiKey, apiSecret, from, pfId, templateId } = getSolapiConfig();
  const admin = createAdminClient();
  const context = await loadSelectionMessageContext(params.applicationId, params.campaignId);
  if (!context.phone) throw new SelectionKakaoError(422, '수신자 휴대폰 번호가 없거나 올바르지 않습니다.');
  // 기록을 남기기 전에 변수를 만들어 글자 수 초과 등은 발송 시도 없이 거부한다.
  const variables = buildContextKakaoVariables(context);
  if (selectionKakaoHash({ templateId, phone: context.phone, variables }) !== params.expectedHash) {
    throw new SelectionKakaoError(409, '미리보기 이후 내용이 바뀌었습니다. 다시 미리보기를 확인해 주세요.');
  }
  const service = new SolapiMessageService(apiKey, apiSecret);
  const kakaoOptions = { pfId, templateId, disableSms: true, variables };

  if (params.target === 'SELF') {
    const { data: actor, error: actorError } = await admin.from('profiles').select('phone_number').eq('id', params.actorId).maybeSingle();
    if (actorError) throw new Error('Actor lookup failed');
    const selfPhone = formatPhoneNumber(actor?.phone_number || '');
    if (!isValidPhoneNumber(selfPhone)) throw new SelectionKakaoError(422, '내 프로필에 휴대폰 번호가 없어 테스트 발송을 할 수 없습니다.');
    try {
      await service.sendOne({ to: selfPhone, from, kakaoOptions });
    } catch (error) {
      console.error('Selection kakao self test failed', { message: String(error) });
      throw new SelectionKakaoError(502, '테스트 발송에 실패했습니다. 번호·템플릿을 확인해 주세요.');
    }
    return { status: 'TEST_SENT' as const, sentAt: new Date().toISOString() };
  }

  const template = await getSelectionKakaoTemplate();
  const { data: hold, error: holdError } = await admin.from('selection_email_holds')
    .select('id').eq('application_id', params.applicationId).is('resolved_at', null).maybeSingle();
  if (holdError) throw new Error('Hold lookup failed');
  const { data: delivery, error: beginError } = await admin.from('selection_kakao_deliveries')
    .insert({
      application_id: params.applicationId, hold_id: hold?.id ?? null, recipient_phone: context.phone, sent_by: params.actorId,
      message_text: renderSelectionKakaoText(template, variables).slice(0, 1100), content_hash: params.expectedHash,
    })
    .select('id').single();
  if (beginError?.code === '23505') throw new SelectionKakaoError(409, '이미 발송했거나 발송 중인 건입니다.');
  if (beginError || !delivery) throw new Error('Delivery tracking failed');

  const finish = (status: 'SENT' | 'FAILED' | 'UNKNOWN', messageId: string | null, errorMessage: string | null) =>
    admin.from('selection_kakao_deliveries')
      .update({ status, message_id: messageId, error_message: errorMessage?.slice(0, 500) ?? null, completed_at: new Date().toISOString() })
      .eq('id', delivery.id).eq('status', 'PREPARED');

  let messageId: string;
  try {
    const response = await service.sendOne({ to: context.phone, from, kakaoOptions });
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
