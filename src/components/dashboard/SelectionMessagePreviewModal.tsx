"use client";

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2, Mail, MessageCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SELECTION_KAKAO_STATUS_LABELS } from '@/lib/selectionEmailHold';
import {
    SELECTION_PREVIEW_CHECK_ICONS, SELECTION_PREVIEW_LINK_STATUS_LABELS,
    type SelectionPreview, type SelectionPreviewLinkStatus,
} from '@/lib/selectionPreview';

export type SelectionPreviewTab = 'KAKAO' | 'EMAIL';

interface SelectionMessagePreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    applicationId: number | null;
    campaignId: number;
    initialTab: SelectionPreviewTab;
    /** 카톡·메일 발송 후 표를 새로고침할 때 */
    onSent?: (channel: SelectionPreviewTab) => void;
}

const LINK_STATUS_TONE: Record<SelectionPreviewLinkStatus, string> = {
    OK: 'text-emerald-700', NOT_FOUND: 'text-red-600', INVALID: 'text-red-600', UNKNOWN: 'text-amber-700',
};
const formatAt = (value: string) => new Date(value).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

/**
 * 선정 안내 미리보기(관리자·광고주 공용). 메일·알림톡을 실제 발송과 같은 서버 함수로 그려 보여주고,
 * 점검 결과를 확인한 뒤 [최종 발송]으로 보낸다. 알림톡 탭은 관리자에게만 보인다.
 */
