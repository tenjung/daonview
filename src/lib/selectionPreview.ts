// Client-safe: 선정 안내(메일·알림톡) 미리보기 응답 타입과 화면 라벨. 서버 SDK를 import하지 않는다.
import type { SelectionKakaoStatus } from '@/lib/selectionEmailHold';

export type SelectionPreviewCheckStatus = 'OK' | 'WARN' | 'ERROR';
export interface SelectionPreviewCheck { key: string; status: SelectionPreviewCheckStatus; label: string; detail: string }
export type SelectionPreviewLinkStatus = 'OK' | 'NOT_FOUND' | 'UNKNOWN' | 'INVALID';
export interface SelectionPreviewLink { label: string; url: string; status: SelectionPreviewLinkStatus }
export interface SelectionPreviewKakaoHistory {
  id: number; status: SelectionKakaoStatus; at: string; messageText: string | null; phoneMasked: string; senderName: string;
}
export interface SelectionPreview {
  recipientName: string;
  campaignTitle: string;
  email: { subject: string; html: string; hash: string; recipientMasked: string; blockedReason: string | null };
  /** 관리자에게만 제공 */
  kakao: {
    text: string; templateExact: boolean; buttonName: string | null; buttonUrl: string | null; length: number;
    phoneMasked: string; selfPhoneMasked: string | null; hash: string | null; error: string | null;
    alreadySent: { status: SelectionKakaoStatus; at: string } | null;
    history: SelectionPreviewKakaoHistory[];
  } | null;
  links: SelectionPreviewLink[];
  checks: SelectionPreviewCheck[];
}

export const SELECTION_PREVIEW_LINK_STATUS_LABELS: Record<SelectionPreviewLinkStatus, string> = {
  OK: '접속 확인', NOT_FOUND: '없는 페이지', UNKNOWN: '확인 불가', INVALID: '링크 형식 오류',
};
export const SELECTION_PREVIEW_CHECK_ICONS: Record<SelectionPreviewCheckStatus, string> = { OK: '✅', WARN: '⚠️', ERROR: '⛔' };

/** 카톡 칸 표시용: 신청별 최신 알림톡 발송 상태 */
export interface ApplicationKakaoDelivery { applicationId: number; status: SelectionKakaoStatus; at: string }
