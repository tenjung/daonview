'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [canUpdatePassword, setCanUpdatePassword] = useState(false);

  useEffect(() => {
    let mounted = true;

    const finalizeState = (hasSession: boolean) => {
      if (!mounted) return;
      setCanUpdatePassword(hasSession);
      setCheckingSession(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        finalizeState(Boolean(session));
      }
    });

    const timer = window.setTimeout(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        finalizeState(Boolean(session));
      } catch (error) {
        console.error('Password update session check failed:', error);
        finalizeState(false);
      }
    }, 800);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (password !== passwordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('비밀번호가 변경되었습니다.', {
        description: '새 비밀번호로 다시 로그인해주세요.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Password update failed:', error);
      toast.error('비밀번호 변경에 실패했습니다.', {
        description: '재설정 링크를 다시 요청한 뒤 시도해주세요.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 bg-background">
      <div className="w-full max-w-[450px] bg-surface p-10 rounded-2xl border border-border shadow-sm">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary tracking-tight">
          새 비밀번호 설정
        </h1>
        <p className="text-center text-text-secondary text-sm mb-8">
          재설정 링크가 유효하면 바로 새 비밀번호를 저장할 수 있습니다.
        </p>

        {checkingSession ? (
          <div className="rounded-xl border border-border bg-white px-4 py-6 text-center text-sm text-text-secondary">
            재설정 링크를 확인하는 중입니다...
          </div>
        ) : canUpdatePassword ? (
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="password">
                새 비밀번호
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 border border-border rounded-lg text-base transition-all bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300"
                placeholder="새 비밀번호를 입력해주세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="password-confirm">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                id="password-confirm"
                className="w-full px-4 py-3 border border-border rounded-lg text-base transition-all bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300"
                placeholder="새 비밀번호를 다시 입력해주세요"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-4 text-base shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        ) : (
          <div className="rounded-xl border border-border bg-white px-4 py-6 text-center text-sm text-text-secondary">
            재설정 링크가 유효하지 않거나 만료되었습니다. 비밀번호 찾기를 다시 진행해주세요.
          </div>
        )}

        <div className="mt-8 text-center text-sm text-text-secondary">
          <Link href="/forgot-password" className="text-primary font-bold underline">
            비밀번호 재설정 메일 다시 요청하기
          </Link>
        </div>
      </div>
    </div>
  );
}
