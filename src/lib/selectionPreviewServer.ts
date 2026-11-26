import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEmailTemplate } from '@/lib/email';
import { toSelectionEmailParams, toSelectionNotificationParams } from '@/lib/applicationSelectionNotification';
import { getSesSuppressionStatus } from '@/lib/sesSuppressionSync';
import { checkPurchaseLink } from '@/lib/purchaseLinkCheck';
import {
  buildContextKakaoVariables, fillTemplate, getSelectionKakaoTemplate, loadSelectionMessageContext,
  renderSelectionKakaoText, selectionKakaoHash, SelectionKakaoError, type SelectionMessageContext,
} from '@/lib/selectionKakaoServer';
import type {
  SelectionPreview, SelectionPreviewCheck, SelectionPreviewKakaoHistory, SelectionPreviewLink,
} from '@/lib/selectionPreview';

function maskPhone(phone: string) {
  return phone ? `${phone.slice(0, 3)}-****-${phone.slice(-4)}` : '';
}
function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return '';
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

/** 선정 메일 HTML. 실제 발송(sendEmail → getEmailTemplate)과 같은 함수·같은 값으로 만든다. */
export function buildSelectionEmail(context: SelectionMessageContext) {
  const email = context.profile.email || '';
  const params = toSelectionNotificationParams(context.campaign, context.application.user_id, context.application.id, context.content);
  const { subject, html } = getEmailTemplate('CAMPAIGN_SELECTED', { ...toSelectionEmailParams(params, context.recipientName), email });
  return { subject, html, hash: createHash('sha256').update(`${email}\n${subject}\n${html}`).digest('hex') };
}

/** 메일 재발송을 막아야 하는 이유. null이면 발송 가능. */
export async function getSelectionEmailBlockReason(email: string | null) {
  if (!email) return '이메일 주소가 없습니다.';
  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('email_subscription_status').eq('email', email).maybeSingle();
  const status = String(profile?.email_subscription_status || '').toUpperCase();
  if (status === 'UNSUBSCRIBED') return '수신자가 메일 수신을 거부했습니다.';
  if (status === 'BOUNCED' || status === 'COMPLAINED') return '반송·스팸 신고로 메일 수신이 차단된 주소입니다.';
  if (await getSesSuppressionStatus(email) === 'SUPPRESSED') return 'AWS 발송 차단 목록에 있는 주소라 메일이 전달되지 않습니다.';
  return null;
}

function collectLinks(context: SelectionMessageContext) {
  const { content } = context;
  const links: Array<{ label: string; url: string }> = [];
  if (content.commonPurchaseLink) links.push({ label: content.assignedOptionLabel ? `구매 링크 (${content.assignedOptionLabel})` : '구매 링크', url: content.commonPurchaseLink });
  else if (content.assignedPurchases.length > 0) content.assignedPurchases.forEach((item) => links.push({ label: `구매 링크 (${item.optionLabel})`, url: item.url }));
  else if (content.assignedPurchaseLink) links.push({ label: content.assignedOptionLabel ? `개별 구매 링크 (${content.assignedOptionLabel})` : '개별 구매 링크', url: content.assignedPurchaseLink });
  return links;
}

async function loadKakaoHistory(applicationId: number): Promise<SelectionPreviewKakaoHistory[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from('selection_kakao_deliveries')
    .select('id,status,created_at,completed_at,message_text,recipient_phone,sender:profiles!selection_kakao_deliveries_sent_by_fkey(nickname,name)')
    .eq('application_id', applicationId).order('id', { ascending: false }).limit(10);
  if (error) throw new Error('Kakao history lookup failed');
  return (data || []).map((row) => {
    const sender = row.sender as unknown as { nickname: string | null; name: string | null } | null;
    return {
      id: row.id, status: String(row.status).toUpperCase() as SelectionPreviewKakaoHistory['status'],
      at: row.completed_at || row.created_at, messageText: row.message_text,
      phoneMasked: maskPhone(String(row.recipient_phone || '')), senderName: sender?.nickname || sender?.name || '관리자',
    };
  });
}

/**
 * 신청자 표 [미리보기] 모달 데이터. 메일·알림톡을 실제 발송과 같은 함수로 만들고,
 * 발송 전 점검(번호·링크·글자 수·메일 차단)과 지문(hash)을 함께 돌려준다.
 */
