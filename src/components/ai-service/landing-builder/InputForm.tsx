'use client';

import { useState } from 'react';
import { TargetType, LandingPageInput } from '@/types/landingPage';
import { User, Building2 } from 'lucide-react';

interface InputFormProps {
  onGenerate: (input: LandingPageInput) => void;
  isGenerating: boolean;
}

export function InputForm({ onGenerate, isGenerating }: InputFormProps) {
  const [targetType, setTargetType] = useState<TargetType>('INFLUENCER');
  const [formData, setFormData] = useState<Partial<LandingPageInput>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ ...formData, targetType } as LandingPageInput);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 타입 선택 */}
      <div>
        <label className="block text-sm font-bold text-text-main mb-3">
          랜딩페이지 타입
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTargetType('INFLUENCER')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${targetType === 'INFLUENCER'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <User className={`mx-auto mb-2 ${targetType === 'INFLUENCER' ? 'text-primary' : 'text-gray-400'}`} size={32} />
            <div className="font-bold text-sm">인플루언서</div>
          </button>
          <button
            type="button"
            onClick={() => setTargetType('BUSINESS')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${targetType === 'BUSINESS'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <Building2 className={`mx-auto mb-2 ${targetType === 'BUSINESS' ? 'text-primary' : 'text-gray-400'}`} size={32} />
            <div className="font-bold text-sm">사업자</div>
          </button>
        </div>
      </div>

      {/* 인플루언서 필드 */}
      {targetType === 'INFLUENCER' && (
        <>
          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              이름/채널명 <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="예: 뷰티 인플루언서 제인"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              플랫폼
            </label>
            <select
              value={formData.platform || ''}
              onChange={(e) => updateField('platform', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="">선택하세요</option>
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
              <option value="Blog">Blog (네이버 블로그)</option>
              <option value="TikTok">TikTok</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              팔로워 수
            </label>
            <input
              type="text"
              value={formData.followers || ''}
              onChange={(e) => updateField('followers', e.target.value)}
              placeholder="예: 50,000"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              카테고리
            </label>
            <input
              type="text"
              value={formData.category || ''}
              onChange={(e) => updateField('category', e.target.value)}
              placeholder="예: 뷰티/메이크업"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              강점/특징
            </label>
            <textarea
              value={formData.strength || ''}
              onChange={(e) => updateField('strength', e.target.value)}
              placeholder="예: 트렌디한 메이크업 튜토리얼과 제품 리뷰"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            />
          </div>
        </>
      )}

      {/* 사업자 필드 */}
      {targetType === 'BUSINESS' && (
        <>
          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              사업명 <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.businessName || ''}
              onChange={(e) => updateField('businessName', e.target.value)}
              placeholder="예: 다온뷰"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              한 줄 설명 <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="예: 인플루언서와 광고주를 연결하는 플랫폼"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              타겟 고객
            </label>
            <input
              type="text"
              value={formData.targetCustomer || ''}
              onChange={(e) => updateField('targetCustomer', e.target.value)}
              placeholder="예: 인플루언서 마케팅을 원하는 중소기업"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              핵심 가치
            </label>
            <input
              type="text"
              value={formData.coreValue || ''}
              onChange={(e) => updateField('coreValue', e.target.value)}
              placeholder="예: 투명한 중개, 합리적인 가격"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              제공 서비스
            </label>
            <textarea
              value={formData.services || ''}
              onChange={(e) => updateField('services', e.target.value)}
              placeholder="예: 캠페인 중개, 성과 분석, AI 글작성 도우미"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            />
          </div>
        </>
      )}

      {/* 공통 필드: 연락처 */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-bold text-text-main mb-4">연락처 정보</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              이메일
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Instagram
            </label>
            <input
              type="text"
              value={formData.instagram || ''}
              onChange={(e) => updateField('instagram', e.target.value)}
              placeholder="@username 또는 전체 URL"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              블로그/웹사이트
            </label>
            <input
              type="url"
              value={formData.blog || ''}
              onChange={(e) => updateField('blog', e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              전화번호
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="010-0000-0000"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              구글폼 URL
            </label>
            <input
              type="url"
              value={formData.googleFormUrl || ''}
              onChange={(e) => updateField('googleFormUrl', e.target.value)}
              placeholder="https://forms.gle/..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        type="submit"
        disabled={isGenerating}
        className="w-full py-3 md:py-4 rounded-xl bg-primary text-white font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isGenerating ? 'AI 생성 중...' : 'AI 랜딩페이지 생성하기'}
      </button>
    </form>
  );
}
