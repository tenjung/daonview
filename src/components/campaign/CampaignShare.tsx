'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, Instagram as InstagramIcon } from 'lucide-react';
import { toast } from 'sonner';
import Script from 'next/script';

interface CampaignShareProps {
    campaignId: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    campaignType?: string;
    campaignConditionLabel?: string;
    variant?: 'default' | 'large';
}

export default function CampaignShare({
    campaignId,
    title,
    description,
    thumbnailUrl,
    campaignType,
    campaignConditionLabel,
    variant = 'default'
}: CampaignShareProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [kakaoLoaded, setKakaoLoaded] = useState(false);
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${campaignId}` : '';

    const handleKakaoInit = () => {
        if (typeof window !== 'undefined' && (window as any).Kakao) {
            const Kakao = (window as any).Kakao;
            if (!Kakao.isInitialized()) {
                // 이 키는 보통 환경변수로 관리되지만, 
                // 공유 기능을 위해 클라이언트 사이드 키가 필요합니다.
                // 일단 초기화 시도만 하고, 실패 시 fallback 처리합니다.
                const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '8f4c4075f92323e42100889988299292'; // Placeholder or found key
                try {
                    Kakao.init(key);
                    setKakaoLoaded(true);
                } catch (e) {
                    console.error('Kakao init failed:', e);
                }
            } else {
                setKakaoLoaded(true);
            }
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('링크가 복사되었습니다.');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('링크 복사에 실패했습니다.');
        }
    };

    const shareToNaverBlog = () => {
        const url = encodeURIComponent(shareUrl);
        const titleText = encodeURIComponent(title);
        window.open(`https://blog.naver.com/openapi/share?url=${url}&title=${titleText}`, '_blank');
    };

    const shareToKakao = () => {
        // If Kakao SDK is available, use it. Otherwise, use a simple link share.
        // For now, we'll use the story share link or just rely on OG tags if shared manually.
        // But since we want a "button" that works:
        if ((window as any).Kakao) {
            const Kakao = (window as any).Kakao;
            if (!Kakao.isInitialized()) {
                // We need the key here. If we don't have it, we fallback.
                console.warn('Kakao SDK not initialized');
            } else {
                Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: title,
                        description: description.substring(0, 100),
                        imageUrl: thumbnailUrl || 'https://daonview.com/og-image.jpg',
                        link: {
                            mobileWebUrl: shareUrl,
                            webUrl: shareUrl,
                        },
                    },
                    buttons: [
                        {
                            title: '캠페인 보러가기',
                            link: {
                                mobileWebUrl: shareUrl,
                                webUrl: shareUrl,
                            },
                        },
                    ],
                });
                return;
            }
        }
        
        // Fallback or simple copy and tell user
        handleCopyLink();
        toast.info('카카오톡 본문에 링크를 붙여넣어 주세요!');
    };

    const shareToInstagram = () => {
        handleCopyLink();
        toast.info('링크가 복사되었습니다. 인스타그램 DM이나 스토리에 공유해보세요!', {
            duration: 4000
        });
        setTimeout(() => {
            window.open('https://www.instagram.com/', '_blank');
        }, 1500);
    };

    const handleCopyBrief = async () => {
        const typeValue = (campaignType || '').toUpperCase();
        const typeLabel =
            typeValue === 'DELIVERY' ? '배송체험단' :
            typeValue === 'VISIT' ? '방문체험단' :
            typeValue === 'PRESS' ? '기자단' :
            typeValue === 'PURCHASE' ? '구매형 체험단' :
            '체험단';

        const safeDescription = (description || '제공 내역 추후 안내').trim();

        const conditionText = (campaignConditionLabel || '').trim();
        const headlineType = conditionText ? `${typeLabel} (${conditionText})` : typeLabel;
        const briefText =
`📢 [다온뷰] ${headlineType} 모집 안내

✨ 캠페인명: ${title}
🎁 제공 내역: ${safeDescription}
🔗 신청 링크: ${shareUrl}`;

        try {
            await navigator.clipboard.writeText(briefText);
            toast.success('모집 안내글이 복사되었습니다.', {
                description: '카카오톡이나 채팅창에 바로 붙여넣어 보세요!'
            });
        } catch (err) {
            toast.error('복사에 실패했습니다.');
        }
    };

    return (
        <>
            <Script 
                src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js" 
                onLoad={handleKakaoInit}
            />
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {variant === 'large' ? (
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="w-14 h-14 rounded-[20px] bg-white border-2 border-slate-100 hover:border-rose-200 text-slate-400 hover:text-rose-500 transition-all shadow-lg active:scale-95 flex items-center justify-center"
                        title="공유하기"
                    >
                        <Share2 className="w-6 h-6" />
                    </Button>
                ) : (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all active:scale-95"
                        title="공유하기"
                    >
                        <Share2 className="w-5 h-5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-[420px] rounded-[32px] p-8 md:p-10 border-none shadow-2xl flex flex-col items-center overflow-hidden">
                <DialogHeader className="mb-8 w-full">
                    <DialogTitle className="text-xl font-black text-slate-900 text-center w-full">공유하기</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-6 mb-10 w-full justify-items-center">
                    {/* 카카오톡 */}
                    <button 
                        onClick={shareToKakao}
                        className="flex flex-col items-center gap-3 group transition-all w-full"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-[#FEE500] flex items-center justify-center shadow-lg shadow-yellow-200/50 group-hover:scale-105 active:scale-95 transition-transform">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.358 2 10.5C2 13.213 3.784 15.619 6.559 16.969C6.425 17.437 5.986 18.969 5.867 19.395C5.748 19.822 6.189 20.065 6.536 19.832C8.653 18.423 11.237 16.712 11.954 16.223L12 16.22C12.33 16.233 12.663 16.24 13 16.24C18.523 16.24 23 12.882 23 8.74C23 4.602 18.523 3 12 3Z" fill="#391B1B" />
                            </svg>
                        </div>
                        <span className="text-[13px] font-bold text-slate-600">카카오톡</span>
                    </button>

                    {/* 네이버 블로그 */}
                    <button 
                        onClick={shareToNaverBlog}
                        className="flex flex-col items-center gap-3 group transition-all w-full"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-[#03C75A] flex items-center justify-center shadow-lg shadow-green-100/50 group-hover:scale-105 active:scale-95 transition-transform">
                            <span className="text-white font-black text-xl">N</span>
                        </div>
                        <span className="text-[13px] font-bold text-slate-600">블로그</span>
                    </button>

                    {/* 인스타그램 */}
                    <button 
                        onClick={shareToInstagram}
                        className="flex flex-col items-center gap-3 group transition-all w-full"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center shadow-lg shadow-purple-100/50 group-hover:scale-105 active:scale-95 transition-transform">
                            <InstagramIcon className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-[13px] font-bold text-slate-600">인스타그램</span>
                    </button>
                </div>

                <div className="space-y-4 pt-8 border-t border-slate-100 w-full flex flex-col items-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">링크 복사</p>
                    <div className="flex gap-3 w-full items-center justify-center">
                        <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-500 font-medium truncate text-center">
                            {shareUrl}
                        </div>
                        <Button 
                            onClick={handleCopyLink}
                            variant="outline"
                            className="w-[100px] shrink-0 bg-white hover:bg-slate-50 border-slate-100 rounded-xl h-auto py-3 px-0 transition-all flex items-center justify-center"
                        >
                            <div className="flex items-center justify-center gap-2">
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-600" />}
                                <span className="font-bold text-slate-700">{copied ? '복사됨' : '복사'}</span>
                            </div>
                        </Button>
                    </div>
                </div>

                <div className="mt-8 w-full space-y-3">
                    <Button 
                        onClick={handleCopyBrief}
                        variant="secondary" 
                        className="w-full h-14 rounded-2xl bg-indigo-50 text-indigo-600 font-black hover:bg-indigo-100 border-none flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                        <Copy className="w-4 h-4" />
                        모집 안내글 복사
                    </Button>

                    <Button 
                        variant="outline" 
                        className="w-full h-14 rounded-2xl border-slate-100 text-slate-600 font-bold hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm"
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: title,
                                    text: description.substring(0, 100),
                                    url: shareUrl,
                                });
                            } else {
                                toast.info('브라우저에서 공유 기능을 지원하지 않습니다.');
                            }
                        }}
                    >
                        <Share2 className="w-4 h-4" />
                        더 많은 방법으로 공유
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}
