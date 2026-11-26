import 'server-only';

export type PurchaseLinkStatus = 'OK' | 'NOT_FOUND' | 'UNKNOWN' | 'INVALID';

const TIMEOUT_MS = 4000;
const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal)$/i;
const IP_HOST = /^(\d{1,3}(\.\d{1,3}){3}|\[[0-9a-f:]+\])$/i;

/**
 * 미리보기용 구매링크 접속 점검. 발송을 막지 않는 참고 정보다.
 * 쇼핑몰이 자동 접속을 막으면 UNKNOWN(확인 불가)로만 표시한다.
 * 관리자·광고주 입력 URL이므로 https + 도메인 이름만 허용하고 리다이렉트는 따라가지 않는다.
 */
export async function checkPurchaseLink(raw: string): Promise<PurchaseLinkStatus> {
  let url: URL;
  try { url = new URL(raw); } catch { return 'INVALID'; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'INVALID';
  if (url.protocol !== 'https:' || IP_HOST.test(url.hostname) || PRIVATE_HOST.test(url.hostname) || url.username || url.password) return 'UNKNOWN';
  try {
    const response = await fetch(url, {
      method: 'GET', redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DaonviewLinkCheck/1.0)', Accept: 'text/html' },
    });
    await response.body?.cancel().catch(() => undefined);
    if (response.status === 404 || response.status === 410) return 'NOT_FOUND';
    if ((response.status >= 200 && response.status < 400)) return 'OK';
    return 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}
