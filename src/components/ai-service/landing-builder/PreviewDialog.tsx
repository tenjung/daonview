'use client';

import { AIGeneratedContent } from '@/types/landingPage';
import { HeroSection } from '@/components/lp/HeroSection';
import { StatsSection } from '@/components/lp/StatsSection';
import { PortfolioSection } from '@/components/lp/PortfolioSection';
import { ContactSection } from '@/components/lp/ContactSection';
import { Monitor, Smartphone, X, Save, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface PreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: AIGeneratedContent | null;
  previewMode: 'desktop' | 'mobile';
  onPreviewModeChange: (mode: 'desktop' | 'mobile') => void;
  onSave: () => void;
  isSaving: boolean;
}

export function PreviewDialog({ 
  isOpen,
  onClose,
  content, 
  previewMode, 
  onPreviewModeChange,
  onSave,
  isSaving 
}: PreviewDialogProps) {
  if (!content) return null;

  return (
    <>
      {/* Override Dialog z-index to appear above Navbar (z-100) */}
      <style jsx global>{`
        [data-radix-popper-content-wrapper] {
          z-index: 150 !important;
        }
        [data-state="open"] ~ div[data-radix-portal] {
          z-index: 150 !important;
        }
      `}</style>
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0 flex flex-col" style={{ zIndex: 150 }}>
          {/* 커스텀 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-white rounded-t-lg">
            <DialogTitle className="sr-only">AI 생성 결과 미리보기</DialogTitle>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-text-main">
                  AI 생성 결과 미리보기
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  생성된 랜딩페이지를 확인하고 저장하세요
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* 프리뷰 모드 전환 */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => onPreviewModeChange('desktop')}
                    className={`p-2 rounded-md transition-all ${
                      previewMode === 'desktop'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    title="데스크톱 뷰"
                  >
                    <Monitor size={18} />
                  </button>
                  <button
                    onClick={() => onPreviewModeChange('mobile')}
                    className={`p-2 rounded-md transition-all ${
                      previewMode === 'mobile'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    title="모바일 뷰"
                  >
                    <Smartphone size={18} />
                  </button>
                </div>

                {/* 저장 버튼 */}
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {isSaving ? '저장 중...' : '저장하기'}
                </button>

                {/* 닫기 버튼 */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-600"
                  title="닫기"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* 프리뷰 영역 */}
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            <div 
              className={`mx-auto bg-white shadow-2xl transition-all duration-300 ${
                previewMode === 'mobile' ? 'max-w-[375px]' : 'w-full max-w-[1200px]'
              }`}
              style={{ minHeight: '100%' }}
            >
              <HeroSection hero={content.hero} colorScheme={content.colorScheme} />
              <StatsSection stats={content.stats} colorScheme={content.colorScheme} />
              <PortfolioSection portfolio={content.portfolio} colorScheme={content.colorScheme} />
              <ContactSection contact={content.contact} colorScheme={content.colorScheme} />
            </div>
          </div>

          {/* 하단 안내 */}
          <div className="px-6 py-3 border-t border-gray-200 bg-blue-50 flex-shrink-0 rounded-b-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-blue-800">
                <ExternalLink size={16} />
                <span>
                  저장하면 <strong>고유 URL</strong>이 생성되어 어디서나 공유할 수 있습니다
                </span>
              </div>
              <span className="text-blue-600 font-semibold">
                예: daonview.com/lp/your-page
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
