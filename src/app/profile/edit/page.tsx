'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types/database';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, Mail, Phone, Globe, User, Settings, Heart, ChevronRight, Check } from 'lucide-react';

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

export default function ProfileEditPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('basic');

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

    // 관심사 정보
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // 전화번호 포맷팅 함수
    const formatPhoneNumber = (value: string) => {
        // 숫자만 추출
        const numbers = value.replace(/[^\d]/g, '');

        // 길이에 따라 포맷팅
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        } else if (numbers.length <= 11) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
        }

        // 11자리 초과 시 11자리까지만 사용
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    // 전화번호 입력 핸들러
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        setFormData({ ...formData, phone_number: formatted });
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    setProfile(data);
                    setFormData({
                        nickname: data.nickname || '',
                        phone_number: data.phone_number || '',
                        company_name: data.company_name || '',
                        avatar_url: data.avatar_url || ''
                    });

                    // 소셜 링크 데이터 로드 (JSON 또는 개별 필드)
                    const links = data.social_links || {};
                    setSocialLinks({
                        blog: links.blog || '',
                        instagram: links.instagram || '',
                        youtube: links.youtube || '',
                        tiktok: links.tiktok || '',
                        other: links.other || ''
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

        fetchProfile();
    }, [router]);

    const handleBasicInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('profiles')
                .update({
                    nickname: formData.nickname,
                    phone_number: formData.phone_number,
                    company_name: formData.company_name,
                    avatar_url: formData.avatar_url,
                    social_links: socialLinks
                })
                .eq('id', session.user.id);

            if (error) throw error;

            toast.success('기본 정보가 성공적으로 업데이트되었습니다.');
            window.location.reload();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('프로필 업데이트에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleInterestsSubmit = async () => {
        setSaving(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('로그인 세션이 만료되었습니다.');
                return;
            }

            // 업데이트할 데이터 로깅
            const updateData = {
                preferred_platforms: selectedPlatforms,
                preferred_regions: selectedRegions,
                interests: selectedCategories
            };
            console.log('Updating interests with data:', updateData);

            const { data, error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', session.user.id)
                .select();

            if (error) {
                console.error('Supabase error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            console.log('Update successful:', data);
            toast.success('관심사 설정이 성공적으로 업데이트되었습니다.');
        } catch (error: any) {
            console.error('Error updating interests:', error);
            console.error('Error type:', typeof error);
            console.error('Error keys:', Object.keys(error));
            toast.error(error?.message || '관심사 업데이트에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const togglePlatform = (id: string) => {
        if (selectedPlatforms.includes(id)) {
            setSelectedPlatforms(selectedPlatforms.filter(p => p !== id));
        } else {
            setSelectedPlatforms([...selectedPlatforms, id]);
        }
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
        if (selectedCategories.includes(id)) {
            setSelectedCategories(selectedCategories.filter(c => c !== id));
        } else if (selectedCategories.length < 3) {
            setSelectedCategories([...selectedCategories, id]);
        }
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
        <div className="min-h-screen bg-gray-50/50 py-8">
            <div className="container max-w-6xl px-4">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">설정</h1>
                    <p className="text-gray-500 mt-1">회원님의 소중한 정보를 안전하게 관리하세요.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* 사이드바 */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <Card className="border-none shadow-lg">
                            <CardContent className="p-4">
                                <nav className="space-y-1">
                                    <button
                                        onClick={() => setActiveTab('basic')}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'basic'
                                            ? 'bg-rose-50 text-rose-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5" />
                                            <span>기본 정보</span>
                                        </div>
                                        {activeTab === 'basic' && <ChevronRight className="w-4 h-4" />}
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('interests')}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'interests'
                                            ? 'bg-rose-50 text-rose-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Heart className="w-5 h-5" />
                                            <span>관심사 설정</span>
                                        </div>
                                        {activeTab === 'interests' && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                </nav>
                            </CardContent>
                        </Card>
                    </aside>

                    {/* 메인 컨텐츠 */}
                    <main className="flex-1">
                        {activeTab === 'basic' && (
                            <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
                                <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-rose-500 to-rose-600 text-white pb-12">
                                        <CardTitle className="text-xl">기본 프로필</CardTitle>
                                        <CardDescription className="text-rose-100">공개되는 프로필 정보를 설정합니다.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="relative pt-0">
                                        {/* Avatar Section */}
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
                                                <Label htmlFor="avatar_url" className="flex items-center gap-2">
                                                    <Camera className="w-4 h-4 text-gray-400" />
                                                    프로필 이미지 URL
                                                </Label>
                                                <Input
                                                    id="avatar_url"
                                                    placeholder="이미지 주소를 입력하세요"
                                                    value={formData.avatar_url}
                                                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                                    className="bg-gray-50/50 focus:bg-white transition-all"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="nickname" className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    닉네임 <span className="text-rose-500">*</span>
                                                </Label>
                                                <Input
                                                    id="nickname"
                                                    placeholder="사용할 닉네임을 입력하세요"
                                                    value={formData.nickname}
                                                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                                    required
                                                    className="bg-gray-50/50 focus:bg-white transition-all"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    이메일 (계정 정보)
                                                </Label>
                                                <Input
                                                    value={profile?.email || ''}
                                                    disabled
                                                    className="bg-gray-100 text-gray-500 cursor-not-allowed border-dashed"
                                                />
                                                <p className="text-[10px] text-gray-400">이메일 계정은 변경이 불가능합니다.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl shadow-gray-200/50">
                                    <CardHeader>
                                        <CardTitle className="text-xl">추가 정보</CardTitle>
                                        <CardDescription>활동 및 연락을 위한 추가 정보를 입력하세요.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-6">
                                            <div className="grid gap-2">
                                                <Label htmlFor="phone_number" className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    연락처
                                                </Label>
                                                <Input
                                                    id="phone_number"
                                                    type="tel"
                                                    placeholder="010-0000-0000"
                                                    value={formData.phone_number}
                                                    onChange={handlePhoneChange}
                                                    maxLength={13}
                                                    className="bg-gray-50/50 focus:bg-white transition-all"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 활동 소셜 링크 섹션 */}
                                <Card className="border-none shadow-xl shadow-gray-200/50">
                                    <CardHeader>
                                        <CardTitle className="text-xl">활동 소셜 링크</CardTitle>
                                        <CardDescription>활동하는 SNS 플랫폼의 링크를 입력하세요</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-6">
                                            <div className="grid gap-2">
                                                <Label htmlFor="blog_url" className="flex items-center gap-2">
                                                    <span className="text-lg">📝</span>
                                                    블로그
                                                </Label>
                                                <Input
                                                    id="blog_url"
                                                    placeholder="https://blog.naver.com/..."
                                                    value={socialLinks.blog}
                                                    onChange={(e) => setSocialLinks({ ...socialLinks, blog: e.target.value })}
                                                    className="bg-gray-50/50 focus:bg-white transition-all"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="instagram_url" className="flex items-center gap-2">
                                                    <span className="text-lg">📸</span>
                                                    인스타그램
                                                </Label>
                                                <Input
                                                    id="instagram_url"
                                                    placeholder="https://instagram.com/..."
                                                    value={socialLinks.instagram}
                                                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                                                    className="bg-gray-50/50 focus:bg-white transition-all"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="youtube_url" className="flex items-center gap-2">
                                                    <span className="text-lg">🎥</span>
                                                    유튜브
                                                </Label>
                                                <Input
                                                    id="youtube_url"
                                                    placeholder="https://youtube.com/@..."
                                                    value={socialLinks.youtube}
                                                    onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                                                    className="bg-gray-50/50 focus:bg-white transition-all"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="tiktok_url" className="flex items-center gap-2">
                                                    <span className="text-lg">🎵</span>
                                                    틱톡
                                                </Label>
                                                <Input
                                                    id="tiktok_url"
                                                    placeholder="https://tiktok.com/@..."
                                                    value={socialLinks.tiktok}
                                                    onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                                                    className="bg-gray-50/50 focus:bg-white transition-all"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="other_url" className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-gray-400" />
                                                    기타 SNS
                                                </Label>
                                                <Input
                                                    id="other_url"
                                                    placeholder="기타 SNS 링크를 입력하세요"
                                                    value={socialLinks.other}
                                                    onChange={(e) => setSocialLinks({ ...socialLinks, other: e.target.value })}
                                                    className="bg-gray-50/50 focus:bg-white transition-all"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl shadow-gray-200/50">
                                    <CardHeader>
                                        <CardTitle className="text-xl">기타 정보</CardTitle>
                                        <CardDescription>추가 정보를 입력하세요</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-6">

                                            {profile?.role === 'ADVERTISER' && (
                                                <div className="grid gap-2">
                                                    <Label htmlFor="company_name" className="flex items-center gap-2">
                                                        회사명/브랜드명
                                                    </Label>
                                                    <Input
                                                        id="company_name"
                                                        placeholder="회사 이름을 입력하세요"
                                                        value={formData.company_name}
                                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                                        className="bg-gray-50/50 focus:bg-white transition-all"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 py-6 text-base font-bold text-gray-500 hover:bg-gray-100 transition-all rounded-xl"
                                        onClick={() => router.back()}
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-[2] py-6 text-base font-bold bg-rose-500 hover:bg-rose-600 transition-all rounded-xl shadow-lg shadow-rose-500/20"
                                    >
                                        {saving ? '저장 중...' : '변경사항 저장하기'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'interests' && (
                            <div className="space-y-6">
                                {/* 활동 플랫폼 */}
                                <Card className="border-none shadow-xl shadow-gray-200/50">
                                    <CardHeader>
                                        <CardTitle className="text-xl">활동 플랫폼</CardTitle>
                                        <CardDescription>주로 활동하는 플랫폼을 선택해주세요 (중복 가능)</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {PLATFORMS.map(platform => (
                                                <button
                                                    key={platform.id}
                                                    type="button"
                                                    onClick={() => togglePlatform(platform.id)}
                                                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${selectedPlatforms.includes(platform.id)
                                                        ? 'border-primary bg-rose-50 shadow-lg scale-102'
                                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {selectedPlatforms.includes(platform.id) && (
                                                        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                                            <Check size={14} className="text-white" />
                                                        </div>
                                                    )}
                                                    <div className="text-5xl mb-3">{platform.icon}</div>
                                                    <div className="text-lg font-bold text-gray-900">{platform.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 선호 지역 */}
                                <Card className="border-none shadow-xl shadow-gray-200/50">
                                    <CardHeader>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            선호 지역
                                            <span className="text-sm font-bold text-primary">
                                                [{selectedRegions.length}/3]
                                            </span>
                                        </CardTitle>
                                        <CardDescription>캠페인 참여를 원하는 지역을 최대 3곳 선택해주세요</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                            {REGIONS.map(region => (
                                                <button
                                                    key={region.id}
                                                    type="button"
                                                    onClick={() => toggleRegion(region.id)}
                                                    disabled={
                                                        !selectedRegions.includes(region.id) &&
                                                        selectedRegions.length >= 3 &&
                                                        !selectedRegions.includes('nationwide')
                                                    }
                                                    className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${selectedRegions.includes(region.id)
                                                        ? 'border-primary bg-rose-50 shadow-sm'
                                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                        } disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed`}
                                                >
                                                    {selectedRegions.includes(region.id) && (
                                                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                                                            <Check size={10} className="text-white" />
                                                        </div>
                                                    )}
                                                    <div className="text-xl mb-0.5">{region.emoji}</div>
                                                    <div className="text-[10px] font-bold text-gray-900 whitespace-nowrap">{region.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 관심 분야 */}
                                <Card className="border-none shadow-xl shadow-gray-200/50">
                                    <CardHeader>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            관심 분야
                                            <span className="text-sm font-bold text-primary">
                                                [{selectedCategories.length}/3]
                                            </span>
                                        </CardTitle>
                                        <CardDescription>관심있는 분야를 최대 3개 선택해주세요</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {CATEGORIES.map(category => (
                                                <button
                                                    key={category.id}
                                                    type="button"
                                                    onClick={() => toggleCategory(category.id)}
                                                    disabled={
                                                        !selectedCategories.includes(category.id) &&
                                                        selectedCategories.length >= 3
                                                    }
                                                    className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-left ${selectedCategories.includes(category.id)
                                                        ? 'border-primary bg-rose-50 shadow-md'
                                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                        } disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed`}
                                                >
                                                    {selectedCategories.includes(category.id) && (
                                                        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                                            <Check size={14} className="text-white" />
                                                        </div>
                                                    )}
                                                    <div className="text-4xl mb-2">{category.icon}</div>
                                                    <div className="text-base font-bold text-gray-900 mb-1">{category.name}</div>
                                                    <div className="text-xs text-gray-400 line-clamp-1">{category.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 py-6 text-base font-bold text-gray-500 hover:bg-gray-100 transition-all rounded-xl"
                                        onClick={() => router.back()}
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleInterestsSubmit}
                                        disabled={saving}
                                        className="flex-[2] py-6 text-base font-bold bg-rose-500 hover:bg-rose-600 transition-all rounded-xl shadow-lg shadow-rose-500/20"
                                    >
                                        {saving ? '저장 중...' : '관심사 저장하기'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
