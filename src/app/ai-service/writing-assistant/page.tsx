"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Types & Utils
import { ToneType, VerifiedInfo, RecommendedKeyword, RecommendedTitle, TopicType, ContentCategory } from "@/types/writing-assistant";
import { calculateSEOScore } from "@/lib/utils/seoCalculator";
import { useAuthStore } from "@/store/authStore";
import { resizeImage } from "@/lib/utils/imageUtils";

// Components
import { AuthGuardDialog } from "@/components/auth/AuthGuardDialog";
import InputSection from "@/components/ai-service/writing-assistant/InputSection";
import LoadingOverlay from "@/components/ai-service/writing-assistant/LoadingOverlay";
import AnalysisReport from "@/components/ai-service/writing-assistant/AnalysisReport";
import ResultView from "@/components/ai-service/writing-assistant/ResultView";

export default function WritingAssistantPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Stage: 0=Input, 1=Analyzing, 2=Review(Keywords/Title), 3=Generating, 4=Result
  const [stage, setStage] = useState(0);

  // Inputs
  const [selectedTopic, setSelectedTopic] = useState<TopicType>("VISIT_REVIEW");
  const [storeName, setStoreName] = useState("");
  const [menuItems, setMenuItems] = useState("");
  const [memo, setMemo] = useState("");
  const [campaignGuide, setCampaignGuide] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [guideImages, setGuideImages] = useState<File[]>([]);

  // Selection state for Report
  const [editableKeywords, setEditableKeywords] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ContentCategory[]>([]);
  const [selectedTone, setSelectedTone] = useState<ToneType>("FRIENDLY_GUIDE");

  // AI results
  const [keywords, setKeywords] = useState<RecommendedKeyword[]>([]);
  const [titles, setTitles] = useState<RecommendedTitle[]>([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [category, setCategory] = useState("");
  const [verifiedInfo, setVerifiedInfo] = useState<VerifiedInfo | null>(null);
  const [placeList, setPlaceList] = useState<VerifiedInfo[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  // Final Output
  const [generatedContent, setGeneratedContent] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [seoReport, setSeoReport] = useState<{ totalScore: number; issues: string[]; wellDone: string[] } | null>(null);

  // Auth check
  useEffect(() => {
    if (!isUserLoading && !user) {
      setIsAuthModalOpen(true);
    }
  }, [user, isUserLoading]);

  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
    router.push('/ai-service');
  };


  // Prevent accidental exit
  useEffect(() => {
    const hasData = stage > 0 || storeName.length > 0 || imageFiles.length > 0;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasData) {
        e.preventDefault();
        e.returnValue = ''; // 현대 브라우저는 커스텀 메시지를 표시하지 않지만, 기본 경고창을 띄우기 위해 필요합니다.
        return e.returnValue;
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (hasData) {
        if (!confirm("작성 중인 정보가 모두 사라집니다. 정말 뒤로 가시겠습니까?")) {
          // 뒤로가기를 취소하기 위해 다시 현재 상태를 히스토리에 넣음
          window.history.pushState(null, '', window.location.href);
        } else {
          // 실제 뒤로가기 실행
          window.removeEventListener('popstate', handlePopState);
          router.back();
        }
      }
    };

    // 데이터가 있을 때만 히스토리 제어 이벤트 리스너 등록
    if (hasData) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [stage, storeName, imageFiles.length, router]);

  // Scroll to result when generated
  useEffect(() => {
    if (stage === 4 && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [stage]);

  const handleVerifyPlace = async () => {
    if (!storeName) return;
    setIsVerifying(true);
    setVerifiedInfo(null);
    setPlaceList([]);
    try {
      const res = await fetch("/api/ai-service/write", {
        method: "POST",
        body: JSON.stringify({ action: "verify-place", storeName }),
      });
      const data = await res.json();

      if (data.placeList && data.placeList.length > 0) {
        setPlaceList(data.placeList);
        if (data.placeList.length === 1) {
          setVerifiedInfo(data.placeList[0]);
          toast.success("매장 정보를 성공적으로 확인했습니다.");
        } else {
          toast.info(`${data.placeList.length}개의 매장이 검색되었습니다. 목록에서 선택해주세요.`);
        }
      } else {
        toast.error("일치하는 매장 정보를 찾지 못했습니다.");
      }
    } catch (error) {
      toast.error("매장 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectPlace = (place: VerifiedInfo) => {
    setVerifiedInfo(place);
    toast.success(`${place.name}이(가) 선택되었습니다.`);
  };

  const handleAnalyze = async () => {
    if (!storeName || !menuItems) {
      toast.error("매장명과 메뉴 정보를 입력해주세요.");
      return;
    }

    setStage(1);
    setLoadingMsg("AI가 정보를 수집하고 최적의 키워드를 분석 중입니다...");

    try {
      const guideImagesB64 = await Promise.all(guideImages.map(img => resizeImage(img)));
      const res = await fetch("/api/ai-service/write", {
        method: "POST",
        body: JSON.stringify({
          action: "analyze",
          selectedTopic,
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
      setEditableKeywords(data.keywords.map((k: RecommendedKeyword) => k.keyword));

      setStage(2);
      toast.success("상세 분석이 완료되었습니다!");
    } catch (error: any) {
      setStage(0);
      toast.error(error.message || "분석 중 오류가 발생했습니다.");
    }
  };

  const handleGenerate = async () => {
    if (!selectedTitle) {
      toast.error("마음에 드는 제목을 선택해주세요.");
      return;
    }

    setStage(3);
    setLoadingMsg("선택하신 정보를 바탕으로 SEO 최적화된 블로그 글을 작성 중입니다...");

    try {
      const [guideImagesB64, postImagesB64] = await Promise.all([
        Promise.all(guideImages.map(img => resizeImage(img))),
        Promise.all(imageFiles.map(img => resizeImage(img)))
      ]);

      const res = await fetch("/api/ai-service/write", {
        method: "POST",
        body: JSON.stringify({
          action: "generate",
          selectedTopic,
          storeName,
          menuItems,
          memo,
          campaignGuide,
          guideImages: guideImagesB64,
          postImages: postImagesB64,
          selectedTitle,
          verifiedInfo,
          imageCount: imageFiles.length,
          selectedCategories,
          selectedTone,
          editableKeywords,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGeneratedContent(data.content);
      setMetaDescription(data.meta_description);
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
    setVerifiedInfo(null);
  };

  return (
    <div className="container max-w-7xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto space-y-12 pb-20">

        <InputSection
          stage={stage}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          storeName={storeName}
          setStoreName={setStoreName}
          menuItems={menuItems}
          setMenuItems={setMenuItems}
          campaignGuide={campaignGuide}
          setCampaignGuide={setCampaignGuide}
          guideImages={guideImages}
          setGuideImages={setGuideImages}
          memo={memo}
          setMemo={setMemo}
          imageFiles={imageFiles}
          setImageFiles={setImageFiles}
          handleAnalyze={handleAnalyze}
          verifiedInfo={verifiedInfo}
          placeList={placeList}
          handleVerifyPlace={handleVerifyPlace}
          handleSelectPlace={handleSelectPlace}
          isVerifying={isVerifying}
        />

        <LoadingOverlay
          isLoading={stage === 1 || stage === 3}
          loadingMsg={loadingMsg}
        />

        <AnalysisReport
          stage={stage}
          editableKeywords={editableKeywords}
          setEditableKeywords={setEditableKeywords}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedTone={selectedTone}
          setSelectedTone={setSelectedTone}
          titles={titles}
          selectedTitle={selectedTitle}
          setSelectedTitle={setSelectedTitle}
          handleGenerate={handleGenerate}
        />

        <div ref={resultRef}>
          <ResultView
            stage={stage}
            seoReport={seoReport}
            generatedContent={generatedContent}
            metaDescription={metaDescription}
            imageFiles={imageFiles}
            copyToClipboard={copyToClipboard}
            resetProcess={resetProcess}
            handleGenerate={handleGenerate}
          />
        </div>

        <AuthGuardDialog
          isOpen={isAuthModalOpen}
          onClose={handleAuthModalClose}
        />
      </div>
    </div>
  );
}
