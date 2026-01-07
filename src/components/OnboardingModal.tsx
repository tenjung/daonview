'use client';

import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const PLATFORMS = [
  { id: 'BLOG', name: '블로거', icon: '📝', color: 'bg-emerald-500' },
  { id: 'YOUTUBE', name: '유튜버', icon: '🎥', color: 'bg-red-500' },
  { id: 'INSTAGRAM', name: '인스타그래머', icon: '📸', color: 'bg-pink-500' },
  { id: 'TIKTOK', name: '틱톡커', icon: '🎵', color: 'bg-slate-900' },
];

const REGIONS = [
  { id: 'seoul', name: '서울', emoji: '🏙️' },
  { id: 'gyeonggi', name: '경기', emoji: '🏘️' },
  { id: 'incheon', name: '인천', emoji: '🌊' },
  { id: 'busan', name: '부산', emoji: '🏖️' },
  { id: 'daegu', name: '대구', emoji: '🌆' },
  { id: 'gwangju', name: '광주', emoji: '🌃' },
  { id: 'daejeon', name: '대전', emoji: '🏢' },
  { id: 'ulsan', name: '울산', emoji: '🏭' },
  { id: 'sejong', name: '세종', emoji: '🏛️' },
  { id: 'gangwon', name: '강원', emoji: '⛰️' },
  { id: 'chungbuk', name: '충북', emoji: '🌲' },
  { id: 'chungnam', name: '충남', emoji: '🌾' },
  { id: 'jeonbuk', name: '전북', emoji: '🌿' },
  { id: 'jeonnam', name: '전남', emoji: '🌊' },
  { id: 'gyeongbuk', name: '경북', emoji: '🏔️' },
  { id: 'gyeongnam', name: '경남', emoji: '🌄' },
  { id: 'jeju', name: '제주', emoji: '🍊' },
  { id: 'nationwide', name: '전국', emoji: '🇰🇷' },
];

const CATEGORIES = [
  { id: 'food', name: '식품/음료', icon: '🍽️', desc: '건강식품, 간편식, 음료' },
  { id: 'beauty', name: '뷰티/화장품', icon: '💄', desc: '스킨케어, 메이크업, 헤어' },
  { id: 'baby', name: '육아/유아용품', icon: '👶', desc: '기저귀, 장난감, 유아식' },
  { id: 'living', name: '생활/주방', icon: '🏠', desc: '주방용품, 생활용품' },
  { id: 'pet', name: '반려동물', icon: '🐕', desc: '사료, 간식, 용품' },
  { id: 'digital', name: '디지털/가전', icon: '📱', desc: '스마트폰, 가전제품' },
  { id: 'fashion', name: '패션/잡화', icon: '👕', desc: '의류, 신발, 가방' },
  { id: 'sports', name: '스포츠/레저', icon: '🏃', desc: '운동용품, 아웃도어' },
  { id: 'health', name: '건강/의료', icon: '💊', desc: '건강식품, 의료기기' },
];

interface OnboardingModalProps {
  userId: string;
  onComplete: () => void;
}

export default function OnboardingModal({ userId, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const togglePlatform = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== id));
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  const toggleRegion = (id: string) => {
    if (id === 'nationwide') {
      setSelectedRegions(['nationwide']);
    } else {
      const filtered = selectedRegions.filter(r => r !== 'nationwide');
      if (filtered.includes(id)) {
        setSelectedRegions(filtered.filter(r => r !== id));
      } else if (filtered.length < 3) {
        setSelectedRegions([...filtered, id]);
      }
    }
  };

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(c => c !== id));
    } else if (selectedCategories.length < 3) {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_platforms: selectedPlatforms,
          preferred_regions: selectedRegions,
          interests: selectedCategories,
          onboarding_completed: true,
        })
        .eq('id', userId);

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding info:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return selectedPlatforms.length > 0;
    if (step === 2) return selectedRegions.length > 0;
    if (step === 3) return selectedCategories.length > 0;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-900">프로필 설정</h2>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    s === step ? 'bg-primary w-6' : s < step ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {step === 1 && '활동 플랫폼을 선택해주세요 (중복 가능)'}
            {step === 2 && '선호하는 지역을 최대 3곳 선택해주세요'}
            {step === 3 && '관심 분야를 최대 3개 선택해주세요'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {/* Step 1: Platforms */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              {PLATFORMS.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-primary bg-rose-50 shadow-lg scale-102'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {selectedPlatforms.includes(platform.id) && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                  <div className="text-5xl mb-3">{platform.icon}</div>
                  <div className="text-lg font-bold text-gray-900">{platform.name}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Regions */}
          {step === 2 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {REGIONS.map(region => (
                <button
                  key={region.id}
                  onClick={() => toggleRegion(region.id)}
                  disabled={
                    !selectedRegions.includes(region.id) &&
                    selectedRegions.length >= 3 &&
                    !selectedRegions.includes('nationwide')
                  }
                  className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                    selectedRegions.includes(region.id)
                      ? 'border-primary bg-rose-50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  } disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed`}
                >
                  {selectedRegions.includes(region.id) && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                  <div className="text-xl mb-0.5">{region.emoji}</div>
                  <div className="text-[10px] font-bold text-gray-900 whitespace-nowrap">{region.name}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Categories */}
          {step === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  disabled={
                    !selectedCategories.includes(category.id) &&
                    selectedCategories.length >= 3
                  }
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                    selectedCategories.includes(category.id)
                      ? 'border-primary bg-rose-50 shadow-md'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  } disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed`}
                >
                  {selectedCategories.includes(category.id) && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <div className="text-base font-bold text-gray-900 mb-1">{category.name}</div>
                  <div className="text-xs text-gray-400 line-clamp-1">{category.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-4">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-xl font-medium text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              이전
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-8 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center gap-2 ml-auto shadow-sm active:scale-95"
            >
              다음
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="px-10 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed ml-auto shadow-md active:scale-95 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  저장 중...
                </>
              ) : (
                '시작하기'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
