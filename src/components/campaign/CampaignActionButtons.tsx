import React from 'react';
import { ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';

interface CampaignActionButtonsProps {
    onPrev?: () => void;
    onNext: () => void;
    onSaveDraft?: () => void;
    nextLabel: string;
    isNextDisabled?: boolean;
    isSubmitting?: boolean;
    showCheckIcon?: boolean;
    className?: string;
}

/**
 * CampaignActionButtons (Pure UI Component)
 * 
 * 이제 이 컴포넌트는 오직 버튼의 스타일과 이벤트 핸들링만 담당합니다.
 * 위치(Floating/Docking) 제어는 FloatingActionWrapper에서 수행합니다.
 */
export const CampaignActionButtons: React.FC<CampaignActionButtonsProps> = ({
    onPrev,
    onNext,
    onSaveDraft,
    nextLabel,
    isNextDisabled = false,
    isSubmitting = false,
    showCheckIcon = false,
    className = "",
}) => {
    return (
        <div className={`flex items-center gap-2 p-2 bg-white/95 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all animate-in fade-in slide-in-from-bottom-2 duration-500 ${className}`}>
            {onPrev && (
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                >
                    <ChevronLeft size={18} className="text-slate-400" />
                    이전
                </button>
            )}

            {onPrev && onSaveDraft && <div className="w-[1px] h-4 bg-slate-200 mx-1" />}

            {onSaveDraft && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onSaveDraft?.();
                    }}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                >
                    <Save size={16} className="text-slate-400" />
                    저장
                </button>
            )}

            <button
                type="button"
                onClick={onNext}
                disabled={isNextDisabled || isSubmitting}
                className={`group flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    !isNextDisabled && !isSubmitting
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-primary/30'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none font-medium'
                }`}
            >
                {isSubmitting ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                        처리 중
                    </>
                ) : (
                    <>
                        {nextLabel}
                        {showCheckIcon ? (
                            <Check size={18} />
                        ) : (
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        )}
                    </>
                )}
            </button>
        </div>
    );
};
