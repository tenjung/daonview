/**
 * 회원가입·비밀번호 재설정 공통 비밀번호 기준.
 * 화면 안내("영문, 숫자, 특수문자 포함 8자 이상")와 같은 기준을 사용한다.
 * 기존 회원의 로그인에는 적용되지 않고, 새로 설정하거나 변경할 때만 적용된다.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RULE_TEXT = '영문, 숫자, 특수문자 포함 8자 이상';

export function getPasswordPolicyError(password: string): string {
  if (password.length < PASSWORD_MIN_LENGTH) return `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    return '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.';
  }
  return '';
}

/** Supabase Auth의 비밀번호 거부 응답을 한글 안내로 바꾼다. 해당하지 않으면 null. */
export function getAuthPasswordErrorMessage(error: unknown): string | null {
  const { code, message } = (error ?? {}) as { code?: string; message?: string };
  const normalizedCode = String(code || '').toUpperCase();
  const normalizedMessage = String(message || '').toUpperCase();

  if (normalizedCode === 'WEAK_PASSWORD' || normalizedMessage.includes('PWNED') || normalizedMessage.includes('WEAK')) {
    return '사용할 수 없는 비밀번호입니다. 유출되었거나 추측하기 쉬운 비밀번호일 수 있으니 다른 비밀번호를 입력해주세요.';
  }
  if (normalizedCode === 'SAME_PASSWORD') return '기존 비밀번호와 다른 비밀번호를 입력해주세요.';
  return null;
}
