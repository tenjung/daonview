'use client';

import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  buildPreferredPlatforms,
  CREATOR_PLATFORM_OPTIONS,
  type CreatorPlatformId,
  PROFILE_MODES,
  type ProfileMode,
} from '@/constants/profilePlatforms';

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
  allowSkip?: boolean; // 건너뛰기 허용 여부 (로그인 시에만 true)
}

export default function OnboardingModal({ userId, onComplete, allowSkip = false }: OnboardingModalProps) {
  const [step, setStep] = useState(0); // 0: 성함/연락처, 1: 플랫폼, 2: 지역, 3: 카테고리
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileMode, setProfileMode] = useState<ProfileMode>(PROFILE_MODES.CREATOR);
  const [selectedPlatforms, setSelectedPlatforms] = useState<CreatorPlatformId[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const togglePlatform = (id: CreatorPlatformId) => {
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
          name: name,
          phone_number: phoneNumber,
          preferred_platforms: buildPreferredPlatforms(profileMode, selectedPlatforms),
          preferred_regions: selectedRegions,
          interests: selectedCategories,
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

  const handleSkip = () => {
    if (!allowSkip) return;
    
    // 🟢 세션 스토리지에 건너뛰기 기록 (이번 세션에서만 유효)
    sessionStorage.setItem('onboarding_skipped', 'true');
    onComplete();
  };

  const canProceed = () => {
    if (step === 0) {
      // 성함: 2글자 이상, 전화번호: 10-11자리 숫자
      const phoneRegex = /^01[0-9]{8,9}$/;
      return name.trim().length >= 2 && phoneRegex.test(phoneNumber.replace(/-/g, ''));
    }
    if (step === 1) {
      if (profileMode === PROFILE_MODES.REVIEWER) return true;
      return selectedPlatforms.length > 0;
    }
    if (step === 2) return selectedRegions.length > 0;
    if (step === 3) return selectedCategories.length > 0;
    return false;
  };

  // 각 단계별 혜택 설명
  const getBenefits = () => {
    if (step === 0) {
      return [
        { icon: '📱', text: '카톡 알림 받기' },
        { icon: '⚡', text: '빠른 선정 안내' },
        { icon: '🎁', text: '맞춤 캠페인 추천' },
      ];
    }
    if (step === 1) {
      return [
        { icon: '🎯', text: '맞춤 캠페인 추천' },
        { icon: '⚡', text: '선정 확률 UP' },
        { icon: '💰', text: '더 많은 기회' },
      ];
    }
    if (step === 2) {
      return [
        { icon: '📍', text: '지역 기반 추천' },
        { icon: '🚗', text: '방문형 캠페인 우선' },
        { icon: '✨', text: '광고주 노출 증가' },
      ];
    }
    return [
      { icon: '🎁', text: '관심사 맞춤 제안' },
      { icon: '🔔', text: '신규 캠페인 알림' },
      { icon: '⭐', text: '프로필 완성도 UP' },
    ];
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-pink-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-gray-900">프로필 설정</h2>
                {/* 선택 카운터 배지 */}
                {step === 1 && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    (profileMode === PROFILE_MODES.REVIEWER || selectedPlatforms.length > 0)
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {profileMode === PROFILE_MODES.REVIEWER ? '리뷰어형' : `${selectedPlatforms.length}개 선택`}
                  </span>
                )}
                {step === 2 && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    selectedRegions.length > 0 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {selectedRegions.length}/3개 선택
                  </span>
                )}
                {step === 3 && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    selectedCategories.length > 0 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {selectedCategories.length}/3개 선택
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {step === 0 && '성함과 연락처를 입력해주세요'}
                {step === 1 && '활동 유형을 선택해주세요'}
                {step === 2 && '선호하는 지역을 선택해주세요'}
                {step === 3 && '관심 분야를 선택해주세요'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${s === step ? 'bg-primary w-6' : s < step ? 'bg-primary' : 'bg-gray-200'
                    }`}
                />
              ))}
            </div>
          </div>
          
          {/* 혜택 카드 */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {getBenefits().map((benefit, i) => (
              <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm border border-rose-100">
                <div className="text-2xl mb-1">{benefit.icon}</div>
                <div className="text-[10px] font-bold text-gray-700 leading-tight">{benefit.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {/* Step 0: Name & Phone */}
          {step === 0 && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  캠페인 선정 시 카톡으로 알림받기
                </h3>
                <p className="text-sm text-gray-500">
                  선정되면 빠르게 알려드릴게요!
                </p>
              </div>

              <div className="space-y-4">
                {/* 성함 입력 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    성함 <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="실명을 입력해주세요"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"
                  />
                  {name.trim().length > 0 && name.trim().length < 2 && (
                    <p className="text-xs text-red-500 mt-1">
                      2글자 이상 입력해주세요
                    </p>
                  )}
                </div>

                {/* 연락처 입력 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    연락처 <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value.length <= 11) {
                        setPhoneNumber(value);
                      }
                    }}
                    placeholder="01012345678"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"
                  />
                  {phoneNumber.length > 0 && phoneNumber.length < 10 && (
                    <p className="text-xs text-red-500 mt-1">
                      올바른 전화번호를 입력해주세요
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    하이픈 없이 숫자만 입력해주세요
                  </p>
                </div>
              </div>

              {/* 안내 문구 */}
              <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                <p className="text-xs text-gray-600 leading-relaxed">
                  💡 <strong>선택사항</strong>이지만, 입력하시면 캠페인 선정 시 카카오톡으로 즉시 알림을 받을 수 있어요!
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Platforms */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProfileMode(PROFILE_MODES.CREATOR)}
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${
                    profileMode === PROFILE_MODES.CREATOR
                      ? 'border-rose-500 bg-rose-50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-black text-gray-900">크리에이터형</div>
                  <p className="mt-1 text-xs text-slate-500">SNS 채널 기반으로 캠페인에 참여해요.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileMode(PROFILE_MODES.REVIEWER)}
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${
                    profileMode === PROFILE_MODES.REVIEWER
                      ? 'border-rose-500 bg-rose-50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-black text-gray-900">리뷰어형 (구매평)</div>
                  <p className="mt-1 text-xs text-slate-500">SNS 없이 구매평 캠페인 위주로 참여해요.</p>
                </button>
              </div>

              {profileMode === PROFILE_MODES.CREATOR ? (
                <div className="grid grid-cols-2 gap-4">
                  {CREATOR_PLATFORM_OPTIONS.map(platform => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${selectedPlatforms.includes(platform.id)
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
              ) : (
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-sm text-slate-700">
                  구매평 중심 사용자로 저장됩니다. 가입 후에도 프로필 설정에서 언제든 활동 유형을 바꿀 수 있습니다.
                </div>
              )}
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
                  className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${selectedRegions.includes(region.id)
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  disabled={
                    !selectedCategories.includes(category.id) &&
                    selectedCategories.length >= 3
                  }
                  className={`relative p-3 rounded-xl border-2 transition-all duration-300 text-center ${selectedCategories.includes(category.id)
                      ? 'border-primary bg-rose-50 shadow-md'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    } disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed`}
                >
                  {selectedCategories.includes(category.id) && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  <div className="text-3xl mb-1.5">{category.icon}</div>
                  <div className="text-sm font-bold text-gray-900 mb-0.5">{category.name}</div>
                  <div className="text-[10px] text-gray-400 line-clamp-1">{category.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            {step > 0 ? (
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

            <div className="flex items-center gap-3">
              {/* 건너뛰기 버튼 (allowSkip이 true일 때만) */}
              {allowSkip && step === 0 && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 rounded-xl font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-sm"
                >
                  나중에 설정하기
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="px-8 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center gap-2 shadow-sm active:scale-95"
                >
                  다음
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || loading}
                  className="px-10 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-md active:scale-95 flex items-center gap-2"
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

          {/* 안내 문구 */}
          {!allowSkip && (
            <p className="text-xs text-gray-400 text-center mt-4">
              💡 설정한 정보는 언제든지 프로필에서 수정할 수 있어요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
