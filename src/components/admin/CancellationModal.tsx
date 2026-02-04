'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

interface CancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    influencerName: string;
}

export default function CancellationModal({
    isOpen,
    onClose,
    onConfirm,
    influencerName,
}: CancellationModalProps) {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(reason);
        setReason('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-5 w-5" />
                        선정 취소 요청 내역 기록
                    </DialogTitle>
                    <DialogDescription>
                        {influencerName}님의 선정을 취소합니다. 부득이하게 취소하게 된 사유를 입력해주세요. 
                        이 정보는 추후 인플루언서 등급 책정 시 참고 자료로 활용됩니다.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="취소 사유를 입력하세요 (예: 본인 요청, 개인 사정으로 인한 취소 요청 등)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="min-h-[120px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        닫기
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!reason.trim()}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        취소 처리 확정
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
