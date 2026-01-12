'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AnalysisFormProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export default function AnalysisForm({ onAnalyze, isLoading }: AnalysisFormProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (input: string): boolean => {
    try {
      const urlObj = new URL(input);
      if (!urlObj.hostname.includes('blog.naver.com')) {
        setError('네이버 블로그 URL만 분석 가능합니다.');
        return false;
      }
      setError('');
      return true;
    } catch {
      setError('유효한 URL을 입력해주세요.');
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    if (validateUrl(url)) {
      onAnalyze(url);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-2">포스팅 URL을 입력해주세요</h2>
        <p className="text-gray-500">AI가 포스팅을 정밀하게 분석하여 결과를 알려드립니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="https://blog.naver.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            className="whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                분석 중...
              </>
            ) : (
              '분석하기'
            )}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p className="mb-2 font-bold flex items-center gap-2">
          💡 분석 항목
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>대표 키워드 및 세부 키워드 추출</li>
          <li>키워드별 검색 노출도 분석</li>
          <li>글자수, 이미지 개수 통계</li>
          <li>키워드 밀도 분석</li>
        </ul>
      </div>
    </div>
  );
}
