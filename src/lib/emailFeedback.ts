import { createHash } from 'node:crypto';
import { z } from 'zod';

const recipient = z.object({ emailAddress: z.email(), status: z.string().max(100).optional(), diagnosticCode: z.string().max(4000).optional() });
const sesFeedback = z.object({
  notificationType: z.enum(['Bounce', 'Complaint']),
  mail: z.object({ messageId: z.string().min(1).max(500), source: z.string().max(500), commonHeaders: z.object({ subject: z.string().max(1000).optional() }).optional() }),
  bounce: z.object({ feedbackId: z.string().min(1), timestamp: z.iso.datetime({ offset: true }), bounceType: z.enum(['Permanent', 'Transient', 'Undetermined']), bounceSubType: z.string().max(100), bouncedRecipients: z.array(recipient).min(1).max(50) }).optional(),
  complaint: z.object({ feedbackId: z.string().min(1), timestamp: z.iso.datetime({ offset: true }), complaintFeedbackType: z.string().max(100).optional(), complainedRecipients: z.array(recipient).min(1).max(50) }).optional(),
});

export const feedbackRecordSchema = z.object({
  event_key: z.string().regex(/^[a-f0-9]{64}$/), source: z.enum(['SES_SNS', 'MAILBOX_IMPORT', 'SES_SUPPRESSION']),
  message_id: z.string().min(1).max(500).nullable(), recipient: z.email().max(320),
  event_type: z.enum(['BOUNCE', 'COMPLAINT']), bounce_type: z.enum(['PERMANENT', 'TRANSIENT', 'UNDETERMINED']).nullable(),
  reason: z.enum(['MAILBOX_INACTIVE', 'USER_NOT_FOUND', 'MAILBOX_FULL', 'SUPPRESSED', 'COMPLAINT', 'OTHER']),
  smtp_status: z.string().max(100).nullable(), diagnostic: z.string().max(4000).nullable(),
  subject: z.string().max(1000).nullable(), occurred_at: z.iso.datetime({ offset: true }),
});
export type EmailFeedbackRecord = z.infer<typeof feedbackRecordSchema>;

export function classifyEmailFailure(diagnostic: string, subtype = ''): EmailFeedbackRecord['reason'] {
  if (/mailbox is inactive/i.test(diagnostic)) return 'MAILBOX_INACTIVE';
  if (/no such user|user unknown|recipient.*not found/i.test(diagnostic)) return 'USER_NOT_FOUND';
  if (/out of storage|mailbox.*full|quota exceeded|4\.2\.2/i.test(diagnostic)) return 'MAILBOX_FULL';
  if (/suppression list/i.test(diagnostic) || subtype.toUpperCase() === 'SUPPRESSED') return 'SUPPRESSED';
  return 'OTHER';
}

export function feedbackKey(source: string, id: string, email: string) {
  return createHash('sha256').update(JSON.stringify([source, id, email.toLowerCase()])).digest('hex');
}

export function normalizeSESFeedback(input: unknown, expectedSender: string): EmailFeedbackRecord[] {
  const event = sesFeedback.parse(input);
  const sender = event.mail.source.match(/<([^<>]+)>/)?.[1] || event.mail.source;
  if (sender.toLowerCase() !== expectedSender.toLowerCase()) throw new Error('Unexpected SES sender');
  const complaint = event.notificationType === 'Complaint';
  const detail = complaint ? event.complaint : event.bounce;
  if (!detail) throw new Error('Missing feedback details');
  const recipients = complaint ? event.complaint!.complainedRecipients : event.bounce!.bouncedRecipients;
  return recipients.map((item) => feedbackRecordSchema.parse({
    event_key: feedbackKey('SES_SNS', detail.feedbackId, item.emailAddress), source: 'SES_SNS',
    message_id: event.mail.messageId, recipient: item.emailAddress.toLowerCase(),
    event_type: complaint ? 'COMPLAINT' : 'BOUNCE',
    bounce_type: complaint ? null : event.bounce!.bounceType.toUpperCase(),
    reason: complaint ? 'COMPLAINT' : classifyEmailFailure(item.diagnosticCode || '', event.bounce!.bounceSubType),
    smtp_status: item.status || null, diagnostic: item.diagnosticCode || null,
    subject: event.mail.commonHeaders?.subject || null, occurred_at: detail.timestamp,
  }));
}

const suppressedDestination = z.object({
  EmailAddress: z.email().max(320),
  Reason: z.enum(['BOUNCE', 'COMPLAINT']),
  LastUpdateTime: z.date(),
  Attributes: z.object({ MessageId: z.string().min(1).max(500), FeedbackId: z.string().min(1).max(500) }),
});

/** SES 계정 차단 목록 항목(GetSuppressedDestination). 차단 목록에는 영구 반송·스팸 신고만 오른다. */
export function normalizeSuppressedDestination(input: unknown): EmailFeedbackRecord {
  const item = suppressedDestination.parse(input);
  const complaint = item.Reason === 'COMPLAINT';
  return feedbackRecordSchema.parse({
    event_key: feedbackKey('SES_SUPPRESSION', item.Attributes.FeedbackId, item.EmailAddress), source: 'SES_SUPPRESSION',
    message_id: item.Attributes.MessageId, recipient: item.EmailAddress.toLowerCase(),
    event_type: complaint ? 'COMPLAINT' : 'BOUNCE', bounce_type: complaint ? null : 'PERMANENT',
    reason: complaint ? 'COMPLAINT' : 'SUPPRESSED', smtp_status: null,
    diagnostic: 'SES 계정 차단 목록에서 확인(상세 응답 없음)', subject: null,
    occurred_at: item.LastUpdateTime.toISOString(),
  });
}

export const EMAIL_FAILURE_LABELS: Record<EmailFeedbackRecord['reason'], string> = {
  MAILBOX_INACTIVE: '수신자 메일함 비활성', USER_NOT_FOUND: '존재하지 않는 수신자',
  MAILBOX_FULL: '수신자 메일함 용량 초과', SUPPRESSED: 'AWS 반송 차단 목록',
  COMPLAINT: '수신자의 스팸 신고', OTHER: '기타 반송 — 서버 응답 확인',
};
