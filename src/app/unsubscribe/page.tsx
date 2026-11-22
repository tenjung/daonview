import type { Metadata } from 'next';
import Link from 'next/link';
import { MailX } from 'lucide-react';
import { verifyUnsubscribeToken } from '@/lib/unsubscribeToken';

export const metadata: Metadata = {
  title: '이메일 수신 거부 | 다온뷰',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ email?: string; token?: string; error?: string }>;
};

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { email = '', token = '', error } = await searchParams;
  const isValid = verifyUnsubscribeToken(email, token);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center">
            <MailX className="w-10 h-10 text-rose-500" />
          </div>
        </div>

        {isValid && !error ? (
          <>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">이메일 수신을 거부할까요?</h1>
            <p className="text-slate-500 mb-8 leading-relaxed break-keep">
              {maskEmail(email)} 주소로 다온뷰 소식을 더 이상 보내지 않습니다.
            </p>
            <form action="/api/unsubscribe" method="post" className="space-y-3">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
              >
                수신 거부하기
              </button>
              <Link href="/" className="block w-full py-4 text-slate-500 font-bold hover:text-slate-700">
                취소
              </Link>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
              {error === 'failed' ? '처리하지 못했습니다' : '유효하지 않은 링크입니다'}
            </h1>
            <p className="text-slate-500 mb-8 leading-relaxed break-keep">
              {error === 'failed'
                ? '잠시 후 메일의 수신거부 링크를 다시 눌러 주세요.'
                : '최근 받은 메일의 수신거부 링크를 이용하거나 고객센터로 문의해 주세요.'}
            </p>
            <Link
              href="/"
              className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
