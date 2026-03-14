import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getInquiryCategoryLabel, getInquiryStatusLabel, isInquiryAnswered } from '@/constants/inquiry';

interface MyInquiryDetailProps {
  id: string;
  basePath?: string;
}

export default async function MyInquiryDetail({
  id,
  basePath = '/contact',
}: MyInquiryDetailProps) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`${basePath}/my/${id}`)}`);
  }

  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .select('id, user_id, category, title, content, status, answer, created_at, answered_at')
    .eq('id', id)
    .single();

  if (error || !inquiry) return notFound();
  if (inquiry.user_id !== user.id) return notFound();

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
      <Link href={`${basePath}/my`} className="mb-4 inline-flex text-sm font-bold text-slate-500 hover:text-slate-900">
        목록으로
      </Link>

      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-black ${
            isInquiryAnswered(inquiry.status)
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          }`}
        >
          {getInquiryStatusLabel(inquiry.status)}
        </span>
        <span className="text-xs font-bold text-slate-400">{getInquiryCategoryLabel(inquiry.category)}</span>
      </div>

      <h1 className="mb-2 text-2xl font-black text-text-main">{inquiry.title}</h1>
      <p className="mb-6 text-xs text-slate-400">접수일: {new Date(inquiry.created_at).toLocaleString('ko-KR')}</p>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <h2 className="mb-2 text-sm font-black text-slate-800">문의 내용</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{inquiry.content}</p>
      </div>

      {isInquiryAnswered(inquiry.status) && inquiry.answer ? (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <h2 className="mb-2 text-sm font-black text-emerald-700">답변</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-800">{inquiry.answer}</p>
          {inquiry.answered_at && (
            <p className="mt-2 text-xs text-emerald-600">답변일: {new Date(inquiry.answered_at).toLocaleString('ko-KR')}</p>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-700">
          아직 답변이 등록되지 않았습니다.
        </div>
      )}
    </div>
  );
}