export async function buildSelectionPreview(params: {
  applicationId: number; campaignId: number; actorId: string; isAdmin: boolean;
}): Promise<SelectionPreview> {
  const context = await loadSelectionMessageContext(params.applicationId, params.campaignId);
  const checks: SelectionPreviewCheck[] = [];
  const email = buildSelectionEmail(context);
  const emailBlockReason = await getSelectionEmailBlockReason(context.profile.email);

  const rawLinks = collectLinks(context);
  const linkStatuses = await Promise.all(rawLinks.map((link) => checkPurchaseLink(link.url)));
  const links: SelectionPreviewLink[] = rawLinks.map((link, index) => ({ ...link, status: linkStatuses[index] }));
  if (links.length === 0) checks.push({ key: 'link', status: 'WARN', label: '구매 링크', detail: '안내할 구매 링크가 없습니다. 캠페인 상세 페이지 안내만 나갑니다.' });
  else if (links.some((link) => link.status === 'INVALID' || link.status === 'NOT_FOUND')) checks.push({ key: 'link', status: 'ERROR', label: '구매 링크', detail: '열리지 않는 링크가 있습니다. 링크를 확인해 주세요.' });
  else if (links.some((link) => link.status === 'UNKNOWN')) checks.push({ key: 'link', status: 'WARN', label: '구매 링크', detail: '쇼핑몰이 자동 확인을 막아 접속 여부를 확인하지 못했습니다. [열어보기]로 확인해 주세요.' });
  else checks.push({ key: 'link', status: 'OK', label: '구매 링크', detail: `${links.length}개 접속 확인` });
  if (context.content.assignedOptionLabel || context.content.assignedPurchases.length) {
    const options = context.content.assignedPurchases.length ? context.content.assignedPurchases.map((item) => item.optionLabel).join(', ') : context.content.assignedOptionLabel;
    checks.push({ key: 'option', status: 'OK', label: '확정 옵션', detail: String(options) });
  }

  let kakao: SelectionPreview['kakao'] = null;
  if (params.isAdmin) {
    const templateId = process.env.SOLAPI_TEMPLATE_INFLUENCER_SELECTED || '';
    let variables: Record<string, string> | null = null;
    let kakaoError: string | null = null;
    try { variables = buildContextKakaoVariables(context); } catch (error) {
      kakaoError = error instanceof SelectionKakaoError ? error.message : '알림톡 내용을 만들지 못했습니다.';
    }
    const template = variables && templateId ? await getSelectionKakaoTemplate().catch(() => null) : null;
    const history = await loadKakaoHistory(params.applicationId);
    const active = history.find((item) => item.status !== 'FAILED');
    const text = variables ? renderSelectionKakaoText(template, variables) : '';
    const admin = createAdminClient();
    const { data: actor } = await admin.from('profiles').select('phone_number').eq('id', params.actorId).maybeSingle();
    const selfPhone = String(actor?.phone_number || '').replace(/[^0-9]/g, '');
    kakao = {
      text, templateExact: Boolean(template),
      buttonName: template?.buttonName || null,
      buttonUrl: template?.buttonLink && variables ? fillTemplate(template.buttonLink, variables) : null,
      length: text.length, phoneMasked: maskPhone(context.phone),
      selfPhoneMasked: /^01[0-9]{8,9}$/.test(selfPhone) ? maskPhone(selfPhone) : null,
      hash: variables && context.phone && templateId ? selectionKakaoHash({ templateId, phone: context.phone, variables }) : null,
      error: kakaoError || (!context.phone ? '수신자 휴대폰 번호가 없거나 올바르지 않습니다.' : null),
      alreadySent: active ? { status: active.status, at: active.at } : null,
      history,
    };
    checks.push(context.phone
      ? { key: 'phone', status: 'OK', label: '휴대폰 번호', detail: maskPhone(context.phone) }
      : { key: 'phone', status: 'ERROR', label: '휴대폰 번호', detail: '번호가 없거나 올바르지 않아 카톡을 보낼 수 없습니다.' });
    if (variables) checks.push({ key: 'length', status: 'OK', label: '카톡 글자 수', detail: `${text.length} / 1,000자` });
    if (variables && !template) checks.push({ key: 'template', status: 'WARN', label: '카톡 템플릿', detail: '승인 템플릿 원문을 불러오지 못해 변수 내용만 보여줍니다.' });
    if (variables && (variables['진행가이드'].includes('…') || variables['주의사항'].includes('…'))) checks.push({ key: 'clip', status: 'WARN', label: '글자 수 맞춤', detail: '1,000자 제한으로 가이드·주의사항 일부가 줄었습니다(…).' });
  }

  return {
    recipientName: context.recipientName,
    campaignTitle: context.campaign.title,
    email: {
      subject: email.subject, html: email.html, hash: email.hash,
      recipientMasked: context.profile.email ? maskEmail(context.profile.email) : '',
      blockedReason: emailBlockReason,
    },
    kakao, links, checks,
  };
}
