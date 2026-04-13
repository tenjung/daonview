'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Building2,
  FileText,
  Globe2,
  Handshake,
  Network,
  Phone,
  Radio,
  Route,
  ShieldCheck,
  ShoppingBag,
  Store,
  ShoppingCart,
  UploadCloud,
  UserCircle2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { submitPartnerInquiry } from '@/app/actions/inquiry';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const channels = [
  { value: 'OFFLINE', label: '오프라인', icon: Store },
  { value: 'CLOSED_MALL', label: '폐쇄몰', icon: ShieldCheck },
  { value: 'GROUP_BUY', label: '공동구매', icon: Users },
  { value: 'GLOBAL', label: '해외', icon: Globe2 },
  { value: 'RECOMMEND_ALL', label: '전체 추천', icon: Network },
] as const;

const businessAreas = [
  { title: '신뢰 자산 확보', desc: '다온뷰 플랫폼의 체험단, 리뷰, 콘텐츠 운영으로 브랜드 신뢰를 먼저 만듭니다.', icon: Handshake },
  { title: '판로 다변화', desc: '오프라인, 폐쇄몰, 라이브커머스, 수출 채널로 판매 구조를 확장합니다.', icon: Route },
  { title: '매출 구조화', desc: '광고 반복이 아니라 신뢰를 기반으로 판매 채널이 늘어나는 구조를 설계합니다.', icon: BarChart3 },
];

const processSteps = ['제품 검토', '체험단 실행', '판로 설계', '채널 입점', '매출 확장'];
const executionItems = [
  { title: '기획전 운영', icon: ShoppingBag },
  { title: '공동구매', icon: Users },
  { title: '데이터 최적화', icon: BarChart3 },
];
const heroChannels = [
  { label: '오프라인', icon: Store },
  { label: '폐쇄몰', icon: ShieldCheck },
  { label: '라이브커머스', icon: Radio },
  { label: '수출', icon: Globe2 },
];

