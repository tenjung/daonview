'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { coerceDashboardRole } from '@/constants/role';

// 개발 전용 역할 전환 배지 (localhost + next dev 에서만 렌더링)

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: '관리자' },
  { value: 'ADVERTISER', label: '광고주' },
  { value: 'INFLUENCER', label: '인플루언서' },
] as const;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: '관리자',
  ADVERTISER: '광고주',
  INFLUENCER: '인플루언서',
};

function DevRoleSwitcherInner() {
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const [isLocal, setIsLocal] = useState(false);
  const [open, setOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);

  useEffect(() => {
    setIsLocal(LOCAL_HOSTNAMES.has(window.location.hostname));
  }, []);

  if (!isLocal) return null;

  const currentRole = coerceDashboardRole(profile?.role);
  const currentLabel = !user
    ? '비로그인'
    : `${currentRole ? ROLE_LABELS[currentRole] : '역할 없음'}${profile?.is_test_account ? '' : ' (실계정)'}`;

  async function switchRole(role: string) {
    if (switchingRole) return;
    setSwitchingRole(role);
    try {
      const response = await fetch('/api/dev/login-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const payload = await response.json().catch(() => ({} as Record<string, unknown>));
      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : `전환 실패 (${response.status})`);
      }
      const redirectTo = typeof payload.redirectTo === 'string' ? payload.redirectTo : '/';
      // 서버 세션 기준으로 전체를 다시 그리기 위해 전체 페이지 이동
      window.location.href = redirectTo;
    } catch (error) {
      toast.error('테스트 계정 전환 실패', {
        description: error instanceof Error ? error.message : '알 수 없는 오류',
      });
      setSwitchingRole(null);
    }
  }

  return (
    <div className="fixed left-3 bottom-16 z-[90] text-xs">
      {open && (
        <div className="mb-2 w-40 rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
          <p className="px-2 py-1 text-[10px] font-bold text-gray-400">테스트 계정으로 전환</p>
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={switchingRole !== null}
              onClick={() => switchRole(option.value)}
              className="block w-full rounded-md px-2 py-1.5 text-left font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {switchingRole === option.value ? '전환 중...' : `${option.label}로 전환`}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="rounded-full bg-gray-900/90 px-3 py-1.5 font-bold text-white shadow-lg hover:bg-black"
      >
        🛠 DEV: {currentLabel} ▾
      </button>
    </div>
  );
}

export default function DevRoleSwitcher() {
  // 운영 빌드에서는 이 분기가 상수로 치환되어 화면에 그려지지 않는다.
  if (process.env.NODE_ENV !== 'development') return null;
  return <DevRoleSwitcherInner />;
}
