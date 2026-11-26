import 'server-only';
import {
  GetSuppressedDestinationCommand, ListSuppressedDestinationsCommand, SESv2Client,
} from '@aws-sdk/client-sesv2';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeSuppressedDestination } from '@/lib/emailFeedback';

/** 하루 1회 실행 + 크론 지연·누락 여유. 같은 반송은 event_key로 중복 저장되지 않는다. */
const LOOKBACK_DAYS = 3;
const MAX_ITEMS = 200;

export interface NewSelectionEmailHold {
  applicationId: number;
  campaignId: number;
  campaignTitle: string;
  influencerName: string;
  occurredAt: string;
}
export interface SuppressionSyncResult {
  checked: number;
  recorded: number;
  skippedKnown: number;
  newHolds: NewSelectionEmailHold[];
}

function createSESv2Client() {
  return new SESv2Client({
    region: process.env.AWS_SES_REGION || 'ap-northeast-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

/**
 * SES 계정 차단 목록의 최근 변경분을 email_feedback_events(SES_SUPPRESSION)로 옮긴다.
 * 이미 같은 메시지 ID의 반송 기록(수동 등록 포함)이 있으면 건너뛰어, 처리·해제한 보류를 다시 열지 않는다.
 * 선정 메일 반송이면 DB 트리거가 selection_email_holds 보류를 만든다.
 */
export async function syncSesSuppressionList(
  admin: SupabaseClient, ses: Pick<SESv2Client, 'send'> = createSESv2Client(), now = new Date(),
): Promise<SuppressionSyncResult> {
  const startDate = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const addresses: string[] = [];
  let nextToken: string | undefined;
  do {
    const page = await ses.send(new ListSuppressedDestinationsCommand({ StartDate: startDate, EndDate: now, PageSize: 100, NextToken: nextToken }));
    for (const item of page.SuppressedDestinationSummaries || []) if (item.EmailAddress) addresses.push(item.EmailAddress);
    nextToken = page.NextToken;
  } while (nextToken && addresses.length < MAX_ITEMS);

  const result: SuppressionSyncResult = { checked: addresses.length, recorded: 0, skippedKnown: 0, newHolds: [] };
  for (const address of addresses) {
    const { SuppressedDestination } = await ses.send(new GetSuppressedDestinationCommand({ EmailAddress: address }));
    const event = normalizeSuppressedDestination(SuppressedDestination);
    const { data: known, error: knownError } = await admin.from('email_feedback_events')
      .select('event_key').eq('message_id', event.message_id).limit(1);
    if (knownError) throw new Error('Feedback lookup failed');
    if (known && known.length > 0) { result.skippedKnown++; continue; }

    const { data: inserted, error } = await admin.rpc('record_email_feedback', { p_event: event });
    if (error) throw new Error('Feedback persistence failed');
    if (!inserted) { result.skippedKnown++; continue; }
    result.recorded++;

    const { data: holds, error: holdError } = await admin.from('selection_email_holds')
      .select('application_id,application:applications!inner(campaign_id,campaign:campaigns(title),user:profiles!applications_user_id_fkey(nickname,name))')
      .eq('event_key', event.event_key).is('resolved_at', null);
    if (holdError) throw new Error('Hold lookup failed');
    for (const hold of holds || []) {
      const app = hold.application as unknown as {
        campaign_id: number; campaign: { title: string } | null; user: { nickname: string | null; name: string | null } | null;
      };
      result.newHolds.push({
        applicationId: hold.application_id, campaignId: app.campaign_id,
        campaignTitle: app.campaign?.title || `캠페인 #${app.campaign_id}`,
        influencerName: app.user?.nickname || app.user?.name || '이름 없음',
        occurredAt: event.occurred_at,
      });
    }
  }
  return result;
}
