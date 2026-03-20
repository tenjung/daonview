'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error('이메일을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        throw error;
      }

      setSent(true);
      toast.success('비밀번호 재설정 메일을 발송했습니다.', {
        description: '메일함에서 링크를 열어 새 비밀번호를 설정해주세요.',
      });
    } catch (error) {
      console.error('Password reset request failed:', error);
      toast.error('비밀번호 재설정 메일 발송에 실패했습니다.', {
        description: '잠시 후 다시 시도해주세요.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 bg-background">
      <div className="w-full max-w-[450px] bg-surface p-10 rounded-2xl border border-border shadow-sm">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary tracking-tight">
          비밀번호 찾기
        </h1>
        <p className="text-center text-text-secondary text-sm mb-8">
          가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.
        </p>

        <form onSubmit={handleResetRequest}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="email">
              이메일
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-3 border border-border rounded-lg text-base transition-all bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-4 text-base shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? '발송 중...' : '재설정 메일 보내기'}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-border bg-white px-4 py-4 text-sm text-text-secondary">
          {sent
            ? '메일이 도착하지 않으면 스팸함을 확인하고, 잠시 후 다시 시도해주세요.'
            : '회원가입에 사용한 이메일만 비밀번호를 재설정할 수 있습니다.'}
        </div>

        <div className="mt-8 text-center text-sm text-text-secondary">
          <Link href="/login" className="text-primary font-bold underline">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