export default function PartnerBusinessPageClient() {
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['RECOMMEND_ALL']);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollToForm = () => {
    document.getElementById('partner-inquiry-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleChannel = (value: string) => {
    setSelectedChannels((prev) => {
      if (value === 'RECOMMEND_ALL') return ['RECOMMEND_ALL'];

      const next = prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev.filter((item) => item !== 'RECOMMEND_ALL'), value];

      return next.length > 0 ? next : ['RECOMMEND_ALL'];
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedChannels.length === 0) {
      toast.error('희망 채널을 1개 이상 선택해주세요.');
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.delete('requestedChannels');
    selectedChannels.forEach((channel) => formData.append('requestedChannels', channel));
    formData.set('inquirySource', 'PARTNER_ROOT');

    setIsSubmitting(true);
    try {
      const result = await submitPartnerInquiry(formData);
      if (!result.success) {
        toast.error(result.error || '문의 접수 중 오류가 발생했습니다.');
        return;
      }

      toast.success('입점 가능성 검토 요청이 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.');
      form.reset();
      setFileName('');
      setSelectedChannels(['RECOMMEND_ALL']);
    } catch {
      toast.error('문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden px-4 py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.24),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.24),transparent_30%),linear-gradient(135deg,#020617_0%,#111827_48%,#3f1028_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(0deg,#fff_1px,transparent_1px)] bg-[size:44px_44px]" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 mx-auto max-w-6xl"
        >
          <motion.div variants={fadeUp} className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-rose-100 backdrop-blur">
            <ShoppingCart className="h-4 w-4 text-amber-300" />
            오픈마켓 경쟁에서 벗어나
          </motion.div>

          <motion.h1 variants={fadeUp} className="max-w-5xl text-4xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">
            브랜드 성장을
            <br />
            한 채널에 묶어두지 마세요.
            <span className="mt-4 block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-fuchsia-300">
              제품에 맞는 다음 판매 채널을 설계합니다.
            </span>
          </motion.h1>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            {heroChannels.map((channel) => (
              <div
                key={channel.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white/90 backdrop-blur"
              >
                <channel.icon className="h-4 w-4 text-rose-200" />
                {channel.label}
              </div>
            ))}
          </motion.div>

          <motion.p variants={fadeUp} className="mt-8 max-w-3xl text-lg font-semibold leading-relaxed text-slate-300 md:text-2xl">
            다온컴퍼니는 다온뷰 플랫폼의 체험단·콘텐츠 운영 역량을 기반으로,
            제품에 맞는 유통 채널과 매출 확장 구조를 설계합니다.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-11 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={scrollToForm}
              className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-black text-slate-950 shadow-2xl shadow-rose-950/30 transition hover:-translate-y-0.5 hover:bg-rose-50"
            >
              입점 가능성 확인 <ArrowRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={scrollToForm}
              className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-8 py-4 text-lg font-black text-white backdrop-blur transition hover:bg-white/15"
            >
              무료 판로 진단
            </button>
          </motion.div>
        </motion.div>
      </section>

      <section className="bg-white px-4 py-20 text-slate-950">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-rose-500">Problem</p>
            <h2 className="text-3xl font-black leading-tight md:text-5xl">문제는 광고가 아니라 구조입니다.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['광고비 상승', '입찰 경쟁이 심해질수록 같은 매출을 만들기 위한 비용이 계속 올라갑니다.'],
              ['광고를 끄면 매출 0', '광고가 꺼지는 순간 유입도 함께 끊기는 구조는 브랜드 자산이 되기 어렵습니다.'],
              ['채널 확장 부재', '신뢰 콘텐츠 없이 판매 채널만 늘리면 입점 이후 전환이 약해집니다.'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                <h3 className="mb-4 text-2xl font-black">{title}</h3>
                <p className="text-base font-semibold leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-rose-300">Daon Structure</p>
            <h2 className="text-3xl font-black leading-tight md:text-5xl">
              다온컴퍼니는 다온뷰 플랫폼으로 신뢰를 만들고,
              <br />
              그 신뢰를 판로 확장으로 연결합니다.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {businessAreas.map((item) => (
              <div key={item.title} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/20">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-200">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-4 text-2xl font-black">{item.title}</h3>
                <p className="text-base font-semibold leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-[2rem] border border-rose-300/20 bg-gradient-to-r from-rose-500/10 via-fuchsia-500/10 to-indigo-500/10 p-6 text-center text-xl font-black text-rose-50 md:text-2xl">
            제품 → 체험단 → 신뢰 → 유통 → 매출
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-24 text-slate-950">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
              <h3 className="mb-6 text-2xl font-black text-slate-500">기존 광고 방식</h3>
              {['광고로 시작', '광고비 반복 투입', '지속성 낮음'].map((item) => (
                <div key={item} className="mb-3 rounded-2xl bg-white px-5 py-4 font-bold text-slate-500">
                  {item}
                </div>
              ))}
            </div>
            <div className="rounded-[2rem] border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-8">
              <h3 className="mb-6 text-2xl font-black text-rose-600">다온 구조</h3>
              {['체험단으로 시작', '리뷰 신뢰 기반 채널 확장', '지속성 높은 판로 구조'].map((item) => (
                <div key={item} className="mb-3 rounded-2xl bg-white px-5 py-4 font-black text-slate-950 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-amber-200">Execution</p>
              <h2 className="text-3xl font-black leading-tight md:text-5xl">기획전, 공동구매, 데이터 기반 최적화까지 실행합니다.</h2>
              <p className="mt-6 text-lg font-semibold leading-relaxed text-slate-400">
                제품이 팔리는 구조는 한 번의 광고 집행이 아니라, 신뢰 콘텐츠와 판매 채널을 연결하는 운영력에서 나옵니다.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {executionItems.map((item) => (
                <div key={item.title} className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
                  <item.icon className="mb-8 h-8 w-8 text-rose-300" />
                  <h3 className="text-xl font-black">{item.title}</h3>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 grid gap-3 md:grid-cols-5">
            {processSteps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                <span className="text-sm font-black text-rose-300">0{index + 1}</span>
                <p className="mt-4 text-lg font-black">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="partner-inquiry-form" className="bg-white px-4 py-24 text-slate-950 scroll-mt-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-rose-500">Contact</p>
            <h2 className="text-3xl font-black leading-tight md:text-5xl">입점 가능성 확인하기</h2>
            <p className="mt-6 text-lg font-semibold leading-relaxed text-slate-600">
              제품소개서를 업로드하면 체험단 실행 가능성과 적합한 판로를 함께 검토합니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-2xl shadow-slate-200/60 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="relative block">
                <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input name="companyName" required placeholder="회사명" className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 font-bold outline-none transition focus:border-rose-400" />
              </label>
              <label className="relative block">
                <UserCircle2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input name="managerName" required placeholder="담당자명" className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 font-bold outline-none transition focus:border-rose-400" />
              </label>
              <label className="relative block">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input name="phone" type="tel" required placeholder="연락처" className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 font-bold outline-none transition focus:border-rose-400" />
              </label>
              <label className="relative block">
                <FileText className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input name="email" type="email" placeholder="이메일 (선택)" className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 font-bold outline-none transition focus:border-rose-400" />
              </label>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-black text-slate-700">희망 채널</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {channels.map((channel) => (
                  <button
                    key={channel.value}
                    type="button"
                    onClick={() => toggleChannel(channel.value)}
                    className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${selectedChannels.includes(channel.value)
                      ? 'border-rose-400 bg-rose-50 text-rose-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    <channel.icon className="h-4 w-4" />
                    {channel.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-6 block">
              <span className="mb-3 block text-sm font-black text-slate-700">제품 설명</span>
              <textarea name="message" required rows={4} placeholder="제품군, 현재 판매 채널, 희망 유통 방향을 적어주세요." className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 font-bold outline-none transition focus:border-rose-400" />
            </label>

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white px-5 py-8 text-center transition hover:border-rose-300 hover:bg-rose-50/40">
              <UploadCloud className="mb-3 h-9 w-9 text-rose-500" />
              <span className="text-base font-black text-slate-900">{fileName || '제품소개서 업로드'}</span>
              <span className="mt-1 text-xs font-semibold text-slate-500">PDF, DOC, PPT, JPG, PNG / 최대 10MB</span>
              <input
                name="productFile"
                type="file"
                required
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(event) => setFileName(event.target.files?.[0]?.name || '')}
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-7 flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-rose-500 px-8 py-4 text-lg font-black text-white shadow-xl shadow-rose-200 transition hover:bg-rose-600 disabled:bg-rose-300"
            >
              {isSubmitting ? '접수 중...' : '입점 가능성 확인하기'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
