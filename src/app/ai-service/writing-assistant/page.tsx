"use client";

import { useState, useEffect } from "react";
import { 
  Wand2, PenTool, Sparkles, CheckCircle2, 
  Copy, RefreshCw, Search, MapPin, Clock, 
  ChevronRight, AlertCircle, FileText, BarChart3,
  Image as ImageIcon
} from "lucide-react";

import { toast } from "sonner";
import { ToneType, VerifiedInfo, RecommendedKeyword, RecommendedTitle } from "@/types/writing-assistant";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { AuthGuardDialog } from "@/components/auth/AuthGuardDialog";
import { WritingAssistantResult, TopicType, ContentCategory } from "@/types/writing-assistant";
import { calculateSEOScore } from "@/lib/utils/seoCalculator";
import ImageUploader from "@/components/ai-service/ImageUploader";

// 주제 선택 옵션 (STEP-1)
const TOPIC_OPTIONS: { value: TopicType; label: string; icon: string }[] = [
  { value: "VISIT_REVIEW", label: "방문후기", icon: "🏪" },
  { value: "PRODUCT_REVIEW", label: "제품리뷰", icon: "📦" },
  { value: "TRAVEL", label: "여행", icon: "✈️" },
  { value: "DAILY_LIFE", label: "일상", icon: "☕" },
  { value: "TUTORIAL", label: "튜토리얼", icon: "📚" },
  { value: "INFORMATION", label: "정보성", icon: "💡" },
];

// 글의 카테고리/의도 옵션 (STEP-2)
const CONTENT_CATEGORIES: ContentCategory[] = [
  "정보성", "방문후기/체험기", "제품 리뷰/분석", "튜토리얼",
  "비교/리뷰", "문제 해결 가이드", "교육/설명", "보행/여행기",
  "일상/스토리", "실용/라이프", "공급/홍보", "스타일/패션",
  "인터뷰/대담", "엔터테인먼트/비디오", "IT/컴퓨터", 
  "교육/학습", "라이프/실용"
];

// 톤앤매너 옵션 (STEP-2)
const TONE_OPTIONS = [
  { value: "FRIENDLY_GUIDE" as const, label: "친절한 안내자", description: "독자에게 친절하게 설명하는 톤" },
  { value: "EXPERT_CONCISE" as const, label: "전문가의 간결체", description: "전문적이고 간결한 톤" },
  { value: "CONVERSATIONAL" as const, label: "대화체 친근감", description: "친구와 대화하듯 편안한 톤" },
  { value: "HUMOROUS" as const, label: "유머러스/재치", description: "재치있고 유머러스한 톤" },
  { value: "EMOTIONAL_STORY" as const, label: "감성/스토리", description: "감성적이고 스토리텔링하는 톤" },
];

