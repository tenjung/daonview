// No real emails, database writes, or AWS requests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { load } from '../tests/helpers/load-typescript.mjs';

const feedback = load('src/lib/emailFeedback.ts');
const sns = load('src/lib/snsVerification.ts');
const topic = 'arn:aws:sns:ap-northeast-2:123456789012:daonview-email-feedback';
const bounce = (type = 'Permanent', diagnostic = 'smtp; 550 5.2.1 Mailbox is inactive') => ({
  notificationType: 'Bounce', mail: { messageId: 'ses-id', source: 'master@daonview.com', commonHeaders: { subject: '캠페인 선정 안내' } },
  bounce: { feedbackId: 'feedback-id', timestamp: '2026-11-18T08:17:45.000Z', bounceType: type, bounceSubType: 'General', bouncedRecipients: [{ emailAddress: 'Recipient@example.com', status: '5.2.1', diagnosticCode: diagnostic }] },
});

test('inactive and nonexistent recipients remain permanent; full mailbox stays transient', () => {
  assert.equal(feedback.normalizeSESFeedback(bounce(), 'master@daonview.com')[0].reason, 'MAILBOX_INACTIVE');
  const missing = feedback.normalizeSESFeedback(bounce('Permanent', '550 5.1.1 No such user'), 'master@daonview.com')[0];
  assert.equal(missing.reason, 'USER_NOT_FOUND');
  const full = feedback.normalizeSESFeedback(bounce('Transient', '554 4.4.7 Message expired <452 4.2.2 out of storage space>'), 'master@daonview.com')[0];
  assert.equal(full.reason, 'MAILBOX_FULL');
  assert.equal(full.bounce_type, 'TRANSIENT');
});
test('duplicate events get a stable key per recipient and reject unexpected senders', () => {
  const event = bounce();
  const a = feedback.normalizeSESFeedback(event, 'master@daonview.com')[0];
  assert.equal(a.recipient, 'recipient@example.com');
  assert.equal(a.event_key, feedback.normalizeSESFeedback(event, 'master@daonview.com')[0].event_key);
  event.bounce.bouncedRecipients.push({ emailAddress: 'other@example.com' });
  const b = feedback.normalizeSESFeedback(event, 'master@daonview.com');
  assert.notEqual(b[0].event_key, b[1].event_key);
  assert.throws(() => feedback.normalizeSESFeedback(event, 'other@example.com'));
});
test('complaints are distinct and malformed feedback is rejected', () => {
  const event = { notificationType: 'Complaint', mail: bounce().mail, complaint: { feedbackId: 'complaint', timestamp: '2026-11-18T00:00:00Z', complainedRecipients: [{ emailAddress: 'test@example.com' }] } };
  const result = feedback.normalizeSESFeedback(event, 'master@daonview.com')[0];
  assert.equal(result.event_type, 'COMPLAINT');
  assert.equal(result.bounce_type, null);
  assert.throws(() => feedback.normalizeSESFeedback({ ...bounce(), bounce: undefined }, 'master@daonview.com'));
});

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = publicKey.export({ type: 'spki', format: 'pem' });
function signed(overrides = {}) {
  const e = { Type: 'Notification', Message: JSON.stringify(bounce()), MessageId: 'sns-id', Timestamp: '2026-11-18T08:17:45Z', TopicArn: topic, SignatureVersion: '2', SigningCertURL: 'https://sns.ap-northeast-2.amazonaws.com/SimpleNotificationService-test.pem', ...overrides };
  e.Signature = sign(e.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1', Buffer.from(sns.snsSigningText(e)), privateKey).toString('base64');
  return e;
}
const fetchCert = async () => new Response(pem);
test('verifies signed notification with optional subject; rejects tampering and foreign topics', async () => {
  for (const SignatureVersion of ['1', '2']) {
    const e = signed({ Subject: 'SES feedback', SignatureVersion });
    assert.equal((await sns.verifySNSMessage(e, topic, fetchCert)).MessageId, 'sns-id');
    await assert.rejects(sns.verifySNSMessage({ ...e, Message: 'tampered' }, topic, fetchCert));
    await assert.rejects(sns.verifySNSMessage(e, topic.replace('123456789012', '999999999999'), fetchCert));
  }
});
test('rejects certificate SSRF/redirect destinations before fetching', async () => {
  for (const url of ['http://sns.ap-northeast-2.amazonaws.com/x.pem', 'https://sns.ap-northeast-2.amazonaws.com.attacker.test/x.pem', 'https://127.0.0.1/x.pem', 'https://sns.ap-northeast-2.amazonaws.com:444/SimpleNotificationService-test.pem']) {
    let called = false;
    await assert.rejects(sns.verifySNSMessage(signed({ SigningCertURL: url }), topic, async () => { called = true; return new Response(pem); }));
    assert.equal(called, false);
  }
});
test('subscription confirmation URL must match signed topic and token; cert outages are retryable', async () => {
  const url = `https://sns.ap-northeast-2.amazonaws.com/?Action=ConfirmSubscription&TopicArn=${encodeURIComponent(topic)}&Token=test`;
  const e = signed({ Type: 'SubscriptionConfirmation', Token: 'test', SubscribeURL: url });
  assert.equal((await sns.verifySNSMessage(e, topic, fetchCert)).Type, 'SubscriptionConfirmation');
  await assert.rejects(sns.verifySNSMessage(signed({ Type: 'SubscriptionConfirmation', Token: 'test', SubscribeURL: 'https://attacker.test/' }), topic, fetchCert));
  await assert.rejects(sns.verifySNSMessage(signed(), topic, async () => { throw new Error('offline'); }), sns.SNSCertificateUnavailable);
});

function handlerFixture({ verifyFailure = false, dbFailure = false, type = 'Notification' } = {}) {
  const writes = [];
  const mod = load('src/app/api/webhooks/aws-ses/route.ts', {
    '@/lib/snsVerification': { ...sns, verifySNSMessage: async () => {
      if (verifyFailure) throw new Error('forged');
      return { Type: type, Message: JSON.stringify(bounce()) };
    } },
    '@/lib/supabase/admin': { createAdminClient: () => ({ rpc: async (name, args) => { writes.push({ name, args }); return { error: dbFailure ? { code: 'FAIL' } : null }; } }) },
  }, { env: { AWS_SES_FEEDBACK_TOPIC_ARN: topic } });
  return { writes, POST: mod.POST };
}
test('unsigned notifications never touch DB and storage failures request SNS retry', async () => {
  const forged = handlerFixture({ verifyFailure: true });
  assert.equal((await forged.POST(new Request('https://example.test', { method: 'POST', body: '{}' }))).status, 400);
  assert.equal(forged.writes.length, 0);
  const failing = handlerFixture({ dbFailure: true });
  assert.equal((await failing.POST(new Request('https://example.test', { method: 'POST', body: '{}' }))).status, 500);
  const good = handlerFixture();
  assert.equal((await good.POST(new Request('https://example.test', { method: 'POST', body: '{}' }))).status, 200);
  assert.equal(good.writes[0].name, 'record_email_feedback');
});

test('admin feedback API denies anonymous and non-admin users before privileged query', async () => {
  for (const role of [null, 'INFLUENCER', 'ADVERTISER']) {
    let privileged = false;
    const session = {
      auth: { getUser: async () => ({ data: { user: role ? { id: 'actor' } : null } }) },
      from: () => ({ select() { return this; }, eq() { return this; }, single: async () => ({ data: { role } }) }),
    };
    const { GET } = load('src/app/api/admin/email-feedback/route.ts', {
      '@/lib/supabase/server': { createClient: async () => session },
      '@/lib/supabase/admin': { createAdminClient: () => { privileged = true; throw new Error('Must not access'); } },
    });
    assert.equal((await GET(new Request('https://example.test/api/admin/email-feedback'))).status, role ? 403 : 401);
    assert.equal(privileged, false);
  }
});
