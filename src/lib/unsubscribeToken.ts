import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_SCOPE = 'daonview-unsubscribe:v1:';
const SITE_URL = 'https://daonview.com';

function signingKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('수신거부 토큰 서명 키가 설정되지 않았습니다.');
  return key;
}

export function normalizeUnsubscribeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** 수신거부 링크용 HMAC 토큰. 이메일 주소만으로는 다른 사람을 수신거부할 수 없게 한다. */
export function createUnsubscribeToken(email: string) {
  return createHmac('sha256', signingKey())
    .update(TOKEN_SCOPE + normalizeUnsubscribeEmail(email))
    .digest('base64url');
}

export function verifyUnsubscribeToken(email: string | null | undefined, token: string | null | undefined) {
  if (!email || !token) return false;
  const expected = Buffer.from(createUnsubscribeToken(email));
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function buildUnsubscribeUrl(email: string | null | undefined) {
  // 서명 키가 없는 환경에서도 메일 발송 자체는 막지 않는다. 이 경우 링크는 안내 화면으로만 연결된다.
  if (!email || !process.env.SUPABASE_SERVICE_ROLE_KEY) return `${SITE_URL}/unsubscribe`;
  const params = new URLSearchParams({ email: normalizeUnsubscribeEmail(email), token: createUnsubscribeToken(email) });
  return `${SITE_URL}/unsubscribe?${params.toString()}`;
}