export default function WritingAssistantPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // 1. 로그인 체크 로직
  useEffect(() => {
    if (!isLoading && !user) {
      setIsAuthModalOpen(true);
    }
  }, [user, isLoading]);

  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
    router.push('/ai-service');
  };

  // Stage: 0=Input, 1=Analyzing, 2=Review(Keywords/Title), 3=Generating, 4=Result
  const [stage, setStage] = useState(0);

  // STEP-1 Inputs
  const [selectedTopic, setSelectedTopic] = useState<TopicType>("VISIT_REVIEW");
  const [storeName, setStoreName] = useState("");
  const [menuItems, setMenuItems] = useState("");
  const [memo, setMemo] = useState("");
  const [campaignGuide, setCampaignGuide] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [guideImages, setGuideImages] = useState<File[]>([]);

  // STEP-2 Inputs
  const [editableKeywords, setEditableKeywords] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ContentCategory[]>([]);
  const [selectedTone, setSelectedTone] = useState<ToneType>("FRIENDLY_GUIDE");

  // AI Analysis Results

  const [keywords, setKeywords] = useState<RecommendedKeyword[]>([]);

  const [titles, setTitles] = useState<RecommendedTitle[]>([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [category, setCategory] = useState("");
  const [verifiedInfo, setVerifiedInfo] = useState<VerifiedInfo | null>(null);

  // Final Output
  const [generatedContent, setGeneratedContent] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [seoReport, setSeoReport] = useState<{ totalScore: number; issues: string[]; wellDone: string[] } | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // 이탈 방지 경고 (STEP-3 완성 후)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (stage === 4 && generatedContent) {
        e.preventDefault();
        e.returnValue = '첨부한 사진과 작성 컨텐츠는 회원 이탈시 초기화 됩니다.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [stage, generatedContent]);

  // Handler: Analyze Input
  const handleAnalyze = async () => {
    if (!storeName || !menuItems) {
      toast.error("매장명과 메뉴 정보를 입력해주세요.");
      return;
    }
    
    setStage(1);
    setLoadingMsg("AI가 정보를 수집하고 최적의 키워드를 분석 중입니다...");

    try {
      // 가이드 이미지 베이스64 변환
      const guideImagesB64 = await Promise.all(
        guideImages.map(img => fileToBase64(img))
      );

      const res = await fetch("/api/ai-service/write", {
        method: "POST",
        body: JSON.stringify({ 
          action: "analyze", 
          selectedTopic, // NEW: 주제 선택 전달
          storeName, 
          menuItems, 
          memo,
          campaignGuide,
          guideImages: guideImagesB64,
          imageCount: imageFiles.length
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setCategory(data.category);
      setKeywords(data.keywords);
      setTitles(data.titles);
      setVerifiedInfo(data.verifiedInfo);
      
      // NEW: AI가 추천한 키워드를 editable 상태로 초기화
      setEditableKeywords(data.keywords.map((k: RecommendedKeyword) => k.keyword));
      
      setStage(2);
      toast.success("상세 분석이 완료되었습니다!");
    } catch (error: any) {
      console.error('Analysis Error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      setStage(0);
      toast.error(error.message || "분석 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    }
  };

  // Handler: Generate Content
  const handleGenerate = async () => {
    if (!selectedTitle) {
      toast.error("마음에 드는 제목을 선택해주세요.");
      return;
    }

    setStage(3);
    setLoadingMsg("선택하신 정보를 바탕으로 SEO 최적화된 블로그 글을 작성 중입니다...");

    try {
      // 가이드 이미지 베이스64 변환
      const guideImagesB64 = await Promise.all(
        guideImages.map(img => fileToBase64(img))
      );

      const res = await fetch("/api/ai-service/write", {
        method: "POST",
        body: JSON.stringify({
          action: "generate",
          selectedTopic, // NEW
          storeName,
          menuItems,
          memo,
          campaignGuide,
          guideImages: guideImagesB64,
          selectedTitle, // 이 값이 수정된 제목
          verifiedInfo,  // 이 값은 수정된 업체 정보
          imageCount: imageFiles.length,
          // NEW: STEP-2 선택 사항
          selectedCategories,
          selectedTone,
          editableKeywords,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setGeneratedContent(data.content);
      setMetaDescription(data.meta_description);
      
      // SEO 점수 계산
      const report = calculateSEOScore(data.content, selectedTitle, editableKeywords);
      setSeoReport(report);
      
      setStage(4);
      toast.success("블로그 초안이 생성되었습니다!");
    } catch (error: any) {
      setStage(2);
      toast.error(error.message || "생성 중 오류가 발생했습니다.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("글이 클립보드에 복사되었습니다!");
  };

  const resetProcess = () => {
    setStage(0);
    setStoreName("");
    setMenuItems("");
    setMemo("");
    setCampaignGuide("");
    setImageFiles([]);
    setGuideImages([]);
    setGeneratedContent("");
    setSelectedTitle("");
    setSeoReport(null);
  };

  return (
    <div className="container max-w-7xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        {/* Step 1: Input & Configuration */}
        <section className={`bg-white border rounded-[2.5rem] p-10 shadow-sm transition-all duration-500 ${stage > 1 ? 'opacity-60 pointer-events-none' : 'border-primary/20 shadow-primary/5'}`}>
          <div className="flex items-center gap-4 mb-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transition-all ${stage >= 0 ? 'bg-primary text-white shadow-primary/20' : 'bg-gray-100 text-gray-400'}`}>01</div>
            <div>
              <h2 className="text-2xl font-black text-text-main">포스팅 작성 설정</h2>
              <p className="text-sm text-text-secondary">어떤 주제로 글을 쓰실지 알려주세요.</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Topic Selection */}
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-primary" /> 작성 주제 선택 <span className="text-primary">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {TOPIC_OPTIONS.map((topic) => (
                  <button
                    key={topic.value}
                    type="button"
                    onClick={() => setSelectedTopic(topic.value)}
                    disabled={stage > 0}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      selectedTopic === topic.value
                        ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                        : 'border-gray-100 hover:border-primary/20 bg-white'
                    } ${stage > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="text-2xl mb-2">{topic.icon}</div>
                    <div className="text-xs font-bold text-text-main">{topic.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Core Info Group */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">매장명 / 제품명 <span className="text-primary">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium"
                    placeholder="예: 다온뷰 카페, 프리미엄 영양제"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    disabled={stage > 0}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">핵심 경험 (메뉴/제품) <span className="text-primary">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium"
                    placeholder="아이스 라떼, 등심 스테이크 등"
                    value={menuItems}
                    onChange={(e) => setMenuItems(e.target.value)}
                    disabled={stage > 0}
                  />
                  <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>
            </div>

            {/* Posting Guide & Memo */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                  업체 가이드 (선택)
                  <span className="text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded-full font-bold">비전 AI 분석</span>
                </label>
                <textarea
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-primary min-h-[120px] outline-none text-sm resize-none"
                  placeholder="업체 가이드나 핵심 키워드를 붙여넣으세요."
                  value={campaignGuide}
                  onChange={(e) => setCampaignGuide(e.target.value)}
                  disabled={stage > 0}
                />
                <ImageUploader images={guideImages} onImagesChange={setGuideImages} maxImages={3} />
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-700">참고 메모 (선택)</label>
                <textarea
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-primary min-h-[120px] outline-none text-sm resize-none"
                  placeholder="글에 반영하고 싶은 개인적인 감상이나 특징을 적어주세요."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  disabled={stage > 0}
                />
                <div className="pt-2">
                  <label className="text-xs font-bold text-gray-500 mb-3 block">포스팅 실제 첨부 이미지 ({imageFiles.length}/10)</label>
                  <ImageUploader images={imageFiles} onImagesChange={setImageFiles} maxImages={10} />
                </div>
              </div>
            </div>

            {stage === 0 && (
              <button
                onClick={handleAnalyze}
                className="w-full py-6 bg-primary text-white rounded-3xl font-black text-xl hover:bg-primary/90 transition-all transform hover:-translate-y-1 shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
              >
                <Wand2 size={24} />
                AI 분석 및 리포트 생성하기
              </button>
            )}
          </div>
        </section>

        {/* Loading State */}
        {(stage === 1 || stage === 3) && (
          <div className="flex flex-col items-center justify-center py-20 gap-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-8 border-primary/10 border-t-primary animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-black text-text-main">AI가 당신의 글을 설계하고 있습니다</h3>
              <p className="text-text-secondary font-medium">{loadingMsg}</p>
            </div>
          </div>
        )}

        {/* Naver Place Verification (Conditional Step 1.5) */}
        {stage >= 2 && selectedTopic === "VISIT_REVIEW" && (
          <section className="bg-indigo-50/30 border border-indigo-100 rounded-[2.5rem] p-10 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-200">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-indigo-900">네이버 플레이스 연동 확인</h3>
                  <p className="text-xs text-indigo-600 font-medium">실제 매장 정보를 바탕으로 정확한 글을 작성합니다.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-[10px] font-black text-indigo-500">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> LIVE SYNC
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-5">
                <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
                  <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-3 block">검색된 매장명</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 focus:border-indigo-500 outline-none text-sm font-bold"
                    />
                    <button onClick={handleAnalyze} className="px-4 bg-indigo-900 text-white rounded-xl hover:bg-black transition-all text-xs font-bold flex items-center gap-2">
                      <RefreshCw size={14} /> 재검색
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-white/50 rounded-2xl flex items-start gap-3 border border-indigo-50">
                  <AlertCircle size={16} className="text-indigo-300 mt-0.5" />
                  <p className="text-[11px] text-indigo-400 leading-relaxed">매장명이 일치하지 않으면 원고에 잘못된 위치 정보가 포함될 수 있습니다.</p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[2rem] border border-indigo-100 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">매장 주소</span>
                    <p className="text-sm font-bold text-gray-700">{verifiedInfo?.address || "주소를 찾을 수 없음"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">전화번호</span>
                      <p className="text-sm font-bold text-gray-700">{verifiedInfo?.phone || "번호 없음"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">영업시간</span>
                      <p className="text-sm font-bold text-gray-700 truncate">{verifiedInfo?.hours || "정보 없음"}</p>
                    </div>
                  </div>
                </div>
                <div className={`py-2 px-4 rounded-xl inline-flex items-center gap-2 text-[10px] font-black ${verifiedInfo?.isVerified ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                  {verifiedInfo?.isVerified ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {verifiedInfo?.isVerified ? '데이터 검증 성공' : '매칭 데이터 없음'}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Step 2: AI Analysis Report */}
        {stage >= 2 && (
          <section className="bg-white border-2 border-primary/20 rounded-[2.5rem] p-10 shadow-xl shadow-primary/5 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20">02</div>
              <div>
                <h2 className="text-2xl font-black text-text-main">AI 분석 리포트</h2>
                <p className="text-sm text-text-secondary">AI가 추천하는 최적의 전략을 확인하고 수정하세요.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-8">
                {/* Keywords */}
                <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-text-main flex items-center gap-2 uppercase tracking-widest">
                      <BarChart3 size={18} className="text-primary" /> SEO Keywords
                    </h3>
                    <button
                      onClick={() => {
                        const val = prompt("추가할 키워드를 입력하세요:");
                        if (val?.trim()) setEditableKeywords([...editableKeywords, val.trim()]);
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-[11px] font-black hover:scale-105 transition-transform"
                    >
                      + ADD NEW
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {editableKeywords.map((kw, i) => (
                      <div key={i} className="group relative px-4 py-2.5 bg-white border border-primary/20 rounded-xl text-xs font-bold text-primary shadow-sm hover:border-primary transition-all">
                        # {kw}
                        <button 
                          onClick={() => setEditableKeywords(editableKeywords.filter((_, idx) => idx !== i))}
                          className="ml-2 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-600"
                        > × </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tone & Categories */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-extrabold text-gray-700 mb-4 block">글의 의도 (중복 선택)</label>
                    <div className="flex flex-wrap gap-2">
                      {CONTENT_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => {
                            if (selectedCategories.includes(cat)) setSelectedCategories(selectedCategories.filter(c => c !== cat));
                            else setSelectedCategories([...selectedCategories, cat]);
                          }}
                          className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                            selectedCategories.includes(cat) ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        > {cat} </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-extrabold text-gray-700 mb-4 block">작성 스타일 (톤앤매너)</label>
                    <div className="grid grid-cols-1 gap-2">
                      {TONE_OPTIONS.map(tone => (
                        <button
                          key={tone.value}
                          onClick={() => setSelectedTone(tone.value)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                            selectedTone === tone.value ? 'border-primary bg-primary/5' : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-bold text-text-main">{tone.label}</div>
                            <div className="text-[11px] text-gray-400">{tone.description}</div>
                          </div>
                          {selectedTone === tone.value && <CheckCircle2 size={18} className="text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Titles */}
                <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10">
                  <h3 className="text-sm font-black text-primary mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <Sparkles size={18} /> 추천 블로그 제목
                  </h3>
                  <div className="space-y-3">
                    {titles.map((t, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedTitle(t.title)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedTitle === t.title ? 'border-primary bg-white shadow-xl scale-[1.02]' : 'border-white bg-white/50 hover:border-primary/20'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-sm font-extrabold text-text-main leading-relaxed">{t.title}</p>
                          <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-1 rounded">BEST</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedTitle && (
                    <div className="mt-8 animate-in fade-in slide-in-from-top-4">
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block text-center">선택된 제목 최종 수정</label>
                      <input 
                        type="text"
                        value={selectedTitle}
                        onChange={(e) => setSelectedTitle(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-primary focus:ring-4 focus:ring-primary/5 outline-none font-bold text-text-main shadow-lg"
                      />
                    </div>
                  )}
                </div>

                {stage === 2 && (
                  <button
                    onClick={handleGenerate}
                    className="w-full py-7 bg-text-main text-white rounded-[2rem] font-black text-2xl hover:bg-black transition-all transform hover:-translate-y-1 shadow-2xl flex items-center justify-center gap-4"
                  >
                    <PenTool size={28} />
                    블로그 원고 완성하기
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Result & SEO Report */}
        {stage === 4 && (
          <section className="space-y-10 animate-in fade-in duration-1000">
            {/* SEO Score Banner */}
            {seoReport && (
              <div className="bg-white border-2 border-primary/20 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                  <div className="text-center md:text-left space-y-2">
                    <h3 className="text-3xl font-black text-text-main">SEO 최적화 검사 결과</h3>
                    <p className="text-text-secondary font-medium">네이버 검색 엔진 노출 확률을 분석했습니다.</p>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-center">
                      <div className="text-6xl font-black text-primary mb-2">{seoReport.totalScore}</div>
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Total SEO Score</div>
                    </div>
                    <div className="h-20 w-[1px] bg-gray-100 hidden md:block" />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-green-600">
                        <CheckCircle2 size={16} /> {seoReport.wellDone.length}개 항목 최적화 완료
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-orange-500">
                        <AlertCircle size={16} /> {seoReport.issues.length}개 개선 제안
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Content Panel */}
            <div className="bg-white border-2 border-gray-100 rounded-[3rem] shadow-2xl shadow-gray-200/50 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-sm font-black text-gray-400 uppercase tracking-widest ml-4">Blog Post Preview</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetProcess} className="p-3 text-gray-400 hover:text-primary transition-colors hover:bg-white rounded-2xl shadow-sm">
                    <RefreshCw size={22} />
                  </button>
                  <button onClick={copyToClipboard} className="px-8 py-3.5 bg-primary text-white rounded-[1.25rem] font-black text-sm flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                    <Copy size={18} /> 원고 전체 복사
                  </button>
                </div>
              </div>

              <div className="p-12 md:p-20">
                <div className="mb-16 pb-16 border-b-2 border-gray-50 text-center">
                  <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] mb-6">Meta Description</p>
                  <p className="text-xl font-bold text-text-secondary leading-relaxed italic max-w-2xl mx-auto">"{metaDescription}"</p>
                </div>

                <div className="prose prose-lg prose-slate max-w-none text-text-main">
                  {generatedContent.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return <h1 key={i} className="text-4xl md:text-5xl font-black mb-12 text-gray-900 leading-tight">{line.replace('# ', '')}</h1>;
                    if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-black mt-16 mb-8 text-primary flex items-center gap-4"><div className="w-2 h-8 bg-primary rounded-full" /> {line.replace('## ', '')}</h2>;
                    if (line.includes('[사진:')) return (
                      <div key={i} className="my-16 aspect-[16/9] bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400 gap-4 group hover:bg-white transition-all">
                        <ImageIcon size={48} className="group-hover:scale-110 transition-transform" />
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-500">{line}</p>
                          <p className="text-xs font-medium text-gray-400 mt-1">포스팅 시 해당 위치에 사진을 삽입하세요.</p>
                        </div>
                      </div>
                    );
                    if (line.trim() === '---') return <div key={i} className="my-20 flex items-center gap-6"><div className="flex-1 h-[1px] bg-gray-100"/><Sparkles size={16} className="text-gray-200"/><div className="flex-1 h-[1px] bg-gray-100"/></div>;
                    return <p key={i} className="mb-8 text-lg leading-relaxed text-gray-700">{line}</p>;
                  })}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
      <AuthGuardDialog isOpen={isAuthModalOpen} onClose={handleAuthModalClose} />
    </div>
  );
}
