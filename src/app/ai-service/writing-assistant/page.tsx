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
  { value: "VISIT_REVIEW", label: "배경공 (방문 후기)", icon: "🏪" },
  { value: "PRODUCT_REVIEW", label: "제품공 (제품 리뷰)", icon: "📦" },
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 border-b border-border pb-8">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/20">
            <Wand2 size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-main">AI 블로그 글작성 도우미</h1>
            <p className="text-text-secondary">팩트 기반의 SEO 최적화 포스팅 작성을 지원합니다.</p>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {[0, 2, 4].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                stage >= s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {idx + 1}
              </div>
              {idx < 2 && (
                <div className={`w-8 h-0.5 mx-1 ${stage > s ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Left Side: Controller Area */}
        <div className="space-y-8">
          {/* Step 1: Input */}
          <section className={`bg-white border rounded-3xl p-8 shadow-sm transition-all duration-500 ${stage > 0 ? 'opacity-60 grayscale-[0.5]' : 'border-primary/20 shadow-primary/5'}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold shadow-lg shadow-primary/20 text-xl">01</div>
              <div>
                <h2 className="text-2xl font-black text-text-main">포스팅 작성 설정</h2>
                <p className="text-xs text-text-secondary">가이드와 정보를 기반으로 AI가 글을 설계합니다.</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Topic Selection (NEW) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">어떤 내용의 블로그 글을 작성하고 싶으신가요? <span className="text-primary">*</span></label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {TOPIC_OPTIONS.map((topic) => (
                    <button
                      key={topic.value}
                      type="button"
                      onClick={() => setSelectedTopic(topic.value)}
                      disabled={stage > 0}
                      className={`px-2 py-2 rounded-xl border-2 transition-all text-center ${
                        selectedTopic === topic.value
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-gray-200 hover:border-primary/40 bg-white'
                      } ${stage > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="text-xl mb-1">{topic.icon}</div>
                      <div className="text-[10px] font-bold text-text-main leading-tight">{topic.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. Posting Guide Section (TOP) */}
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <BarChart3 size={16} className="text-primary" /> 포스팅 가이드
                  </h3>
                  <span className="text-[10px] bg-rose-50 text-rose-500 border border-rose-100 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 animate-in fade-in duration-1000">
                    <AlertCircle size={12} /> 휘발성 데이터 (세션 종료 시 자동 삭제)
                  </span>
                </div>
                <textarea
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/5 min-h-[80px] outline-none text-sm transition-all"
                  placeholder="업체에서 원하는 가이드 문구를 복사해서 붙여넣으세요. (키워드, 강조점 등)"
                  value={campaignGuide}
                  onChange={(e) => setCampaignGuide(e.target.value)}
                  disabled={stage > 0}
                />
                <ImageUploader 
                  images={guideImages} 
                  onImagesChange={setGuideImages} 
                  maxImages={3}
                />
                <p className="text-[10px] text-gray-400 pl-1 italic">※ 가이드 이미지를 올리면 AI가 비전 기술로 분석하여 반영합니다.</p>
              </div>

              {/* Separator Line */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                <Sparkles size={14} className="text-gray-200" />
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              </div>

              {/* 2. Store & Product Info Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">매장명 / 제품명 <span className="text-primary">*</span></label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all outline-none text-sm"
                      placeholder="예: 다온뷰 카페, 프리미엄 알부민"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      disabled={stage > 0}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">핵심 경험 (메뉴/제품명) <span className="text-primary">*</span></label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all outline-none text-sm"
                    placeholder="아이스 라떼, 영양제 등"
                    value={menuItems}
                    onChange={(e) => setMenuItems(e.target.value)}
                    disabled={stage > 0}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">메모 (선택사항)</label>
                  <textarea
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary min-h-[60px] outline-none text-sm"
                    placeholder="강조하고 싶은 점이나 특이사항을 적어주세요."
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    disabled={stage > 0}
                  />
                </div>

                {/* Blog Post Images (The actual photos for the post) */}
                <div className="pt-4 border-t border-gray-50">
                  <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <ImageIcon size={16} className="text-primary" /> 포스팅 첨부 이미지
                  </label>
                  <ImageUploader 
                    images={imageFiles} 
                    onImagesChange={setImageFiles} 
                    maxImages={10}
                  />
                </div>
              </div>

              {stage === 0 && (
                <button
                  onClick={handleAnalyze}
                  className="w-full py-5 bg-primary text-white rounded-[1.25rem] font-black text-lg hover:bg-primary/90 transition-all transform hover:-translate-y-1 shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
                >
                  <Search size={24} />
                  AI 분석 및 추천 시작하기
                </button>
              )}
            </div>
          </section>


          {/* Step 2: Recommendations */}
          {stage >= 2 && (
            <section className="bg-white border-2 border-primary/20 rounded-3xl p-8 shadow-xl shadow-primary/5 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-lg shadow-primary/20">02</div>
                  <h2 className="text-xl font-bold">AI 분석 리포트</h2>
                </div>
                {verifiedInfo?.isVerified && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                    <CheckCircle2 size={14} /> 사실 검증됨
                  </div>
                )}
              </div>

              <div className="space-y-8">
                {/* Editable Keywords */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                      <BarChart3 size={16} className="text-primary" /> SEO 키워드 / 해시태그
                    </h3>
                    <button
                      onClick={() => {
                        const newKeyword = prompt('추가할 키워드를 입력하세요:');
                        if (newKeyword && newKeyword.trim()) {
                          setEditableKeywords([...editableKeywords, newKeyword.trim()]);
                        }
                      }}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
                    >
                      + 추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editableKeywords.map((keyword, i) => (
                      <div
                        key={i}
                        className="group relative px-4 py-2 rounded-xl text-[12px] font-bold border bg-primary/5 border-primary/20 text-primary flex items-center gap-2"
                      >
                        # {keyword}
                        <button
                          onClick={() => setEditableKeywords(editableKeywords.filter((_, idx) => idx !== i))}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">* 키워드를 클릭하면 수정할 수 있습니다. '+ 추가' 버튼으로 새 키워드를 입력하세요.</p>
                </div>

                {/* Content Category Selection */}
                <div>
                  <h3 className="text-sm font-bold text-text-main mb-4">글의 의도가 무엇인지 카테고리 복수선택가능</h3>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          if (selectedCategories.includes(cat)) {
                            setSelectedCategories(selectedCategories.filter(c => c !== cat));
                          } else {
                            setSelectedCategories([...selectedCategories, cat]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedCategories.includes(cat)
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone Selection */}
                <div>
                  <h3 className="text-sm font-bold text-text-main mb-4">톤앤매너 설정</h3>
                  <div className="space-y-2">
                    {TONE_OPTIONS.map((tone) => (
                      <button
                        key={tone.value}
                        type="button"
                        onClick={() => setSelectedTone(tone.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          selectedTone === tone.value
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-gray-200 hover:border-primary/40 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-sm text-text-main mb-1">{tone.label}</div>
                            <div className="text-xs text-gray-500">{tone.description}</div>
                          </div>
                          {selectedTone === tone.value && (
                            <CheckCircle2 size={20} className="text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title Selection & Editing */}
                <div>
                  <h3 className="text-sm font-bold text-text-main mb-4">클릭을 부르는 제목 선택 및 수정</h3>
                  <div className="space-y-3">
                    {titles.map((t, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedTitle(t.title)}
                        className={`group relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedTitle === t.title 
                            ? 'border-primary bg-primary/5 shadow-inner' 
                            : 'border-gray-100 hover:border-primary/40 bg-gray-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-sm font-bold text-text-main leading-snug">{t.title}</p>
                          <div className={`shrink-0 px-2 py-1 rounded text-[10px] font-black ${
                             t.seo_score >= 90 ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'
                          }`}>
                            BEST
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedTitle && (
                    <div className="mt-6 p-5 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-[11px] font-black text-primary uppercase tracking-widest mb-2">최종 발행 제목 수정</label>
                      <input 
                        type="text"
                        value={selectedTitle}
                        onChange={(e) => setSelectedTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-primary/20 focus:border-primary outline-none font-bold text-text-main shadow-sm"
                        placeholder="제목을 직접 수정해보세요."
                      />
                      <p className="text-[10px] text-primary/60 mt-2 font-medium">※ 선택한 제목을 내 블로그 스타일에 맞게 자유롭게 수정하세요.</p>
                    </div>
                  )}
                </div>

                {stage === 2 && (
                  <button
                    onClick={handleGenerate}
                    className="w-full py-5 bg-text-main text-white rounded-[1.25rem] font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-3 shadow-2xl shadow-gray-200"
                  >
                    <PenTool size={22} />
                    원고 생성하기
                  </button>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Side: Output Panel */}
        <div className="relative">
          <div className="sticky top-12">
            <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] flex flex-col min-h-[700px] max-h-[90vh] shadow-2xl overflow-hidden shadow-gray-200/50">
              <div className="p-6 border-b border-gray-50 bg-white/80 backdrop-blur-md flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-400" />
                   <div className="w-2 h-2 rounded-full bg-yellow-400" />
                   <div className="w-2 h-2 rounded-full bg-green-400" />
                   <h3 className="font-bold text-text-main ml-3 flex items-center gap-2">
                     <Sparkles size={18} className="text-primary" />
                     미리보기
                   </h3>
                </div>
                {stage === 4 && (
                  <div className="flex gap-2">
                    <button onClick={resetProcess} className="p-2.5 text-gray-400 hover:text-primary transition-colors">
                        <RefreshCw size={20} />
                    </button>
                    <button 
                      onClick={copyToClipboard} 
                      className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    >
                      <Copy size={16} /> 복사하기
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 p-10 overflow-y-auto bg-[#fafafa]">
                {stage < 2 && stage !== 1 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-6 opacity-60">
                    <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center border-4 border-dashed border-gray-100">
                      <FileText size={40} />
                    </div>
                    <p className="text-center font-medium">정보를 입력하고 분석을 시작하세요.</p>
                  </div>
                )}

                {(stage === 1 || stage === 3) && (
                  <div className="h-full flex flex-col items-center justify-center gap-8">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-[6px] border-primary/10 border-t-primary animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="text-primary animate-pulse" size={24} />
                      </div>
                    </div>
                    <div className="text-center space-y-3">
                      <p className="text-xl font-black text-text-main">AI 전문가가 설계 중...</p>
                      <p className="text-sm text-text-secondary max-w-[250px] mx-auto leading-relaxed">{loadingMsg}</p>
                    </div>
                  </div>
                )}

                {stage === 2 && (
                  <div className="h-full flex flex-col items-center justify-start py-8">
                     <div className="w-full bg-white/50 border border-gray-100 rounded-3xl p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                          <h3 className="font-bold text-text-main flex items-center gap-2">
                             <MapPin size={18} className="text-primary" /> 네이버 플레이스 연동 정보
                          </h3>
                          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold">LIVE SYNC</span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-5">
                          {/* 매장명 재검색 섹션 */}
                          <div>
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 block">
                              매장명 (검색결과: {verifiedInfo?.name || "미매칭"})
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input 
                                  type="text"
                                  value={storeName}
                                  onChange={(e) => setStoreName(e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm font-bold bg-white"
                                  placeholder="매장명이 틀리다면 수정 후 재검색하세요."
                                />
                                <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                              </div>
                              <button 
                                onClick={handleAnalyze}
                                className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors flex items-center gap-2 text-xs font-bold shrink-0"
                              >
                                <RefreshCw size={14} />
                                재검색
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 block">매장 주소 (조회 전용)</label>
                            <input 
                              type="text"
                              value={verifiedInfo?.address || ""}
                              readOnly
                              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-500 outline-none text-sm font-medium cursor-not-allowed"
                              placeholder="주소 정보 없음"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 block">영업 시간 (조회 전용)</label>
                            <input 
                              type="text"
                              value={verifiedInfo?.hours || ""}
                              readOnly
                              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-500 outline-none text-sm font-medium cursor-not-allowed"
                              placeholder="영업시간 정보 없음"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 block">전화번호</label>
                               <input 
                                 type="text"
                                 value={verifiedInfo?.phone || ""}
                                 readOnly
                                 className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-500 outline-none text-sm font-medium cursor-not-allowed"
                               />
                            </div>
                            <div>
                               <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 block">카테고리</label>
                               <input 
                                 type="text"
                                 value={verifiedInfo?.category || ""}
                                 readOnly
                                 className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-500 outline-none text-sm font-medium cursor-not-allowed"
                               />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl flex items-start gap-3">
                           <AlertCircle size={16} className="text-gray-400 mt-0.5 shrink-0" />
                           <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                              네이버 플레이스에 연동된 실제 정보를 불러옵니다. 매장명이 실제와 다를 경우 위 '매장명'을 수정하여 다시 검색해 주세요.
                           </p>
                        </div>
                     </div>
                  </div>
                )}

                {stage === 4 && (
                  <div className="animate-in fade-in duration-1000">
                    {/* Meta Description Banner */}
                    <div className="mb-10 bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl">
                       <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2 block text-center">Meta Description (SEO)</span>
                       <p className="text-sm text-text-secondary leading-relaxed text-center italic">"{metaDescription}"</p>
                    </div>

                    <div className="prose prose-slate max-w-none text-text-main leading-relaxed tracking-tight">
                      {generatedContent.split('\n').map((line, i) => {
                        if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-black mb-10 pb-6 border-b-2 border-gray-100">{line.replace('# ', '')}</h1>;
                        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-12 mb-6 text-primary flex items-center gap-2"><div className="w-1 h-6 bg-primary rounded-full" /> {line.replace('## ', '')}</h2>;
                        if (line.includes('[사진:')) return <div key={i} className="my-10 aspect-video bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-3">
                            <BarChart3 size={30} />
                            <span className="text-sm font-medium">{line}</span>
                            <span className="text-[11px] opacity-70">권장 사이즈: 1200 x 800</span>
                        </div>;
                        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-lg mb-4">{line.replace(/\*\*/g, '')}</p>;
                        if (line.trim() === '---') return <div key={i} className="my-12 flex items-center gap-4"><div className="flex-1 h-[1px] bg-gray-100"/><div className="w-1.5 h-1.5 rounded-full bg-gray-200"/><div className="flex-1 h-[1px] bg-gray-100"/></div>;
                        return <p key={i} className="mb-6 indent-1">{line}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Float Action - Detailed SEO Report */}
            {stage === 4 && seoReport && (
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 hidden xl:block animate-in slide-in-from-right duration-500 w-72">
                <div className="bg-white p-6 rounded-3xl shadow-2xl border border-primary/10 flex flex-col gap-6">
                  <div className="text-center">
                    <span className="text-[10px] font-black text-text-secondary tracking-widest uppercase mb-1 block">Your SEO Score</span>
                    <div className="text-5xl font-black text-primary drop-shadow-sm">{seoReport.totalScore}</div>
                  </div>

                  <div className="space-y-4">
                    {seoReport.wellDone.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-black text-green-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                          <CheckCircle2 size={12} /> 잘 된 점
                        </h4>
                        <div className="space-y-1.5">
                          {seoReport.wellDone.map((item, idx) => (
                            <div key={idx} className="text-[11px] leading-relaxed text-text-secondary bg-green-50/50 p-2 rounded-lg border border-green-100/50">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {seoReport.issues.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-black text-orange-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                          <AlertCircle size={12} /> 개선 제안
                        </h4>
                        <div className="space-y-1.5">
                          {seoReport.issues.map((item, idx) => (
                            <div key={idx} className="text-[11px] leading-relaxed text-text-secondary bg-orange-50/50 p-2 rounded-lg border border-orange-100/50">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      <AuthGuardDialog 
        isOpen={isAuthModalOpen} 
        onClose={handleAuthModalClose} 
      />
    </div>
  );
}
