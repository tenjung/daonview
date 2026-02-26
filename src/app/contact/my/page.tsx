import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getInquiryCategoryLabel, getInquiryStatusLabel, isInquiryAnswered } from '@/constants/inquiry';

export const dynamic = 'force-dynamic';

export default async function MyInquiryPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/contact/my');
  }

  const { data: inquiries, error } = await supabase
    .from('inquiries')
    .select('id, category, title, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-sm text-rose-500 shadow-sm">
        문의 목록을 불러오지 못했습니다: {error.message}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-black text-text-main">나의 문의 확인</h1>
        <Link href="/contact" className="text-sm font-bold text-primary hover:underline">
          새 문의 작성
        </Link>
      </div>

      {!inquiries || inquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          접수한 문의가 없습니다.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id} className="py-4 first:pt-0 last:pb-0">
              <Link href={`/contact/my/${inquiry.id}`} className="block rounded-xl px-2 py-2 hover:bg-slate-50">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-black ${
                      isInquiryAnswered(inquiry.status)
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {getInquiryStatusLabel(inquiry.status)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {getInquiryCategoryLabel(inquiry.category)}
                  </span>
                </div>
                <p className="truncate text-sm font-bold text-slate-800">{inquiry.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(inquiry.created_at).toLocaleString('ko-KR')}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
