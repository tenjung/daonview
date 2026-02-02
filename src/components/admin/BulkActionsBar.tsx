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
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 px-6 py-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {selectedCount}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                        개 선택됨
                    </span>
                </div>

                <div className="h-6 w-px bg-gray-200" />

                <div className="flex items-center gap-2">
                    <button
                        onClick={onApprove}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-bold text-sm shadow-sm"
                    >
                        <Check size={16} />
                        일괄 승인
                    </button>
                    
                    <button
                        onClick={onReject}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-bold text-sm shadow-sm"
                    >
                        <X size={16} />
                        일괄 거절
                    </button>

                    {onExport && (
                        <button
                            onClick={onExport}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm shadow-sm"
                        >
                            <Download size={16} />
                            Excel 다운로드
                        </button>
                    )}
                </div>

                <div className="h-6 w-px bg-gray-200" />

                <button
                    onClick={onClear}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                    선택 해제
                </button>
            </div>
        </div>
    );
}
