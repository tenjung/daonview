import { verify } from 'node:crypto';
import { z } from 'zod';

const envelopeSchema = z.object({
  Type: z.enum(['Notification', 'SubscriptionConfirmation']), Message: z.string().max(200000),
  MessageId: z.string().min(1).max(100), Timestamp: z.iso.datetime({ offset: true }), TopicArn: z.string(),
  Subject: z.string().optional(), Token: z.string().max(4000).optional(), SubscribeURL: z.string().optional(),
  SignatureVersion: z.enum(['1', '2']), Signature: z.string().min(1).max(4000), SigningCertURL: z.string(),
});
export type SNSEnvelope = z.infer<typeof envelopeSchema>;
export class SNSCertificateUnavailable extends Error {}

export function snsSigningText(message: SNSEnvelope) {
  const fields = message.Type === 'Notification'
    ? ['Message', 'MessageId', ...(message.Subject !== undefined ? ['Subject'] : []), 'Timestamp', 'TopicArn', 'Type']
    : ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'];
  return fields.map(key => {
    const value = message[key as keyof SNSEnvelope];
    if (typeof value !== 'string') throw new Error('Missing SNS signature field');
    return `${key}\n${value}\n`;
  }).join('');
}

export async function verifySNSMessage(input: unknown, topicArn: string, fetcher = fetch) {
  const message = envelopeSchema.parse(input);
  const topic = /^arn:aws:sns:([a-z0-9-]+):\d{12}:[A-Za-z0-9_-]+$/.exec(topicArn);
  if (!topic || message.TopicArn !== topicArn) throw new Error('Untrusted SNS topic');
  const certificate = new URL(message.SigningCertURL);
  const hostname = `sns.${topic[1]}.amazonaws.com`;
  if (certificate.protocol !== 'https:' || certificate.hostname !== hostname || certificate.port || certificate.username || certificate.password || certificate.search || certificate.hash || !/^\/SimpleNotificationService-[a-zA-Z0-9_-]+\.pem$/.test(certificate.pathname)) throw new Error('Untrusted SNS certificate URL');
  let pem: string;
  try {
    const response = await fetcher(certificate, { redirect: 'error', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('SNS certificate unavailable');
    pem = await response.text();
  } catch {
    throw new SNSCertificateUnavailable('SNS certificate unavailable');
  }
  if (pem.length > 20000 || !verify(message.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1', Buffer.from(snsSigningText(message)), pem, Buffer.from(message.Signature, 'base64'))) throw new Error('Invalid SNS signature');
  if (message.Type === 'SubscriptionConfirmation') {
    const url = new URL(message.SubscribeURL!);
    if (url.protocol !== 'https:' || url.hostname !== hostname || url.port || url.username || url.password || url.pathname !== '/' || url.searchParams.get('Action') !== 'ConfirmSubscription' || url.searchParams.get('TopicArn') !== topicArn || url.searchParams.get('Token') !== message.Token) throw new Error('Untrusted SNS confirmation URL');
  }
  return message;
}
