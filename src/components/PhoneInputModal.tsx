'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface PhoneInputModalProps {
  userId: string;
  onComplete: (phoneNumber: string) => void;
  onClose: () => void;
}

export default function PhoneInputModal({ userId, onComplete, onClose }: PhoneInputModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // 전화번호 유효성 검사
    const phoneRegex = /^01[0-9]{8,9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/-/g, ''))) {
      toast.error('올바른 전화번호를 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: phoneNumber })
        .eq('id', userId);

      if (error) throw error;

      toast.success('전화번호가 저장되었습니다');
      onComplete(phoneNumber);
    } catch (error) {
      console.error('Error saving phone number:', error);
      toast.error('저장 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="bg-white w-full shadow-2xl animate-in fade-in zoom-in duration-300 rounded-t-3xl sm:rounded-3xl sm:max-w-md">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-pink-50 relative sm:p-6">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/50 rounded-full transition-colors sm:top-4 sm:right-4 sm:p-2"
          >
            <X size={18} className="text-gray-500 sm:w-5 sm:h-5" />
          </button>
          <div className="text-center">
            <div className="text-3xl mb-2 sm:text-5xl sm:mb-3">📱</div>
            <h2 className="text-xl font-black text-gray-900 mb-1.5 sm:text-2xl sm:mb-2">
              전화번호가 필요해요
            </h2>
            <p className="text-xs text-gray-600 sm:text-sm">
              선정되면 카카오톡으로 알림을 보내드려요
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
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
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:outline-none transition-colors sm:py-3 sm:text-base"
                autoFocus
              />
              {phoneNumber.length > 0 && phoneNumber.length < 10 && (
                <p className="text-xs text-red-500 mt-1">
                  올바른 전화번호를 입력해주세요
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                '-' 없이 숫자만 입력해주세요
              </p>
            </div>

            {/* 혜택 안내 */}
            <div className="bg-rose-50 rounded-xl px-3 py-3 border border-rose-100 sm:p-4">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm">✨</span>
                  <p className="text-[11px] text-gray-600 sm:text-xs">
                    캠페인 선정 시 카카오톡으로 즉시 알림
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm">⚡</span>
                  <p className="text-[11px] text-gray-600 sm:text-xs">
                    중요한 공지사항 실시간 수신
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm">🔒</span>
                  <p className="text-[11px] text-gray-600 sm:text-xs">
                    개인정보는 안전하게 보호됩니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="min-w-[76px] px-4 py-2.5 rounded-xl font-medium text-sm text-gray-500 hover:bg-gray-100 transition-colors sm:flex-1 sm:px-6 sm:py-3 sm:text-base"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={phoneNumber.length < 10 || loading}
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-sm active:scale-95 sm:px-6 sm:py-3 sm:text-base"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />
                  저장 중...
                </>
              ) : (
                <>
                  <span className="sm:hidden">저장 후 신청</span>
                  <span className="hidden sm:inline">저장하고 신청하기</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
