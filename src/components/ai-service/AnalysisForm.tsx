'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Sparkles, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalysisFormProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  quota?: { count: number; limit: number } | null;
}

export default function AnalysisForm({ onAnalyze, isLoading, quota }: AnalysisFormProps) {
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
    
    if (quota && quota.count >= quota.limit) {
      setError('일일 분석 제한 횟수를 모두 소모했습니다. 내일 다시 이용해주세요.');
      return;
    }

    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    if (validateUrl(url)) {
      onAnalyze(url);
    }
  };

  const isLimitReached = quota ? quota.count >= quota.limit : false;

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-indigo-50/80 via-white to-purple-50/30 border border-indigo-100/50 shadow-[0_8px_40px_rgba(0,0,0,0.03)] px-6 py-16 sm:px-12 sm:py-24 mb-10">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 right-0 h-full w-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-12 -right-24 w-96 h-96 bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.15]"
        >
          내 포스팅, 상위 노출될 수 있을까?<br/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            AI 정밀 분석 리포트
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="text-lg sm:text-xl text-gray-500 mb-12 max-w-2xl mx-auto font-medium"
        >
          단순 키워드 추출을 넘어, 실무형 SEO 코칭과 노출 확률 시뮬레이션까지. 지금 바로 내 글의 경쟁력을 진단해 보세요.
        </motion.p>

        <motion.form 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          onSubmit={handleSubmit} 
          className="relative max-w-3xl mx-auto mb-10"
        >
          <div className="flex justify-between items-end mb-2 px-2">
            <span className="text-sm font-semibold text-gray-600 hidden sm:inline-block ml-2">분석할 포스팅 주소 (URL)</span>
            <div className="flex-1 sm:hidden"></div>
            {quota ? (
              <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm border ${isLimitReached ? 'bg-red-50 text-red-600 border-red-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                🔥 금일 잔여 횟수: {Math.max(0, quota.limit - quota.count)} / {quota.limit}회
              </span>
            ) : (
              <span className="text-xs font-medium text-gray-400 px-3 py-1">횟수 불러오는 중...</span>
            )}
          </div>
          <div className={`flex relative items-center shadow-lg rounded-full bg-white transition-all p-2 border ${error || isLimitReached ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200/80 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-300'}`}>
            <div className="flex-1 flex items-center pl-5 sm:pl-6">
              <Search className={`w-5 h-5 sm:w-6 sm:h-6 mr-3 hidden sm:block ${isLimitReached ? 'text-red-300' : 'text-indigo-400'}`} />
              <input
                type="text"
                placeholder={isLimitReached ? "내일 다시 분석을 요청해주세요" : "https://blog.naver.com/..."}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError('');
                }}
                disabled={isLoading || isLimitReached}
                className="w-full bg-transparent outline-none h-14 sm:h-16 text-lg sm:text-xl text-gray-800 placeholder:text-gray-400 font-medium disabled:opacity-50"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || isLimitReached}
              className={`h-14 sm:h-16 px-6 sm:px-10 rounded-full font-bold text-lg whitespace-nowrap shadow-md transition-all shrink-0 ${isLimitReached ? 'bg-gray-300 text-gray-500 cursor-not-allowed hidden sm:flex' : 'bg-gray-900 hover:bg-gray-800 text-white hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  분석 중
                </>
              ) : isLimitReached ? (
                '횟수 초과'
              ) : (
                '분석 시작'
              )}
            </Button>
          </div>
          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-sm text-red-500 font-medium text-left mt-3 pl-6"
            >
              다시 확인해주세요: {error}
            </motion.p>
          )}
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/80 rounded-full shadow-sm text-sm sm:text-base font-semibold text-gray-700">
            <Sparkles className="w-4 h-4 text-amber-500" />
            1타 AI 실무 코칭
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/80 rounded-full shadow-sm text-sm sm:text-base font-semibold text-gray-700">
            <Target className="w-4 h-4 text-rose-500" />
            황금 세부 키워드 색인
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/80 rounded-full shadow-sm text-sm sm:text-base font-semibold text-gray-700">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            검색 노출 시그널 분석
          </div>
        </motion.div>
      </div>
    </div>
  );
}
