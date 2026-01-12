'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import AnalysisForm from '@/components/ai-service/AnalysisForm';
import StatsCard from '@/components/ai-service/StatsCard';
import KeywordSection from '@/components/ai-service/KeywordSection';
import ExposureChart from '@/components/ai-service/ExposureChart';
import { BlogAnalysisResult, AnalysisStatus } from '@/types/analysis';

export default function AnalysisPage() {
  const [status, setStatus] = useState<AnalysisStatus>('IDLE');
  const [result, setResult] = useState<BlogAnalysisResult | null>(null);

  const handleAnalyze = async (url: string) => {
    setStatus('ANALYZING');
    setResult(null);

    try {
      const response = await fetch('/api/ai-service/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '분석 중 오류가 발생했습니다.');
      }

      setResult(data);
      setStatus('SUCCESS');
      toast.success('분석이 완료되었습니다!');
    } catch (error) {
      setStatus('ERROR');
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      toast.error(errorMessage);
      console.error('분석 오류:', error);
    }
  };

  return (
    <div className="container py-16">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">내 포스팅 분석</h1>
          <p className="text-lg text-gray-600">
            AI가 블로그 포스팅을 분석하여 키워드와 검색 노출도를 알려드립니다
          </p>
        </div>

        {/* 분석 폼 */}
        <div className="mb-8">
          <AnalysisForm 
            onAnalyze={handleAnalyze} 
            isLoading={status === 'ANALYZING'} 
          />
        </div>

        {/* 분석 결과 */}
        {result && status === 'SUCCESS' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* 제목 */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {result.title}
              </h2>
              <p className="text-sm text-gray-500">
                {result.content.substring(0, 200)}...
              </p>
            </div>

            {/* 통계 카드 */}
            <StatsCard result={result} />

            {/* 키워드 섹션 */}
            <KeywordSection 
              primary={result.keywords.primary}
              secondary={result.keywords.secondary}
            />

            {/* 노출도 차트 */}
            <ExposureChart data={result.exposure} />
          </div>
        )}
      </div>
    </div>
  );
}
