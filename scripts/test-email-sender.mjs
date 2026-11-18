// Run with node --test scripts/test-email-sender.mjs. No emails or DB writes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

function fixture(env = {}, status = 'SUBSCRIBED') {
  const requests = [];
  const query = {
    select() { return this; }, eq() { return this; },
    single: async () => ({ data: { email_subscription_status: status } }),
    maybeSingle: async () => ({ data: null }),
  };
  const email = load('src/lib/email.ts', {
    '@aws-sdk/client-ses': {
      SESClient: class { async send(command) { requests.push(command.input); return { MessageId: 'test-id' }; } },
      SendEmailCommand: class { constructor(input) { this.input = input; } },
    },
    './supabase/admin': { createAdminClient: () => ({ from: () => query }) },
  }, { env: { NODE_ENV: 'production', AWS_ACCESS_KEY_ID: 'test-key', ...env } });
  return { ...email, requests };
}

function checkAddresses(request, sender) {
  assert.match(request.Source, /^[\x20-\x7e]+$/);
  const encodedName = request.Source.match(/^=\?UTF-8\?B\?([^?]+)\?= <([^>]+)>$/);
  assert.ok(encodedName, 'Sender uses an RFC 2047 encoded-word');
  assert.equal(Buffer.from(encodedName[1], 'base64').toString('utf8'), '다온뷰');
  assert.equal(encodedName[2], sender);
  assert.equal(request.ReturnPath, 'master@daonview.com');
  assert.ok(!/[<>\r\n\u0080-\uffff]/.test(request.ReturnPath));
  assert.equal(request.Message.Subject.Charset, 'UTF-8');
  assert.equal(request.Message.Body.Html.Charset, 'UTF-8');
}

test('normal SES sender preserves Korean name and routes bounces to a bare admin address', async () => {
  const f = fixture();
  await f.sendEmail('recipient@example.com', 'REVIEW_APPROVED', { nickname: '테스트', campaignTitle: '한글 캠페인' });
  assert.equal(f.requests.length, 1);
  checkAddresses(f.requests[0], 'master@daonview.com');
  assert.deepEqual(f.requests[0].Destination.ToAddresses, ['recipient@example.com']);
  assert.ok(f.requests[0].Message.Subject.Data.includes('한글 캠페인'));
});

test('configured sender changes Source while feedback stays at the verified admin mailbox', async () => {
  const f = fixture({ EMAIL_FROM: 'notifications@daonview.com' });
  await f.sendEmail('recipient@example.com', 'REVIEW_APPROVED', {});
  checkAddresses(f.requests[0], 'notifications@daonview.com');
});

test('admin and reminder SES paths use the same encoded sender and feedback address', async () => {
  const f = fixture({ ADMIN_INQUIRY_EMAIL: 'admin@example.com' });
  await f.sendAdminPartnerInquiryEmail({ companyName: '테스트', managerName: '테스트', phone: '000', requestedChannels: [], productFileName: '테스트.pdf', message: '테스트' });
  await f.sendEmail('recipient@example.com', 'CAMPAIGN_PROGRESS_REMINDER', { nickname: '테스트' });
  assert.equal(f.requests.length, 2);
  for (const request of f.requests) checkAddresses(request, 'master@daonview.com');
  assert.deepEqual(f.requests[0].Destination.ToAddresses, ['admin@example.com']);
});

test('header fix preserves unsubscribe, bounce and complaint suppression without sending', async () => {
  for (const status of ['UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED']) {
    const f = fixture({}, status);
    assert.equal((await f.sendEmail('recipient@example.com', 'REVIEW_APPROVED', {})).skipped, true);
    assert.equal(f.requests.length, 0);
  }
});
