'use client';

import { Check, X, Download } from 'lucide-react';

interface BulkActionsBarProps {
    selectedCount: number;
    onApprove: () => void | Promise<void>;
    onReject: () => void | Promise<void>;
    onExport?: () => void | Promise<void>;
    onClear: () => void;
}

export default function BulkActionsBar({
    selectedCount,
    onApprove,
    onReject,
    onExport,
    onClear
}: BulkActionsBarProps) {
    if (selectedCount === 0) {
        return null;
    }

    return (
        <div className="fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="w-full max-w-5xl rounded-[28px] border border-white/70 bg-white/92 px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:px-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3 ring-1 ring-rose-100">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-lg font-black text-white shadow-sm">
                            {selectedCount}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-500">
                                Selected
                            </p>
                            <p className="whitespace-nowrap text-base font-black text-slate-800">
                                {selectedCount}개 선택됨
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
                        <button
                            onClick={onApprove}
                            className="inline-flex h-12 min-w-[132px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(5,150,105,0.22)] transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
                        >
                            <Check size={17} />
                            일괄 승인
                        </button>

                        <button
                            onClick={onReject}
                            className="inline-flex h-12 min-w-[132px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-rose-600 px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(225,29,72,0.22)] transition-all hover:-translate-y-0.5 hover:bg-rose-700"
                        >
                            <X size={17} />
                            일괄 거절
                        </button>

                        {onExport && (
                            <button
                                onClick={onExport}
                                className="inline-flex h-12 min-w-[160px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-slate-900 px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                            >
                                <Download size={17} />
                                Excel 다운로드
                            </button>
                        )}

                        <button
                            onClick={onClear}
                            className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                        >
                            선택 해제
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
