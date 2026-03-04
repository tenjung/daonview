import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Profile } from '@/types/database';

interface SnsInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    profile: Profile | null;
    onSuccess: () => void;
}

const BLOG_PREFIX = "blog.naver.com/";
const INSTA_PREFIX = "instagram.com/";
const YOUTUBE_PREFIX = "youtube.com/";
const TIKTOK_PREFIX = "tiktok.com/@";

const extractId = (url: string, prefix: string) => {
    if (!url) return "";
    let clean = url.replace(/^https?:\/\//, "");
    if (clean.startsWith(prefix)) {
        return clean.replace(prefix, "").split('?')[0].split('/')[0];
    }
    if (clean.includes('/')) {
        const parts = clean.split('/');
        return parts[parts.length - 1] || clean;
    }
    return clean;
};

export default function SnsInputModal({ isOpen, onClose, user, profile, onSuccess }: SnsInputModalProps) {
    const [saving, setSaving] = useState(false);
    const [socialLinks, setSocialLinks] = useState({
        blog: '',
        instagram: '',
        youtube: '',
        tiktok: ''
    });

    useEffect(() => {
        if (isOpen && profile) {
            setSocialLinks({
                blog: extractId(profile.blog_url || profile.sns_url || '', BLOG_PREFIX),
                instagram: extractId(profile.instagram_url || '', INSTA_PREFIX),
                youtube: extractId(profile.youtube_url || '', YOUTUBE_PREFIX),
                tiktok: extractId(profile.tiktok_url || '', TIKTOK_PREFIX)
            });
        }
    }, [isOpen, profile]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setSaving(true);
        try {
            const updateData: any = {};
            
            const cleanBlogId = socialLinks.blog.trim().replace(/^https?:\/\/blog\.naver\.com\//, "");
            const cleanInstaId = socialLinks.instagram.trim().replace(/^https?:\/\/instagram\.com\//, "");
            const cleanYoutubeId = socialLinks.youtube.trim().replace(/^https?:\/\/youtube\.com\//, "");
            const cleanTiktokId = socialLinks.tiktok.trim().replace(/^https?:\/\/tiktok\.com\/@/, "");

            if (cleanBlogId) {
                updateData.blog_url = `https://blog.naver.com/${cleanBlogId}`;
                updateData.sns_url = updateData.blog_url;
            } else {
                updateData.blog_url = null;
                updateData.sns_url = null;
            }

            if (cleanInstaId) {
                updateData.instagram_url = `https://instagram.com/${cleanInstaId}`;
            } else {
                updateData.instagram_url = null;
            }

            if (cleanYoutubeId) {
                updateData.youtube_url = `https://youtube.com/${cleanYoutubeId.startsWith('@') ? cleanYoutubeId : '@' + cleanYoutubeId}`;
            } else {
                updateData.youtube_url = null;
            }

            if (cleanTiktokId) {
                updateData.tiktok_url = `https://tiktok.com/@${cleanTiktokId}`;
            } else {
                updateData.tiktok_url = null;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;
            
            toast.success('활동 소셜 링크가 성공적으로 저장되었습니다.');
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || '저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl p-0 overflow-hidden bg-white/95 backdrop-blur-md rounded-[24px]">
                <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                            활동 소셜 링크 등록
                        </DialogTitle>
                        <p className="text-slate-400 text-sm mt-1 focus:outline-none">캠페인 신청을 위해 활동하실 SNS 계정을 등록해 주세요.</p>
                    </div>
                </div>
                
                <form onSubmit={handleSave} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <span className="text-[10px] font-black text-emerald-600 uppercase">Naver Blog</span>
                            </div>
                            <div className="flex items-center border-[2.5px] border-emerald-500/10 rounded-xl focus-within:border-emerald-500/50 focus-within:bg-white transition-all overflow-hidden bg-slate-50/50">
                                <div className="bg-slate-100 px-3 h-12 flex items-center justify-center text-[11px] font-bold border-r border-slate-200 shrink-0 text-slate-500">
                                    {BLOG_PREFIX}
                                </div>
                                <Input
                                    placeholder="아이디 입력"
                                    value={socialLinks.blog}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, blog: e.target.value })}
                                    className="bg-transparent border-none rounded-none h-12 focus-visible:ring-0 shadow-none font-medium"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <span className="text-[10px] font-black text-pink-600 uppercase">Instagram</span>
                            </div>
                            <div className="flex items-center border-[2.5px] border-pink-500/10 rounded-xl focus-within:border-pink-500/50 focus-within:bg-white transition-all overflow-hidden bg-slate-50/50">
                                <div className="bg-slate-100 px-3 h-12 flex items-center justify-center text-[11px] font-bold border-r border-slate-200 shrink-0 text-slate-500">
                                    {INSTA_PREFIX}
                                </div>
                                <Input
                                    placeholder="아이디 입력"
                                    value={socialLinks.instagram}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                                    className="bg-transparent border-none rounded-none h-12 focus-visible:ring-0 shadow-none font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <span className="text-[10px] font-black text-red-600 uppercase">YouTube</span>
                            </div>
                            <div className="flex items-center border-[2.5px] border-red-500/10 rounded-xl focus-within:border-red-500/50 focus-within:bg-white transition-all overflow-hidden bg-slate-50/50">
                                <div className="bg-slate-100 px-3 h-12 flex items-center justify-center text-[11px] font-bold border-r border-slate-200 shrink-0 text-slate-500">
                                    {YOUTUBE_PREFIX}
                                </div>
                                <Input
                                    placeholder="채널 핸들 (@아이디)"
                                    value={socialLinks.youtube}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                                    className="bg-transparent border-none rounded-none h-12 focus-visible:ring-0 shadow-none font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <span className="text-[10px] font-black text-slate-900 uppercase">TikTok</span>
                            </div>
                            <div className="flex items-center border-[2.5px] border-slate-900/10 rounded-xl focus-within:border-slate-900/50 focus-within:bg-white transition-all overflow-hidden bg-slate-50/50">
                                <div className="bg-slate-100 px-3 h-12 flex items-center justify-center text-[11px] font-bold border-r border-slate-200 shrink-0 text-slate-500">
                                    {TIKTOK_PREFIX}
                                </div>
                                <Input
                                    placeholder="아이디 입력"
                                    value={socialLinks.tiktok}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                                    className="bg-transparent border-none rounded-none h-12 focus-visible:ring-0 shadow-none font-medium"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="h-12 w-24 rounded-xl font-bold">
                            취소
                        </Button>
                        <Button type="submit" disabled={saving} className="h-12 px-8 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200">
                            {saving ? '저장 중...' : '저장하기'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
