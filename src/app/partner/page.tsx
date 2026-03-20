'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  CheckCircle2, ChevronRight, XCircle, Search, 
  TrendingUp, Play, Smartphone, Star, BarChart3,
  Users, Sparkles, Building2, UserCircle2, Mail, Phone, ShoppingBag, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { submitPartnerInquiry } from '@/app/actions/inquiry';

// Fade-in animation variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function PartnerLandingPage() {
  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    managerName: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await submitPartnerInquiry(formData);
      if (res.success) {
        toast.success('문의가 안전하게 접수되었습니다. 담당자가 빠르게 평일 기준 24시간 내 연락드리겠습니다.');
        setFormData({ companyName: '', managerName: '', phone: '', email: '', message: '' });
      } else {
        toast.error(res.error || '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (err) {
      toast.error('문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const scrollToForm = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('consulting-form');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-rose-200">
      
      {/* 1. Hero Section */}
      <section className="relative pt-8 pb-16 lg:pt-10 lg:pb-24 overflow-hidden bg-white">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-rose-50 blur-3xl opacity-70" />
            <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-violet-50 blur-3xl opacity-60" />
        </div>

        <div className="w-full max-w-[1200px] mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Hero Copy */}
            <motion.div 
              initial="hidden" 
              animate="visible" 
              variants={staggerContainer}
              className="text-center lg:text-left z-10"
            >
              <motion.div variants={fadeUp} className="inline-block px-4 py-2 rounded-full bg-rose-100 text-rose-700 font-bold text-sm mb-6 shadow-sm border border-rose-200">
                앰플 · 스킨케어 특화
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-[2.5rem] md:text-5xl lg:text-5xl xl:text-6xl font-serif font-black text-slate-900 leading-[1.2] mb-6 tracking-tight break-keep">
                <span className="inline-block">숏폼으로 <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-violet-600">고객을 만드는</span></span><br/>
                <span className="inline-block">화장품 체험단</span>
              </motion.h1>
              <motion.div variants={fadeUp} className="space-y-4 mb-10">
                  <div className="flex items-center justify-center lg:justify-start gap-3 text-slate-600 text-lg md:text-xl font-medium">
                      <CheckCircle2 className="w-6 h-6 text-rose-500 shrink-0" />
                      <span>팔로워 상관없이 <strong>콘텐츠 생산</strong></span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-3 text-slate-600 text-lg md:text-xl font-medium">
                      <CheckCircle2 className="w-6 h-6 text-rose-500 shrink-0" />
                      <span><strong>조회수 기반</strong> 숏폼 체험단</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-3 text-slate-600 text-lg md:text-xl font-medium">
                      <CheckCircle2 className="w-6 h-6 text-rose-500 shrink-0" />
                      <span>화장품에 최적화된 <strong>콘텐츠 구조 제공</strong></span>
                  </div>
              </motion.div>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a 
                  href="#consulting-form"
                  onClick={scrollToForm}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 min-h-[44px] flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-5 h-5" /> 무료 체험단 문의
                </a>
                <a 
                  href="#consulting-form"
                  onClick={scrollToForm}
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 rounded-xl font-bold text-lg transition-all min-h-[44px] flex items-center justify-center"
                >
                  테스트 캠페인 신청
                </a>
              </motion.div>
            </motion.div>

            {/* Hero Form */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative z-10 lg:ml-auto w-full max-w-md mx-auto lg:mx-0 scroll-mt-28"
              id="consulting-form"
            >
              <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">무료 상담 신청</h3>
                  <p className="text-sm text-slate-500">담당자가 확인 후 즉시 연락드립니다</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        name="companyName"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="회사명" 
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all font-medium text-slate-700 placeholder:font-normal"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        name="managerName"
                        required
                        value={formData.managerName}
                        onChange={handleChange}
                        placeholder="담당자명" 
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all font-medium text-slate-700 placeholder:font-normal"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="tel" 
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="연락처" 
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all font-medium text-slate-700 placeholder:font-normal"
                      />
                    </div>
                  </div>
                  <div>
                    <textarea 
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="문의 내용 (선택사항)" 
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all font-medium text-slate-700 placeholder:font-normal resize-none"
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl font-bold text-lg shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center min-h-[44px]"
                  >
                    {isSubmitting ? '신청 중...' : '체험단 문의하기'}
                  </button>
                  <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed">
                    신청 시 개인정보처리방침에 동의한 것으로 간주합니다.
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. 문제 제시 */}
      <section className="py-24 bg-slate-900 text-white relative">
          <div className="absolute inset-0 bg-slate-950 opacity-50 mix-blend-overlay"></div>
          <div className="w-full max-w-[1000px] mx-auto px-4 relative z-10">
              <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={staggerContainer}
                  className="text-center mb-16"
              >
                  <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-serif font-black mb-6 text-slate-50 tracking-tight break-keep">
                      블로그 체험단만으로 충분하신가요?
                  </motion.h2>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: "검색 노출 중심", desc: "고정된 형태의 검색 노출로 유기적인 확산 제한", icon: Search },
                  { title: "낮은 체감 효과", desc: "체험단 진행 비용 대비 실질적 인지도 상승 체감 부족", icon: TrendingUp },
                  { title: "구매 전환 저조", desc: "단순 텍스트 리뷰로 인해 구매 행동까지 연결 어려움", icon: XCircle }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: idx * 0.15, duration: 0.6 }}
                    className="bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm p-8 rounded-2xl text-center flex flex-col items-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-6">
                        <item.icon className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
          </div>
      </section>

      {/* 3. 해결책 (핵심 포지셔닝) */}
      <section className="py-24 bg-rose-50/50">
          <div className="w-full max-w-[1000px] mx-auto px-4">
              <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={staggerContainer}
                  className="text-center"
              >
                  <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-rose-600 font-bold text-sm mb-6 shadow-sm">
                      <Sparkles className="w-4 h-4" /> The Solution
                  </motion.div>
                  <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-serif font-black text-slate-900 mb-16 leading-tight break-keep">
                      다온뷰는 <br className="md:hidden" /><span className="text-rose-500">숏폼 성과에 집중한</span> <span className="inline-block">화장품 체험단입니다</span>
                  </motion.h2>

                  <div className="grid md:grid-cols-3 gap-8">
                    {[
                      { title: "앰플/기초 특화", desc: "타겟이 명확한 기초 화장품 특화", icon: Star },
                      { title: "숏폼 콘텐츠 전용", desc: "릴스/쇼츠/틱톡 포맷 최적화 운영", icon: Smartphone },
                      { title: "조회수 기반 생성", desc: "알고리즘 확산 및 조회수 최우선 목표", icon: BarChart3 }
                    ].map((item, idx) => (
                      <motion.div 
                        key={idx}
                        variants={fadeUp}
                        className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:-translate-y-2 transition-transform duration-300"
                      >
                          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-6 mx-auto">
                            <item.icon className="w-8 h-8 text-rose-500" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                          <p className="text-slate-600 font-medium">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
              </motion.div>
          </div>
      </section>

      {/* 4. 운영 방식 */}
      <section className="py-24 bg-white">
        <div className="w-full max-w-[1000px] mx-auto px-4">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
                <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-serif font-black text-slate-900 mb-4 break-keep">
                    이렇게 체험단이 운영됩니다
                </motion.h2>
            </motion.div>

            <div className="relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-[60px] left-[12%] right-[12%] h-1 bg-gradient-to-r from-rose-100 via-rose-300 to-violet-200"></div>
                
                <div className="grid md:grid-cols-4 gap-8 md:gap-4 relative z-10">
                    {[
                        { step: "01", title: "크리에이터 모집", desc: "브랜드 핏에 맞는 인플루언서 매칭" },
                        { step: "02", title: "숏폼 가이드 제공", desc: "다온뷰만의 후킹/기획안 전달" },
                        { step: "03", title: "콘텐츠 업로드", desc: "제작 점검 후 알고리즘 최적화 게시" },
                        { step: "04", title: "데이터 확보", desc: "조회수 및 반응 성과 리포팅" }
                    ].map((item, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: idx * 0.15, duration: 0.6 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="w-32 h-32 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col items-center justify-center mb-6 border-[6px] border-slate-50 relative z-10 group hover:border-rose-100 transition-colors">
                                <span className="text-xs font-bold text-rose-400 mb-1 tracking-widest">STEP</span>
                                <span className="text-4xl font-black text-slate-900">{item.step}</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                            <p className="text-slate-600 font-medium px-4">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* 5. 콘텐츠 구조 설명 */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
          <div className="w-full max-w-[1200px] mx-auto px-4">
              <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={staggerContainer}
                  className="mb-16 md:flex md:items-end justify-between"
              >
                  <div className="max-w-xl text-center md:text-left mx-auto md:mx-0">
                    <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-serif font-black text-white leading-tight break-keep">
                        화장품 숏폼은 <br className="hidden md:block"/>구조가 <span className="text-violet-400">다릅니다</span>
                    </motion.h2>
                  </div>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6">
                  {[
                      { 
                          phase: "Phase 1", title: "3초 후킹 구조", 
                          desc: "이탈률이 가장 높은 초반 3초에 시각적 변화나 수치화된 결과를 우선 배치하여 시선을 압도합니다.",
                          bg: "bg-slate-800"
                      },
                      { 
                          phase: "Phase 2", title: "사용 장면 필수", 
                          desc: "제품의 제형과 발림성, 스며드는 과정을 생생한 사운드와 액션으로 명확히 보여줍니다.",
                          bg: "bg-slate-800"
                      },
                      { 
                          phase: "Phase 3", title: "결과 컷 포함", 
                          desc: "사용 전/후의 시각적 차이를 통해 소비자에게 확실한 구매 소구점을 제안합니다.",
                          bg: "bg-slate-800"
                      }
                  ].map((item, idx) => (
                      <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ delay: idx * 0.2, duration: 0.6 }}
                          className={`${item.bg} p-8 lg:p-10 rounded-3xl border border-slate-700 relative overflow-hidden group`}
                      >
                          <div className="absolute top-0 right-0 p-8 w-40 h-40 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="inline-block px-3 py-1 bg-violet-500/20 text-violet-300 font-bold text-xs rounded-full mb-6">
                              {item.phase}
                          </span>
                          <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                          <p className="text-slate-400 text-lg leading-relaxed">{item.desc}</p>
                      </motion.div>
                  ))}
              </div>
          </div>
      </section>

      {/* 6. 기대 효과 */}
      <section className="py-24 bg-white">
          <div className="w-full max-w-[1000px] mx-auto px-4">
              <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={staggerContainer}
                  className="text-center mb-16"
              >
                  <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-serif font-black text-slate-900 break-keep">
                      광고주가 얻는 <span className="text-rose-500 bg-rose-50 px-2 rounded-lg">결과</span>
                  </motion.h2>
              </motion.div>

              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                  {[
                      { title: "다수 숏폼 콘텐츠 확보", icon: Play },
                      { title: "자연 노출 발생", icon: Users },
                      { title: "잠재 고객 유입", icon: ChevronRight },
                      { title: "브랜드 인지도 상승", icon: TrendingUp }
                  ].map((item, idx) => (
                      <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ delay: idx * 0.1, duration: 0.4 }}
                          className="flex items-center gap-5 p-6 md:p-8 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-rose-50/50 hover:border-rose-100 transition-colors"
                      >
                          <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                              <item.icon className="w-6 h-6 md:w-7 md:h-7 text-slate-700" />
                          </div>
                          <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                              {item.title}
                          </h3>
                      </motion.div>
                  ))}
              </div>
          </div>
      </section>

      {/* 7. 차별화 (왜 다온뷰인가) */}
      <section className="py-24 bg-slate-50 border-y border-slate-200/60">
          <div className="w-full max-w-[1200px] mx-auto px-4">
              <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={staggerContainer}
                  className="text-center mb-16"
              >
                  <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-serif font-black text-slate-900 tracking-tight break-keep">
                      왜 다온뷰인가
                  </motion.h2>
              </motion.div>

              <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6">
                  {[
                      { 
                        top: "구조", 
                        title: "조회수 나오는\n숏폼 체험단 구조", 
                        desc: "기획 → 촬영 → 업로드까지\n전환 중심 설계",
                        bg: "from-rose-100/50 to-white", 
                        textColor: "text-rose-600" 
                      },
                      { 
                        top: "전문성", 
                        title: "화장품 숏폼\n검증 포맷 제공", 
                        desc: "성분/효과 중심 콘텐츠 구조로\n이탈률 최소화",
                        bg: "from-violet-100/50 to-white", 
                        textColor: "text-violet-600" 
                      },
                      { 
                        top: "성과", 
                        title: "조회수 아닌\n‘구매 전환’ 기준 운영", 
                        desc: "단순 노출이 아닌\n실제 판매 연결 구조",
                        bg: "from-orange-100/50 to-white", 
                        textColor: "text-orange-600" 
                      }
                  ].map((item, idx) => (
                      <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ delay: idx * 0.15, duration: 0.6 }}
                          className={`flex-1 rounded-3xl p-1 bg-gradient-to-b ${item.bg} border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300`}
                      >
                          <div className="bg-white/90 backdrop-blur-md rounded-[22px] p-8 lg:p-10 h-full flex flex-col items-center justify-center text-center">
                              <span className={`inline-block px-3 py-1 bg-slate-50 border border-slate-100 rounded-full font-bold mb-5 tracking-widest text-[13px] ${item.textColor}`}>{item.top}</span>
                              <h3 className="text-[22px] lg:text-[24px] font-extrabold text-slate-900 mb-4 whitespace-pre-line break-keep leading-snug">{item.title}</h3>
                              <p className="text-slate-600 font-medium whitespace-pre-line break-keep leading-relaxed text-[15px]">{item.desc}</p>
                          </div>
                      </motion.div>
                  ))}
              </div>
          </div>
      </section>

      {/* 8. 상품 구조 */}
      <section className="py-24 bg-white">
          <div className="w-full max-w-[1000px] mx-auto px-4">
              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                  {[
                      { 
                        title: "소형 체험단 (10명)", 
                        features: ["콘텐츠 10개 생성", "초기 테스트용"], 
                        target: "신제품 런칭",
                        btn: "→ 테스트 시작하기",
                        best: false 
                      },
                      { 
                        title: "중형 체험단 (30명)", 
                        features: ["콘텐츠 30개 생성", "노출 확산 구조"], 
                        target: "본격 마케팅",
                        btn: "→ 가장 많이 선택",
                        best: true 
                      },
                      { 
                        title: "커스텀 진행", 
                        features: ["맞춤 기획", "지역/타겟 설정"], 
                        target: null,
                        btn: "→ 상담 요청",
                        best: false 
                      }
                  ].map((item, idx) => (
                      <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ delay: idx * 0.1 }}
                          className={`relative rounded-3xl p-6 lg:p-8 flex flex-col items-center text-center border-2 transition-all duration-300 ${
                              item.best 
                              ? 'bg-rose-50 border-rose-200 shadow-[0_10px_40px_-5px_rgba(244,63,94,0.15)] -translate-y-2' 
                              : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'
                          }`}
                      >
                          {item.best && (
                              <div className="absolute -top-4 bg-gradient-to-r from-rose-500 to-rose-400 text-white font-bold text-sm px-4 py-1.5 rounded-full shadow-md tracking-wider">
                                  BEST
                              </div>
                          )}
                          <ShoppingBag className={`w-12 h-12 mb-5 ${item.best ? 'text-rose-500' : 'text-slate-400'}`} />
                          <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 w-full border-b border-slate-200/60 pb-5">{item.title}</h3>
                          
                          <div className="flex-1 flex flex-col items-center gap-3 w-full mb-8">
                             {item.features.map((feat, i) => (
                                <div key={i} className="flex items-center gap-2 text-slate-700 font-medium">
                                  <CheckCircle2 className={`w-5 h-5 ${item.best ? 'text-rose-400' : 'text-slate-400'}`} />
                                  <span>{feat}</span>
                                </div>
                             ))}
                             {item.target && (
                                <div className="mt-4 w-full text-[13px] bg-white border border-slate-200 py-2.5 rounded-xl text-slate-600 font-bold shadow-sm">
                                  추천 대상: <span className={item.best ? 'text-rose-600' : 'text-slate-800'}>{item.target}</span>
                                </div>
                             )}
                          </div>

                          <a 
                              href="#consulting-form"
                              onClick={scrollToForm}
                              className={`mt-auto w-full py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center min-h-[44px] ${
                                  item.best 
                                  ? 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white shadow-md' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                          >
                              {item.btn}
                          </a>
                      </motion.div>
                  ))}
              </div>
          </div>
      </section>

      {/* 9. CTA (마지막) */}
      <section className="py-24 relative overflow-hidden bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-900/40 to-violet-900/40 opacity-80 mix-blend-multiply"></div>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-rose-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>

          <div className="w-full max-w-[800px] mx-auto px-4 relative z-10 text-center">
              <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
              >
                  <h2 className="text-3xl md:text-5xl lg:text-5xl font-serif font-black text-white mb-10 leading-normal tracking-tight">
                      지금 숏폼 체험단으로 <br className="hidden md:block"/>브랜드를 노출하세요
                  </h2>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <a 
                          href="#consulting-form"
                          onClick={scrollToForm}
                          className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-400 hover:to-rose-300 text-white rounded-2xl font-bold text-xl shadow-[0_10px_30px_-5px_rgba(244,63,94,0.4)] hover:shadow-[0_15px_40px_-5px_rgba(244,63,94,0.6)] transition-all hover:-translate-y-1 min-h-[44px] flex items-center justify-center"
                      >
                          무료 상담 신청
                      </a>
                      <a 
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="w-full sm:w-auto px-10 py-5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-white rounded-2xl font-bold text-xl transition-all hover:-translate-y-1 min-h-[44px] flex items-center justify-center cursor-default"
                      >
                          포트폴리오 보기
                      </a>
                  </div>
              </motion.div>
          </div>
      </section>

    </div>
  );
}
