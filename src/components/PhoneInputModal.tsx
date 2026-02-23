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
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-pink-50 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
          <div className="text-center">
            <div className="text-5xl mb-3">📱</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              전화번호가 필요해요
            </h2>
            <p className="text-sm text-gray-600">
              선정되면 카카오톡으로 알림을 보내드려요
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
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
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm">✨</span>
                  <p className="text-xs text-gray-600">
                    캠페인 선정 시 카카오톡으로 즉시 알림
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm">⚡</span>
                  <p className="text-xs text-gray-600">
                    중요한 공지사항 실시간 수신
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm">🔒</span>
                  <p className="text-xs text-gray-600">
                    개인정보는 안전하게 보호됩니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={phoneNumber.length < 10 || loading}
              className="flex-1 px-6 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-sm active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />
                  저장 중...
                </>
              ) : (
                '저장하고 신청하기'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
