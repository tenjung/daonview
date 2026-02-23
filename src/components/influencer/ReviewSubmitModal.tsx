'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload, Loader2, Camera, Link as LinkIcon } from 'lucide-react';

interface ReviewSubmitModalProps {
    isOpen: boolean;
    onClose: () => void;
    applicationId: number;
    campaignId: number;
    campaignTitle: string;
    creatorId: string;
    onSuccess: () => void;
}

export default function ReviewSubmitModal({
    isOpen,
    onClose,
    applicationId,
    campaignId,
    campaignTitle,
    creatorId,
    onSuccess
}: ReviewSubmitModalProps) {
    const [reviewUrl, setReviewUrl] = useState('');
    const [reviewContent, setReviewContent] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        setIsUploading(true);
        const newUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop()?.toLowerCase();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `reviews/${campaignId}/${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('campaign-images') // 기존 버킷 활용
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('campaign-images')
                    .getPublicUrl(filePath);

                newUrls.push(publicUrl);
            }

            setMediaUrls(prev => [...prev, ...newUrls]);
            toast.success(`${newUrls.length}개의 파일이 업로드되었습니다.`);
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('파일 업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeMedia = (url: string) => {
        setMediaUrls(prev => prev.filter(u => u !== url));
    };

    const handleSubmit = async () => {
        if (!reviewUrl.trim()) {
            toast.error('리뷰 주소(URL)를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            // 1. applications 테이블 업데이트 (리뷰 제출됨 표시 및 완료 처리)
            const { error: appError } = await supabase
                .from('applications')
                .update({
                    status: 'COMPLETED',
                    review_submitted: true,
                    review_media_urls: mediaUrls
                })
                .eq('id', applicationId);

            if (appError) throw appError;

            // 2. reviews 테이블에 레코드 생성 (관리자 확인용)
            const { error: reviewError } = await supabase
                .from('reviews')
                .insert({
                    user_id: user.id,
                    campaign_id: campaignId,
                    post_url: reviewUrl,
                    description: reviewContent,
                    thumbnail_url: mediaUrls[0] || null,
                    status: 'PENDING', // 관리자 승출 대기
                    platform: 'LINK' // 도메인에 따라 유추 가능하지만 일단 LINK로 저장
                });

            if (reviewError) throw reviewError;

            // 3. 알림 생성 (인플루언서 본인)
            await supabase.from('notifications').insert({
                user_id: user.id,
                type: 'CAMPAIGN_REVIEW_SUBMITTED',
                title: '✅ 리뷰 제출 완료',
                content: `[${campaignTitle}] 캠페인 리뷰를 성공적으로 제출했습니다. 관리자 확인 후 절차가 진행됩니다.`,
                link: '/dashboard/influencer/campaigns'
            });

            // 4. 알림 생성 (광고주/제작자)
            if (creatorId) {
                await supabase.from('notifications').insert({
                    user_id: creatorId,
                    type: 'CAMPAIGN_REVIEW_RECEIVED',
                    title: '📷 새로운 리뷰 도착',
                    content: `[${campaignTitle}] 캠페인에 새로운 리뷰가 제출되었습니다. 검토를 시작해 주세요.`,
                    link: `/dashboard/advertiser/reviews?campaignId=${campaignId}`
                });

                // 5. 광고주에게 카카오 알림톡 발송
                try {
                    const { data: advertiserData } = await supabase
                        .from('profiles')
                        .select('nickname, phone_number')
                        .eq('id', creatorId)
                        .single();

                    if (advertiserData?.phone_number) {
                        const { sendReviewSubmittedAlimtalk } = await import('@/lib/alimtalk');
                        const { data: influencerData } = await supabase
                            .from('profiles')
                            .select('nickname')
                            .eq('id', user.id)
                            .single();

                        const alimtalkResult = await sendReviewSubmittedAlimtalk(
                            advertiserData.phone_number,
                            advertiserData.nickname || '광고주',
                            campaignTitle,
                            influencerData?.nickname || '인플루언서',
                            reviewUrl
                        );

                        if (!alimtalkResult.success) {
                            console.warn('광고주 알림톡 발송 실패:', alimtalkResult.error);
                        }
                    }
                } catch (error) {
                    console.error('광고주 알림톡 발송 중 오류:', error);
                }
            }

            toast.success('리뷰가 성공적으로 등록되었습니다!');
            onSuccess();
            onClose();
            // Reset state
            setReviewUrl('');
            setReviewContent('');
            setMediaUrls([]);
        } catch (error: any) {
            console.error('Submission error:', error);
            toast.error('리뷰 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-slate-900 text-white">
                    <DialogTitle className="text-xl font-black flex items-center gap-2">
                        <Camera className="text-rose-400" /> 리뷰 등록하기
                    </DialogTitle>
                    <p className="text-slate-400 text-sm font-medium mt-1">{campaignTitle}</p>
                </DialogHeader>

                <div className="p-6 space-y-6 bg-white">
                    <div className="space-y-2">
                        <Label htmlFor="reviewUrl" className="text-sm font-black text-slate-700 flex items-center gap-1.5">
                            <LinkIcon size={14} className="text-rose-500" /> 리뷰 주소 (URL)
                        </Label>
                        <Input
                            id="reviewUrl"
                            placeholder="https://blog.naver.com/..."
                            value={reviewUrl}
                            onChange={(e) => setReviewUrl(e.target.value)}
                            className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-rose-500 focus:border-rose-500 font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reviewContent" className="text-sm font-black text-slate-700">리뷰 한줄평 (선택)</Label>
                        <Textarea
                            id="reviewContent"
                            placeholder="제품에 대한 간단한 소감을 남겨주세요."
                            value={reviewContent}
                            onChange={(e) => setReviewContent(e.target.value)}
                            className="rounded-xl bg-slate-50 border-slate-200 focus:ring-rose-500 focus:border-rose-500 min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-black text-slate-700 flex items-center justify-between">
                            <span>리뷰 사진/영상 첨부 (최대 5개)</span>
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{mediaUrls.length} / 5</span>
                        </Label>

                        <div className="grid grid-cols-5 gap-2">
                            {mediaUrls.map((url, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-100 group">
                                    <img src={url} alt={`media-${index}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeMedia(url)}
                                        className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {mediaUrls.length < 5 && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-rose-400 hover:text-rose-400 transition-all bg-slate-50/50"
                                >
                                    {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                                    <span className="text-[10px] font-bold mt-1">추가</span>
                                </button>
                            )}
                        </div>
                        <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleMediaUpload}
                        />
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            ※ 증빙용 사진 및 영상을 업로드해 주세요. (관리자 확인용)
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-50 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !reviewUrl.trim()}
                        className="flex-[2] h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-500/20 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                        리뷰 등록 완료
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
