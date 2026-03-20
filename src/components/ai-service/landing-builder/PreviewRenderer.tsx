'use client';

import { AIGeneratedContent } from '@/types/landingPage';
import { HeroSection } from '@/components/lp/HeroSection';
import { StatsSection } from '@/components/lp/StatsSection';
import { PortfolioSection } from '@/components/lp/PortfolioSection';
import { ContactSection } from '@/components/lp/ContactSection';
import { Monitor, Smartphone } from 'lucide-react';

interface PreviewRendererProps {
  content: AIGeneratedContent | null;
  previewMode: 'desktop' | 'mobile';
  onPreviewModeChange: (mode: 'desktop' | 'mobile') => void;
  onSave: () => void;
  isSaving: boolean;
}

export function PreviewRenderer({ 
  content, 
  previewMode, 
  onPreviewModeChange,
  onSave,
  isSaving 
}: PreviewRendererProps) {
  if (!content) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-lg font-semibold text-text-secondary">
            정보를 입력하고 AI 생성을 시작하세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 프리뷰 컨트롤 */}
      <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreviewModeChange('desktop')}
            className={`p-2 rounded-lg transition-all ${
              previewMode === 'desktop'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Monitor size={20} />
          </button>
          <button
            onClick={() => onPreviewModeChange('mobile')}
            className={`p-2 rounded-lg transition-all ${
              previewMode === 'mobile'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Smartphone size={20} />
          </button>
        </div>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? '저장 중...' : '저장하기'}
        </button>
      </div>

      {/* 프리뷰 영역 */}
      <div className="flex-1 overflow-auto bg-gray-100 rounded-2xl p-4">
        <div 
          className={`mx-auto bg-white shadow-2xl transition-all duration-300 ${
            previewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'
          }`}
          style={{ minHeight: '100%' }}
        >
          <HeroSection hero={content.hero} colorScheme={content.colorScheme} />
          <StatsSection stats={content.stats} colorScheme={content.colorScheme} />
          <PortfolioSection portfolio={content.portfolio} colorScheme={content.colorScheme} />
          <ContactSection contact={content.contact} colorScheme={content.colorScheme} />
        </div>
      </div>
    </div>
  );
}