export function SelectionMessagePreviewModal({ open, onOpenChange, applicationId, campaignId, initialTab, onSent }: SelectionMessagePreviewModalProps) {
    const [preview, setPreview] = useState<SelectionPreview | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [tab, setTab] = useState<SelectionPreviewTab>(initialTab);
    const [sending, setSending] = useState<'KAKAO' | 'SELF' | 'EMAIL' | null>(null);
    const [openHistoryId, setOpenHistoryId] = useState<number | null>(null);

    const load = useCallback(async () => {
        if (!applicationId) return;
        setIsLoading(true);
        setLoadError(null);
        try {
            const response = await fetch(`/api/applications/${applicationId}/selection-preview`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId }), cache: 'no-store',
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || '미리보기를 만들지 못했습니다.');
            setPreview(result as SelectionPreview);
        } catch (error) {
            setPreview(null);
            setLoadError(error instanceof Error ? error.message : '미리보기를 만들지 못했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [applicationId, campaignId]);

    useEffect(() => {
        if (!open) return;
        setTab(initialTab);
        setOpenHistoryId(null);
        void load();
    }, [open, initialTab, load]);
    useEffect(() => { if (preview && !preview.kakao && tab === 'KAKAO') setTab('EMAIL'); }, [preview, tab]);

    const sendKakao = async (target: 'RECIPIENT' | 'SELF') => {
        if (!applicationId || !preview?.kakao?.hash || sending) return;
        setSending(target === 'SELF' ? 'SELF' : 'KAKAO');
        try {
            const response = await fetch(`/api/applications/${applicationId}/selection-kakao`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId, previewHash: preview.kakao.hash, target }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || '알림톡 발송에 실패했습니다.');
            if (target === 'SELF') {
                toast.success('내 번호로 테스트 알림톡을 보냈습니다.');
            } else {
                toast.success('선정 안내 알림톡을 발송했습니다.');
                onSent?.('KAKAO');
                await load();
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '알림톡 발송에 실패했습니다.');
            if (target === 'RECIPIENT') await load();
        } finally {
            setSending(null);
        }
    };

    const sendEmail = async () => {
        if (!applicationId || !preview || sending) return;
        setSending('EMAIL');
        try {
            const response = await fetch('/api/applications/resend-selection', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, previewHash: preview.email.hash }),
            });
            const result = await response.json().catch(() => null);
            if (!response.ok || !result?.success) throw new Error(result?.error || result?.errors?.[0] || '선정 메일 재발송에 실패했습니다.');
            toast.success('선정 메일을 재발송했습니다.');
            onSent?.('EMAIL');
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '선정 메일 재발송에 실패했습니다.');
        } finally {
            setSending(null);
        }
    };

    const kakao = preview?.kakao;
    const kakaoBlocked = Boolean(kakao?.alreadySent);
    const canSendKakao = Boolean(kakao?.hash && !kakao.error && !kakaoBlocked);

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!sending) onOpenChange(next); }}>
            {/* 사이트 상단 헤더(z-100)에 제목이 가리지 않도록 헤더 높이만큼 내려서 띄운다. */}
            <DialogContent className="top-[calc(50%+32px)] max-h-[calc(100vh-96px)] w-[calc(100vw-24px)] max-w-3xl overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle>선정 안내 미리보기</DialogTitle>
                    <DialogDescription>
                        {preview ? `${preview.recipientName} · ${preview.campaignTitle}` : '보낼 내용을 확인한 뒤 최종 발송해 주세요.'}
                    </DialogDescription>
                </DialogHeader>

                {isLoading && !preview ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> 미리보기를 만드는 중…</div>
                ) : loadError ? (
                    <div className="space-y-3 py-10 text-center text-sm">
                        <p className="text-red-600">{loadError}</p>
                        <Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="mr-1 h-3.5 w-3.5" /> 다시 시도</Button>
                    </div>
                ) : preview ? (
                    <Tabs value={tab} onValueChange={(value) => setTab(value as SelectionPreviewTab)}>
                        <TabsList className="w-full sm:w-auto">
                            {kakao && <TabsTrigger value="KAKAO" className="flex-1 sm:flex-none"><MessageCircle className="mr-1 h-4 w-4" /> 카톡</TabsTrigger>}
                            <TabsTrigger value="EMAIL" className="flex-1 sm:flex-none"><Mail className="mr-1 h-4 w-4" /> 메일</TabsTrigger>
                        </TabsList>

                        {kakao && (
                            <TabsContent value="KAKAO" className="mt-4">
                                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
                                    <div className="rounded-2xl bg-[#b2c7da] p-3">
                                        <div className="mx-auto max-w-[360px] overflow-hidden rounded-xl bg-white shadow-sm">
                                            <div className="bg-[#fee500] px-4 py-2 text-xs font-bold text-gray-900">알림톡 도착</div>
                                            {kakao.error && !kakao.text ? (
                                                <p className="p-4 text-sm text-red-600">{kakao.error}</p>
                                            ) : (
                                                <p className="whitespace-pre-wrap break-words p-4 text-[13px] leading-relaxed text-gray-900">{kakao.text}</p>
                                            )}
                                            {kakao.buttonName && (
                                                <div className="border-t p-3">
                                                    {kakao.buttonUrl ? (
                                                        <a href={kakao.buttonUrl} target="_blank" rel="noopener noreferrer" className="block rounded-md bg-gray-100 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-200">{kakao.buttonName}</a>
                                                    ) : <span className="block rounded-md bg-gray-100 py-2 text-center text-sm text-gray-500">{kakao.buttonName}</span>}
                                                </div>
                                            )}
                                        </div>
                                        {!kakao.templateExact && kakao.text && <p className="mt-2 text-center text-[11px] text-gray-700">승인 템플릿 원문을 못 불러와 변수 내용만 표시합니다.</p>}
                                    </div>
                                    <PreviewSidePanel preview={preview} channel="KAKAO" />
                                </div>

                                {kakao.history.length > 0 && (
                                    <div className="mt-4 rounded-lg border p-3">
                                        <p className="mb-2 text-xs font-semibold text-gray-600">카톡 발송 이력</p>
                                        <ul className="space-y-2">
                                            {kakao.history.map((item) => (
                                                <li key={item.id} className="text-xs">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <span className={item.status === 'SENT' ? 'font-semibold text-emerald-700' : item.status === 'FAILED' ? 'font-semibold text-red-600' : 'font-semibold text-amber-700'}>{SELECTION_KAKAO_STATUS_LABELS[item.status]}</span>
                                                        <span className="text-gray-500">{formatAt(item.at)} · {item.phoneMasked} · {item.senderName}</span>
                                                        {item.messageText && <button type="button" className="text-blue-600 underline" onClick={() => setOpenHistoryId(openHistoryId === item.id ? null : item.id)}>{openHistoryId === item.id ? '접기' : '보낸 내용'}</button>}
                                                    </div>
                                                    {openHistoryId === item.id && item.messageText && <p className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2 text-gray-700">{item.messageText}</p>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                                    {kakaoBlocked && <p className="text-xs text-gray-500 sm:mr-auto">이미 {SELECTION_KAKAO_STATUS_LABELS[kakao.alreadySent!.status]} 상태라 다시 보낼 수 없습니다.</p>}
                                    <Button variant="outline" onClick={() => void sendKakao('SELF')} disabled={!kakao.hash || !kakao.selfPhoneMasked || Boolean(sending)} title={kakao.selfPhoneMasked ? undefined : '내 프로필에 휴대폰 번호가 없습니다.'}>
                                        {sending === 'SELF' ? '보내는 중…' : `내 번호로 테스트${kakao.selfPhoneMasked ? ` (${kakao.selfPhoneMasked})` : ''}`}
                                    </Button>
                                    <Button onClick={() => void sendKakao('RECIPIENT')} disabled={!canSendKakao || Boolean(sending)} className="bg-[#fee500] text-gray-900 hover:bg-[#f5dc00]">
                                        {sending === 'KAKAO' ? '발송 중…' : `카톡 최종 발송 (${kakao.phoneMasked || '번호 없음'})`}
                                    </Button>
                                </div>
                            </TabsContent>
                        )}

                        <TabsContent value="EMAIL" className="mt-4">
                            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
                                <div className="overflow-hidden rounded-xl border">
                                    <div className="space-y-0.5 border-b bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                        <p><span className="text-gray-400">받는 사람</span> {preview.email.recipientMasked || '이메일 없음'}</p>
                                        <p className="break-words"><span className="text-gray-400">제목</span> {preview.email.subject}</p>
                                    </div>
                                    <iframe
                                        title="선정 메일 미리보기"
                                        sandbox="allow-popups allow-popups-to-escape-sandbox"
                                        srcDoc={preview.email.html.replace('<head>', '<head><base target="_blank">')}
                                        className="h-[480px] w-full bg-white"
                                    />
                                </div>
                                <PreviewSidePanel preview={preview} channel="EMAIL" />
                            </div>
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                                {preview.email.blockedReason && <p className="text-xs text-red-600 sm:mr-auto">{preview.email.blockedReason} {preview.kakao ? '카톡으로 안내해 주세요.' : '관리자에게 카톡 안내를 요청해 주세요.'}</p>}
                                <Button onClick={() => void sendEmail()} disabled={Boolean(preview.email.blockedReason) || Boolean(sending)}>
                                    {sending === 'EMAIL' ? '발송 중…' : '메일 최종 재발송'}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

// 카톡에만 해당하는 점검(번호·글자 수·템플릿)은 메일 탭에서 숨긴다.
const KAKAO_ONLY_CHECKS = new Set(['phone', 'length', 'template', 'clip']);

function PreviewSidePanel({ preview, channel }: { preview: SelectionPreview; channel: SelectionPreviewTab }) {
    const checks = channel === 'KAKAO' ? preview.checks : preview.checks.filter((check) => !KAKAO_ONLY_CHECKS.has(check.key));
    return (
        <aside className="space-y-3 text-xs">
            <div className="rounded-lg border p-3">
                <p className="mb-2 font-semibold text-gray-600">발송 전 점검</p>
                <ul className="space-y-1.5">
                    {checks.map((check) => (
                        <li key={check.key} className="flex gap-1.5">
                            <span aria-hidden>{SELECTION_PREVIEW_CHECK_ICONS[check.status]}</span>
                            <span><span className="font-medium text-gray-800">{check.label}</span> <span className="break-words text-gray-600">{check.detail}</span></span>
                        </li>
                    ))}
                </ul>
            </div>
            {preview.links.length > 0 && (
                <div className="rounded-lg border p-3">
                    <p className="mb-2 font-semibold text-gray-600">링크</p>
                    <ul className="space-y-2">
                        {preview.links.map((link) => (
                            <li key={`${link.label}-${link.url}`}>
                                <p className="font-medium text-gray-800">{link.label}</p>
                                <p className="break-all text-gray-500">{link.url}</p>
                                <div className="mt-0.5 flex items-center gap-2">
                                    <span className={LINK_STATUS_TONE[link.status]}>{SELECTION_PREVIEW_LINK_STATUS_LABELS[link.status]}</span>
                                    {link.status !== 'INVALID' && <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 underline">열어보기 <ExternalLink className="ml-0.5 h-3 w-3" /></a>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </aside>
    );
}
