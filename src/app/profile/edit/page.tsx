'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types/database';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, Mail, Phone, Globe, User, Settings, Heart, ChevronRight, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import DashboardSidebar from '@/components/DashboardSidebar';

// 온보딩 모달과 동일한 상수 재사용
const PLATFORMS = [
    { id: 'BLOG', name: '블로거', icon: '📝', color: 'bg-emerald-500' },
    { id: 'YOUTUBE', name: '유튜버', icon: '🎥', color: 'bg-red-500' },
    { id: 'INSTAGRAM', name: '인스타그래머', icon: '📸', color: 'bg-pink-500' },
    { id: 'TIKTOK', name: '틱톡커', icon: '🎵', color: 'bg-slate-900' },
];

const REGIONS = [
    { id: 'seoul', name: '서울', emoji: '🏙️' },
    { id: 'gyeonggi', name: '경기', emoji: '🏘️' },
    { id: 'incheon', name: '인천', emoji: '🌊' },
    { id: 'busan', name: '부산', emoji: '🏖️' },
    { id: 'daegu', name: '대구', emoji: '🌆' },
    { id: 'gwangju', name: '광주', emoji: '🌃' },
    { id: 'daejeon', name: '대전', emoji: '🏢' },
    { id: 'ulsan', name: '울산', emoji: '🏭' },
    { id: 'sejong', name: '세종', emoji: '🏛️' },
    { id: 'gangwon', name: '강원', emoji: '⛰️' },
    { id: 'chungbuk', name: '충북', emoji: '🌲' },
    { id: 'chungnam', name: '충남', emoji: '🌾' },
    { id: 'jeonbuk', name: '전북', emoji: '🌿' },
    { id: 'jeonnam', name: '전남', emoji: '🌊' },
    { id: 'gyeongbuk', name: '경북', emoji: '🏔️' },
    { id: 'gyeongnam', name: '경남', emoji: '🌄' },
    { id: 'jeju', name: '제주', emoji: '🍊' },
    { id: 'nationwide', name: '전국', emoji: '🇰🇷' },
];

const CATEGORIES = [
    { id: 'food', name: '식품/음료', icon: '🍽️', desc: '건강식품, 간편식, 음료' },
    { id: 'beauty', name: '뷰티/화장품', icon: '💄', desc: '스킨케어, 메이크업, 헤어' },
    { id: 'baby', name: '육아/유아용품', icon: '👶', desc: '기저귀, 장난감, 유아식' },
    { id: 'living', name: '생활/주방', icon: '🏠', desc: '주방용품, 생활용품' },
    { id: 'pet', name: '반려동물', icon: '🐕', desc: '사료, 간식, 용품' },
    { id: 'digital', name: '디지털/가전', icon: '📱', desc: '스마트폰, 가전제품' },
    { id: 'fashion', name: '패션/잡화', icon: '👕', desc: '의류, 신발, 가방' },
    { id: 'sports', name: '스포츠/레저', icon: '🏃', desc: '운동용품, 아웃도어' },
    { id: 'health', name: '건강/의료', icon: '💊', desc: '건강식품, 의료기기' },
];

type TabType = 'basic' | 'interests';

function ProfileEditContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = (searchParams.get('tab') as TabType) || 'basic';

    // SNS 접두사 상수
    const BLOG_PREFIX = "blog.naver.com/";
    const INSTA_PREFIX = "instagram.com/";
    const YOUTUBE_PREFIX = "youtube.com/";
    const TIKTOK_PREFIX = "tiktok.com/@";

    // URL에서 아이디만 추출하는 함수
    const extractId = (url: string, prefix: string) => {
        if (!url) return "";
        let clean = url.replace(/^https?:\/\//, "");
        if (clean.startsWith(prefix)) {
            return clean.replace(prefix, "").split('?')[0].split('/')[0];
        }
        // prefix 없이 입력된 경우나 다른 형식인 경우 마지막 경로 세그먼트 추출 시도
        if (clean.includes('/')) {
            const parts = clean.split('/');
            return parts[parts.length - 1] || clean;
        }
        return clean;
    };

    const { profile: globalProfile, fetchProfile } = useAuthStore();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [providers, setProviders] = useState<string[]>([]);
    const [socialSaveStatus, setSocialSaveStatus] = useState<{
        blog: 'idle' | 'saving' | 'saved';
        instagram: 'idle' | 'saving' | 'saved';
        youtube: 'idle' | 'saving' | 'saved';
        tiktok: 'idle' | 'saving' | 'saved';
    }>({
        blog: 'idle',
        instagram: 'idle',
        youtube: 'idle',
        tiktok: 'idle'
    });

    // 기본 정보
    const [formData, setFormData] = useState({
        nickname: '',
        phone_number: '',
        company_name: '',
        avatar_url: ''
    });

    // 소셜 링크 정보
    const [socialLinks, setSocialLinks] = useState({
        blog: '',
        instagram: '',
        youtube: '',
        tiktok: '',
        other: ''
    });

    // 자동 저장 타이머 ref
    const blogSaveTimer = useRef<NodeJS.Timeout | null>(null);
    const instaSaveTimer = useRef<NodeJS.Timeout | null>(null);
    const youtubeSaveTimer = useRef<NodeJS.Timeout | null>(null);
    const tiktokSaveTimer = useRef<NodeJS.Timeout | null>(null);

    // 관심사 정보
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // 전화번호 포맷팅 함수
    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        if (numbers.length <= 11) return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        setFormData({ ...formData, phone_number: formatted });
    };

    useEffect(() => {
        const loadProfileData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    setProfile(data);
                    setProviders(user.app_metadata?.providers || []);
                    setFormData({
                        nickname: data.nickname || '',
                        phone_number: data.phone_number || '',
                        company_name: data.company_name || '',
                        avatar_url: data.avatar_url || ''
                    });

                    setSocialLinks({
                        blog: extractId(data.blog_url || data.sns_url || '', BLOG_PREFIX),
                        instagram: extractId(data.instagram_url || '', INSTA_PREFIX),
                        youtube: extractId(data.youtube_url || '', YOUTUBE_PREFIX),
                        tiktok: extractId(data.tiktok_url || '', TIKTOK_PREFIX),
                        other: ''
                    });

                    setSelectedPlatforms(data.preferred_platforms || []);
                    setSelectedRegions(data.preferred_regions || []);
                    setSelectedCategories(data.interests || []);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('프로필을 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadProfileData();

        // Cleanup timers on unmount
        return () => {
            if (blogSaveTimer.current) clearTimeout(blogSaveTimer.current);
            if (instaSaveTimer.current) clearTimeout(instaSaveTimer.current);
            if (youtubeSaveTimer.current) clearTimeout(youtubeSaveTimer.current);
            if (tiktokSaveTimer.current) clearTimeout(tiktokSaveTimer.current);
        };
    }, [router]);

    const handleBasicInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const updateData: any = {
                nickname: formData.nickname,
                phone_number: formData.phone_number,
                company_name: formData.company_name,
                avatar_url: formData.avatar_url
            };

            const cleanBlogId = socialLinks.blog.trim().replace(/^https?:\/\/blog\.naver\.com\//, "");
            const cleanInstaId = socialLinks.instagram.trim().replace(/^https?:\/\/instagram\.com\//, "");
            const cleanYoutubeId = socialLinks.youtube.trim().replace(/^https?:\/\/youtube\.com\//, "");
            const cleanTiktokId = socialLinks.tiktok.trim().replace(/^https?:\/\/tiktok\.com\/@/, "");

            if (cleanBlogId) {
                updateData.blog_url = `https://blog.naver.com/${cleanBlogId}`;
                updateData.sns_url = updateData.blog_url; // 하위 호환성 유지
            }
            if (cleanInstaId) {
                updateData.instagram_url = `https://instagram.com/${cleanInstaId}`;
            }
            if (cleanYoutubeId) {
                updateData.youtube_url = `https://youtube.com/${cleanYoutubeId.startsWith('@') ? cleanYoutubeId : '@' + cleanYoutubeId}`;
            }
            if (cleanTiktokId) {
                updateData.tiktok_url = `https://tiktok.com/@${cleanTiktokId}`;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            toast.success('기본 정보가 저장되었습니다.');
            if (user.id) await fetchProfile(user.id);
        } catch (error: any) {
            toast.error(error?.message || '업데이트에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 소셜 링크 자동 저장 함수
    const autoSaveSocialLink = useCallback(async (field: 'blog' | 'instagram' | 'youtube' | 'tiktok', value: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setSocialSaveStatus(prev => ({ ...prev, [field]: 'saving' }));

            const updateData: any = {};

            if (field === 'blog') {
                const cleanBlogId = value.trim().replace(/^https?:\/\/blog\.naver\.com\//, "");
                if (cleanBlogId) {
                    updateData.blog_url = `https://blog.naver.com/${cleanBlogId}`;
                    updateData.sns_url = updateData.blog_url;
                } else {
                    updateData.blog_url = null;
                    updateData.sns_url = null;
                }
            } else if (field === 'instagram') {
                const cleanInstaId = value.trim().replace(/^https?:\/\/instagram\.com\//, "");
                if (cleanInstaId) {
                    updateData.instagram_url = `https://instagram.com/${cleanInstaId}`;
                } else {
                    updateData.instagram_url = null;
                }
            } else if (field === 'youtube') {
                const cleanYoutubeId = value.trim().replace(/^https?:\/\/youtube\.com\//, "");
                if (cleanYoutubeId) {
                    updateData.youtube_url = `https://youtube.com/${cleanYoutubeId.startsWith('@') ? cleanYoutubeId : '@' + cleanYoutubeId}`;
                } else {
                    updateData.youtube_url = null;
                }
            } else if (field === 'tiktok') {
                const cleanTiktokId = value.trim().replace(/^https?:\/\/tiktok\.com\/@/, "");
                if (cleanTiktokId) {
                    updateData.tiktok_url = `https://tiktok.com/@${cleanTiktokId}`;
                } else {
                    updateData.tiktok_url = null;
                }
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            setSocialSaveStatus(prev => ({ ...prev, [field]: 'saved' }));

            // "저장됨" 표시를 2초 후 제거
            setTimeout(() => {
                setSocialSaveStatus(prev => ({ ...prev, [field]: 'idle' }));
            }, 2000);

            if (user.id) await fetchProfile(user.id);
        } catch (error: any) {
            console.error('Auto-save error:', error);
            setSocialSaveStatus(prev => ({ ...prev, [field]: 'idle' }));
            toast.error('저장에 실패했습니다.');
        }
    }, [fetchProfile]);

    // 소셜 링크 변경 핸들러 (debounced)
    const handleSocialLinkChange = useCallback((field: 'blog' | 'instagram' | 'youtube' | 'tiktok', value: string) => {
        setSocialLinks(prev => ({ ...prev, [field]: value }));

        // 기존 타이머 취소
        let timer;
        if (field === 'blog') timer = blogSaveTimer;
        else if (field === 'instagram') timer = instaSaveTimer;
        else if (field === 'youtube') timer = youtubeSaveTimer;
        else if (field === 'tiktok') timer = tiktokSaveTimer;

        if (timer && timer.current) clearTimeout(timer.current);

        // 1.5초 후 자동 저장
        if (timer) {
            timer.current = setTimeout(() => {
                autoSaveSocialLink(field, value);
            }, 1500);
        }
    }, [autoSaveSocialLink]);

    const handleInterestsSubmit = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .update({
                    preferred_regions: selectedRegions,
                    interests: selectedCategories
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('관심사 설정이 저장되었습니다.');
            if (user.id) await fetchProfile(user.id);
        } catch (error: any) {
            toast.error(error?.message || '업데이트에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const toggleRegion = (id: string) => {
        if (id === 'nationwide') {
            setSelectedRegions(['nationwide']);
        } else {
            const filtered = selectedRegions.filter(r => r !== 'nationwide');
            if (filtered.includes(id)) {
                setSelectedRegions(filtered.filter(r => r !== id));
            } else if (filtered.length < 3) {
                setSelectedRegions([...filtered, id]);
            }
        }
    };

    const toggleCategory = (id: string) => {
        setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : prev.length < 3 ? [...prev, id] : prev);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-500">정보를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar
                userType="INFLUENCER"
                userName={profile?.nickname || '사용자'}
                links={[
                    { href: '/dashboard/influencer', label: '대시보드' },
                    { href: '/dashboard/influencer/campaigns', label: '나의 캠페인' },
                    { href: '/dashboard/influencer/favorites', label: '관심 캠페인' },
                    {
                        href: '/profile/edit',
                        label: '계정 설정',
                        subLinks: [
                            { href: '/profile/edit?tab=basic', label: '기본 정보' },
                            { href: '/profile/edit?tab=interests', label: '관심사 설정' }
                        ]
                    },
                    { href: '/contact', label: '1:1 문의' }
                ]}
            />

            <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50/50">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">설정</h1>
                        <p className="text-gray-500 mt-1">회원님의 소중한 정보를 안전하게 관리하세요.</p>
                    </div>

                    <div className="w-full">
                        {activeTab === 'basic' ? (
                            <form onSubmit={handleBasicInfoSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden rounded-3xl">
                                    <CardHeader className="bg-gradient-to-r from-rose-500 to-rose-600 text-white pb-12">
                                        <CardTitle className="text-xl">기본 프로필</CardTitle>
                                        <CardDescription className="text-rose-100">공개되는 프로필 정보를 설정합니다.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="relative pt-0">
                                        <div className="flex justify-center -translate-y-12 mb-[-3rem]">
                                            <div className="relative group">
                                                <Avatar
                                                    src={formData.avatar_url}
                                                    fallback={formData.nickname?.[0] || '?'}
                                                    className="h-24 w-24 ring-4 ring-white shadow-xl text-2xl"
                                                />
                                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                    <Camera className="text-white w-6 h-6" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-6 mt-8">
                                            <div className="grid gap-2">
                                                <Label htmlFor="avatar_url" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <Camera className="w-4 h-4 text-rose-500" />
                                                    프로필 이미지 URL
                                                </Label>
                                                <Input
                                                    id="avatar_url"
                                                    placeholder="이미지 주소를 입력하세요"
                                                    value={formData.avatar_url}
                                                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                                    className="bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-rose-500 h-12 rounded-xl transition-all"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="nickname" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <User className="w-4 h-4 text-rose-500" />
                                                    닉네임 <span className="text-rose-500">*</span>
                                                </Label>
                                                <Input
                                                    id="nickname"
                                                    placeholder="사용할 닉네임을 입력하세요"
                                                    value={formData.nickname}
                                                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                                    required
                                                    className="bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-rose-500 h-12 rounded-xl transition-all"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                        <Mail className="w-4 h-4 text-rose-500" />
                                                        이메일 (계정 정보)
                                                    </Label>
                                                    <div className="flex gap-2">
                                                        {providers.includes('kakao') && (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#FEE500] text-[#3c1e1e] border border-[#FEE500] shadow-sm">
                                                                카카오 연동됨
                                                            </span>
                                                        )}
                                                        {providers.includes('google') && (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-gray-700 border border-gray-200 shadow-sm">
                                                                Google 연동됨
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Input
                                                    value={profile?.email || ''}
                                                    disabled
                                                    className="bg-slate-50 text-slate-400 border-none h-12 rounded-xl mt-1 opacity-60"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl h-full">
                                    <CardHeader>
                                        <CardTitle className="text-xl">추가 정보</CardTitle>
                                        <CardDescription>활동 및 연락을 위한 기본 정보를 관리합니다.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone_number" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                <Phone className="w-4 h-4 text-rose-500" />
                                                연락처
                                            </Label>
                                            <Input
                                                id="phone_number"
                                                type="tel"
                                                placeholder="010-0000-0000"
                                                value={formData.phone_number}
                                                onChange={handlePhoneChange}
                                                maxLength={13}
                                                className="bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-rose-500 h-12 rounded-xl"
                                            />
                                        </div>

                                        <div className="grid gap-4">
                                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-rose-500" />
                                                활동 소셜 링크
                                            </Label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between ml-1">
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase">Naver Blog</span>
                                                        {socialSaveStatus.blog === 'saving' && (
                                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin"></span>
                                                                저장 중...
                                                            </span>
                                                        )}
                                                        {socialSaveStatus.blog === 'saved' && (
                                                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in zoom-in">
                                                                <Check size={12} />
                                                                저장됨
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center border-[2.5px] border-emerald-500/10 rounded-xl focus-within:border-emerald-500/50 focus-within:bg-white transition-all overflow-hidden bg-slate-50/50">
                                                        <div className="bg-slate-100 px-3 h-12 flex items-center justify-center text-[11px] font-bold border-r border-slate-200 shrink-0 text-slate-500">
                                                            {BLOG_PREFIX}
                                                        </div>
                                                        <Input
                                                            placeholder="아이디 입력"
                                                            value={socialLinks.blog}
                                                            onChange={(e) => handleSocialLinkChange('blog', e.target.value)}
                                                            className="bg-transparent border-none rounded-none h-12 focus-visible:ring-0 shadow-none font-medium"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between ml-1">
                                                        <span className="text-[10px] font-black text-pink-600 uppercase">Instagram</span>
                                                        {socialSaveStatus.instagram === 'saving' && (
                                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-pink-500 rounded-full animate-spin"></span>
                                                                저장 중...
                                                            </span>
                                                        )}
                                                        {socialSaveStatus.instagram === 'saved' && (
                                                            <span className="text-[10px] font-bold text-pink-600 flex items-center gap-1 animate-in fade-in zoom-in">
                                                                <Check size={12} />
                                                                저장됨
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center border-[2.5px] border-pink-500/10 rounded-xl focus-within:border-pink-500/50 focus-within:bg-white transition-all overflow-hidden bg-slate-50/50">
                                                        <div className="bg-slate-100 px-3 h-12 flex items-center justify-center text-[11px] font-bold border-r border-slate-200 shrink-0 text-slate-500">
                                                            {INSTA_PREFIX}
                                                        </div>
                                                        <Input
                                                            placeholder="아이디 입력"
                                                            value={socialLinks.instagram}
                                                            onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                                                            className="bg-transparent border-none rounded-none h-12 focus-visible:ring-0 shadow-none font-medium"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between ml-1">
                                                        <span className="text-[10px] font-black text-red-600 uppercase">YouTube</span>
                                                        {socialSaveStatus.youtube === 'saving' && (
                                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin"></span>
                                                                저장 중...
                                                            </span>
                                                        )}
                                                        {socialSaveStatus.youtube === 'saved' && (
                                                            <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 animate-in fade-in zoom-in">
                                                                <Check size={12} />
                                                                저장됨
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center border-[2.5px] border-red-500/10 rounded-xl focus-within:border-red-500/50 focus-within:bg-white transition-all overflow-hidden bg-slate-50/50">
                                                        <div className="bg-slate-100 px-3 h-12 flex items-center justify-center text-[11px] font-bold border-r border-slate-200 shrink-0 text-slate-500">
                                                            {YOUTUBE_PREFIX}
                                                        </div>
                                                        <Input
                                                            placeholder="채널 핸들 (@아이디)"
                                                            value={socialLinks.youtube}
                                                            onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                                                            className="bg-transparent border-none rounded-none h-12 focus-visible:ring-0 shadow-none font-medium"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between ml-1">
                                                        <span className="text-[10px] font-black text-slate-900 uppercase">TikTok</span>
                                                        {socialSaveStatus.tiktok === 'saving' && (
                                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
                                                                저장 중...
                                                            </span>
                                                        )}
                                                        {socialSaveStatus.tiktok === 'saved' && (
                                                            <span className="text-[10px] font-bold text-slate-900 flex items-center gap-1 animate-in fade-in zoom-in">
                                                                <Check size={12} />
                                                                저장됨
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center border-[2.5px] border-slate-900/10 rounded-xl focus-within:border-slate-900/50 focus-within:bg-white transition-all overflow-hidden bg-slate-50/50">
                                                        <div className="bg-slate-100 px-3 h-12 flex items-center justify-center text-[11px] font-bold border-r border-slate-200 shrink-0 text-slate-500">
                                                            {TIKTOK_PREFIX}
                                                        </div>
                                                        <Input
                                                            placeholder="아이디 입력"
                                                            value={socialLinks.tiktok}
                                                            onChange={(e) => handleSocialLinkChange('tiktok', e.target.value)}
                                                            className="bg-transparent border-none rounded-none h-12 focus-visible:ring-0 shadow-none font-medium"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-8 text-lg font-bold bg-rose-500 hover:bg-rose-600 transition-all rounded-2xl shadow-xl shadow-rose-500/20 active:scale-[0.98]"
                                >
                                    {saving ? '저장 중...' : '기본 정보 업데이트하기'}
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                                    <CardHeader className="bg-slate-900 text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl">활동 플랫폼</CardTitle>
                                                <CardDescription className="text-slate-400">주로 활동하는 채널을 알려주세요.</CardDescription>
                                            </div>
                                            <div className="bg-rose-500 px-3 py-1 rounded-full text-xs font-bold">필수</div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {PLATFORMS.map(platform => (
                                                <button
                                                    key={platform.id}
                                                    type="button"
                                                    onClick={() => togglePlatform(platform.id)}
                                                    className={`relative group p-6 rounded-2xl border-2 transition-all duration-300 ${selectedPlatforms.includes(platform.id)
                                                        ? 'border-rose-500 bg-rose-50 shadow-lg scale-[1.05]'
                                                        : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {selectedPlatforms.includes(platform.id) && (
                                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                                                            <Check size={14} className="text-white" />
                                                        </div>
                                                    )}
                                                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{platform.icon}</div>
                                                    <div className="text-sm font-bold text-slate-800">{platform.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                                    <CardHeader>
                                        <CardTitle className="text-xl flex items-center justify-between">
                                            <span>선호 지역</span>
                                            <span className="text-sm font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                                                {selectedRegions.length} / 3 선택됨
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                            {REGIONS.map(region => (
                                                <button
                                                    key={region.id}
                                                    onClick={() => toggleRegion(region.id)}
                                                    className={`p-4 rounded-2xl border-2 transition-all group ${selectedRegions.includes(region.id)
                                                        ? 'border-rose-500 bg-rose-50 text-rose-500'
                                                        : 'border-slate-50 hover:bg-slate-50 text-slate-400'
                                                        }`}
                                                >
                                                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{region.emoji}</div>
                                                    <div className="text-[11px] font-bold">{region.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                                    <CardHeader>
                                        <CardTitle className="text-xl flex items-center justify-between">
                                            <span>관심 카테고리</span>
                                            <span className="text-sm font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                                                {selectedCategories.length} / 3 선택됨
                                            </span>
                                        </CardTitle>
                                        <CardDescription>관심 있는 분야를 최대 3개까지 선택해주세요.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {CATEGORIES.map(category => (
                                                <button
                                                    key={category.id}
                                                    type="button"
                                                    onClick={() => toggleCategory(category.id)}
                                                    disabled={
                                                        !selectedCategories.includes(category.id) &&
                                                        selectedCategories.length >= 3
                                                    }
                                                    className={`relative group p-5 rounded-2xl border-2 transition-all duration-300 text-center ${selectedCategories.includes(category.id)
                                                        ? 'border-rose-500 bg-rose-50 shadow-lg scale-[1.02]'
                                                        : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'
                                                        } disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed`}
                                                >
                                                    {selectedCategories.includes(category.id) && (
                                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                                                            <Check size={14} className="text-white" />
                                                        </div>
                                                    )}
                                                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{category.icon}</div>
                                                    <div className="text-sm font-bold text-slate-800 mb-1">{category.name}</div>
                                                    <div className="text-[10px] text-slate-400 line-clamp-1">{category.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>


                                <Button
                                    onClick={handleInterestsSubmit}
                                    disabled={saving}
                                    className="w-full py-8 text-lg font-bold bg-rose-600 hover:bg-rose-700 transition-all rounded-2xl shadow-xl shadow-rose-600/20 active:scale-[0.98]"
                                >
                                    {saving ? '관심사 저장 중...' : '매칭 관심 정보 업데이트하기'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ProfileEditPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
            <ProfileEditContent />
        </Suspense>
    );
}
