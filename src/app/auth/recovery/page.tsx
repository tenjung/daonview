import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: '비밀번호 재설정 확인',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

async function confirmRecovery(formData: FormData) {
  'use server';

  const tokenHash = formData.get('token_hash');
  if (typeof tokenHash !== 'string' || !tokenHash) {
    redirect('/auth/recovery');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'recovery',
  });

  if (error) {
    redirect('/auth/recovery');
  }

  redirect('/update-password');
}

export default async function RecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string | string[] }>;
}) {
  const { token_hash: tokenHash } = await searchParams;
  const hasToken = typeof tokenHash === 'string' && tokenHash.length > 0;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-[450px] rounded-2xl border border-border bg-surface p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-primary">비밀번호 재설정 확인</h1>
        {hasToken ? (
          <form action={confirmRecovery}>
            <input type="hidden" name="token_hash" value={tokenHash} />
            <p className="mb-6 text-sm text-text-secondary">
              계속하려면 아래 버튼을 눌러 새 비밀번호 설정 화면으로 이동하세요.
            </p>
            <button type="submit" className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-white">
              새 비밀번호 설정으로 이동
            </button>
          </form>
        ) : (
          <>
            <p className="mb-6 text-sm text-text-secondary">
              재설정 링크가 유효하지 않거나 만료되었습니다. 새 링크를 요청해 주세요.
            </p>
            <Link href="/forgot-password" className="font-bold text-primary underline">
              비밀번호 재설정 메일 다시 요청하기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
