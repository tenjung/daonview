'use client';

import { Keyword } from '@/types/analysis';
import { Badge } from '@/components/ui/badge';

interface KeywordSectionProps {
  primary: Keyword[];
  secondary: Keyword[];
}

export default function KeywordSection({ primary, secondary }: KeywordSectionProps) {
  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <h3 className="text-xl font-bold mb-6">키워드 분석</h3>

      {/* 대표 키워드 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h4 className="text-lg font-semibold">🎯 대표 키워드</h4>
          <span className="text-sm text-gray-500">(TF-IDF 기반)</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {primary.map((keyword, index) => (
            <div
              key={index}
              className="group relative"
            >
              <Badge
                variant="default"
                className="text-base px-4 py-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all cursor-pointer"
              >
                <span className="font-semibold">{keyword.word}</span>
                <span className="ml-2 text-xs opacity-90">
                  {keyword.count}회
                </span>
              </Badge>
              {keyword.score && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                  {index + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 세부 키워드 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h4 className="text-lg font-semibold">📌 세부 키워드</h4>
          <span className="text-sm text-gray-500">(빈도 기반)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {secondary.map((keyword, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-sm px-3 py-1 hover:bg-gray-50 transition-colors cursor-default"
            >
              {keyword.word}
              <span className="ml-1.5 text-xs text-gray-500">
                {keyword.count}
              </span>
            </Badge>
          ))}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> 대표 키워드는 TF-IDF 알고리즘으로 계산된 중요도가 높은 키워드입니다. 
          이 키워드들을 제목이나 본문 초반에 배치하면 검색 노출에 유리합니다.
        </p>
      </div>
    </div>
  );
}
