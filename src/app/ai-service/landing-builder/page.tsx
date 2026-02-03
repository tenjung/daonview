'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLandingPageStore } from '@/store/landingPageStore';
import { InputForm } from '@/components/ai-service/landing-builder/InputForm';
import { PreviewDialog } from '@/components/ai-service/landing-builder/PreviewDialog';
import { AuthGuardDialog } from '@/components/auth/AuthGuardDialog';
import { LandingPageInput } from '@/types/landingPage';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function LandingBuilderPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const {
    generatedContent,
    isGenerating,
    previewMode,
    setIsGenerating,
    setGeneratedContent,
    setPreviewMode,
    resetBuilder,
  } = useLandingPageStore();

  // 인증 체크
  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">로그인이 필요합니다</h1>
            <p className="text-text-secondary mb-6">
              AI 랜딩페이지 빌더를 사용하려면 로그인해주세요.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:shadow-lg transition-all"
            >
              로그인하기
            </button>
          </div>
        </div>
        <AuthGuardDialog 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </>
    );
  }

  const handleGenerate = async (input: LandingPageInput) => {
    setIsGenerating(true);
    
    try {
      const res = await fetch('/api/ai/generate-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'AI 생성 실패');
      }

      const data = await res.json();
      setGeneratedContent(data.content);
      setIsPreviewOpen(true); // 프리뷰 다이얼로그 열기
      toast.success('AI 랜딩페이지가 생성되었습니다!');
    } catch (error: any) {
      console.error('생성 오류:', error);
      toast.error(error.message || 'AI 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) {
      toast.error('생성된 콘텐츠가 없습니다.');
      return;
    }

    setIsSaving(true);

    try {
      // 제목 생성 (hero headline 사용)
      const title = generatedContent.hero.headline.substring(0, 100);

      console.log('저장 시작:', { title });

      const res = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          inputData: {}, // 필요시 저장
          generatedContent,
          published: true,
        }),
      });

      console.log('API 응답 상태:', res.status);

      if (!res.ok) {
        const error = await res.json();
        console.error('저장 실패:', error);
        throw new Error(error.error || '저장 실패');
      }

      const data = await res.json();
      console.log('저장 성공:', data);
      
      const slug = data.landingPage.slug;

      if (!slug) {
        throw new Error('slug가 생성되지 않았습니다.');
      }

      toast.success(`랜딩페이지가 저장되었습니다!`);
      
      // 다이얼로그 닫기
      setIsPreviewOpen(false);
      
      // 짧은 지연 후 페이지 이동
      setTimeout(() => {
        console.log('페이지 이동:', `/lp/${slug}`);
        router.push(`/lp/${slug}`);
        resetBuilder();
      }, 500);
    } catch (error: any) {
      console.error('저장 오류:', error);
      toast.error(error.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/ai-service')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    AI 랜딩페이지 빌더
                  </span>
                </h1>
                <p className="text-sm text-text-secondary">
                  1분 안에 전문적인 랜딩페이지를 생성하세요
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="text-primary" size={16} />
              <span className="text-sm font-bold text-primary">
                Powered by DAON AI
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 - 단일 컬럼 레이아웃 */}
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <span className="text-2xl font-black text-primary">1</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">정보 입력</h2>
              <p className="text-text-secondary">
                인플루언서 또는 사업자 정보를 입력하면 AI가 자동으로 랜딩페이지를 생성합니다
              </p>
            </div>

            <InputForm onGenerate={handleGenerate} isGenerating={isGenerating} />
          </div>

          {/* 생성 완료 후 안내 */}
          {generatedContent && (
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-green-800 font-semibold mb-3">
                ✨ AI 랜딩페이지가 생성되었습니다!
              </p>
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="px-6 py-3 rounded-lg bg-primary text-white font-bold hover:shadow-lg transition-all"
              >
                프리뷰 다시 보기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 프리뷰 다이얼로그 */}
      <PreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        content={generatedContent}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
