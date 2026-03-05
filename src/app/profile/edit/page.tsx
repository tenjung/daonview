'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, Mail, Phone, Globe, User, Settings, Heart, ChevronRight, Check, MapPin, CreditCard, Search, Edit2, Lock, Building2, FileText, ShieldCheck, AlertTriangle } from 'lucide-react';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { useAuthStore } from '@/store/authStore';
import DashboardSidebar from '@/components/DashboardSidebar';
import { ADVERTISER_LINKS, INFLUENCER_LINKS } from '@/constants/navigation';
import {
    buildPreferredPlatforms,
    CREATOR_PLATFORM_OPTIONS,
    normalizeCreatorPlatforms,
    type CreatorPlatformId,
    PROFILE_MODES,
    type ProfileMode,
    resolveProfileModeFromPlatforms,
} from '@/constants/profilePlatforms';

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

type TabType = 'basic' | 'interests' | 'payout';

const BANK_LIST = [
    { name: '카카오뱅크', color: 'bg-[#FEE500]', text: 'text-[#3c1e1e]' },
    { name: '토스뱅크', color: 'bg-[#0050FF]', text: 'text-white' },
    { name: '국민은행', color: 'bg-[#ffbc00]', text: 'text-black' },
    { name: '신한은행', color: 'bg-[#003e94]', text: 'text-white' },
    { name: '우리은행', color: 'bg-[#0067ac]', text: 'text-white' },
    { name: '하나은행', color: 'bg-[#008485]', text: 'text-white' },
    { name: 'NH농협은행', color: 'bg-[#00a35c]', text: 'text-white' },
    { name: '기업은행', color: 'bg-[#0050a1]', text: 'text-white' },
    { name: '케이뱅크', color: 'bg-[#000000]', text: 'text-white' },
    { name: '우체국', color: 'bg-[#ed1c24]', text: 'text-white' },
    { name: 'SC제일은행', color: 'bg-[#004a99]', text: 'text-white' },
    { name: '부산은행', color: 'bg-[#ed1c24]', text: 'text-white' },
    { name: '대구은행', color: 'bg-[#00a0e9]', text: 'text-white' },
    { name: '경남은행', color: 'bg-[#ed1c24]', text: 'text-white' },
    { name: '광주은행', color: 'bg-[#0056a4]', text: 'text-white' },
    { name: '전북은행', color: 'bg-[#0056a4]', text: 'text-white' },
    { name: '제주은행', color: 'bg-[#0056a4]', text: 'text-white' },
    { name: '한국씨티은행', color: 'bg-[#004a99]', text: 'text-white' },
    { name: '외한은행', color: 'bg-[#008485]', text: 'text-white' },
];

function ProfileEditContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
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

    const { user: authUser, isInitialized, fetchProfile, signOut } = useAuthStore();
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
        name: '',
        phone_number: '',
        company_name: '',
        avatar_url: '',
        // 배송 및 정산 정보
        bank_name: '',
        account_number: '',
        account_holder: '',
        zip_code: '',
        address_base: '',
        address_detail: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);

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
    const [profileMode, setProfileMode] = useState<ProfileMode>(PROFILE_MODES.CREATOR);
    const [selectedPlatforms, setSelectedPlatforms] = useState<CreatorPlatformId[]>([]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const initializedRef = useRef(false);

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

    const [debugError, setDebugError] = useState('');
    const [showWithdrawalConfirm, setShowWithdrawalConfirm] = useState(false);
    const [withdrawConfirmText, setWithdrawConfirmText] = useState('');
    const [withdrawAgreement, setWithdrawAgreement] = useState(false);
    const [withdrawReason, setWithdrawReason] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);

    const WITHDRAWAL_CONFIRM_KEYWORD = '회원탈퇴';
    const canProceedWithdrawal = withdrawAgreement && withdrawConfirmText.trim() === WITHDRAWAL_CONFIRM_KEYWORD;

    useEffect(() => {
        if (!isInitialized) return;
        if (initializedRef.current) return;

        if (!authUser) {
            const currentUrl = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
            router.push(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
            return;
        }

        const loadProfileData = async () => {
            initializedRef.current = true;
            try {
                // 타임아웃 10초 설정
                const fetchPromise = supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .maybeSingle();

                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase 요청 타임아웃')), 10000));
                
                const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

                if (error) throw error;

                let profileData = data;

                if (!profileData) {
                    const fallbackEmail = authUser.email || '';
                    const newProfile = {
                        id: authUser.id,
                        nickname: authUser.user_metadata?.name || (fallbackEmail ? fallbackEmail.split('@')[0] : '익명사용자'),
                        email: fallbackEmail,
                        role: 'INFLUENCER'
                    };
                    const { data: inserted, error: insertError } = await supabase
                        .from('profiles')
                        .insert([newProfile])
                        .select()
                        .maybeSingle();
                        
                    if (insertError) {
                        console.error('Initial profile creation failed:', insertError);
                        throw insertError;
                    }
                    if (inserted) {
                        profileData = inserted;
                    }
                }

                if (profileData) {
                    setProfile(profileData);
                    setProviders(authUser.app_metadata?.providers || []);
                    setFormData({
                        nickname: profileData.nickname || '',
                        name: profileData.name || '',
                        phone_number: profileData.phone_number || '',
                        company_name: profileData.company_name || '',
                        avatar_url: profileData.avatar_url || '',
                        bank_name: profileData.bank_name || '',
                        account_number: profileData.account_number || '',
                        account_holder: profileData.account_holder || '',
                        zip_code: profileData.zip_code || '',
                        address_base: profileData.address_base || '',
                        address_detail: profileData.address_detail || ''
                    });

                    setSocialLinks({
                        blog: extractId(profileData.blog_url || profileData.sns_url || '', BLOG_PREFIX),
                        instagram: extractId(profileData.instagram_url || '', INSTA_PREFIX),
                        youtube: extractId(profileData.youtube_url || '', YOUTUBE_PREFIX),
                        tiktok: extractId(profileData.tiktok_url || '', TIKTOK_PREFIX),
                        other: ''
                    });

                    setProfileMode(resolveProfileModeFromPlatforms(profileData.preferred_platforms));
                    setSelectedPlatforms(normalizeCreatorPlatforms(profileData.preferred_platforms));
                    setSelectedRegions(profileData.preferred_regions || []);
                    setSelectedCategories(profileData.interests || []);
                }
                setLoading(false); // 성공 시 로딩 해제
            } catch (error: any) {
                console.error('Error fetching profile:', error);
                setDebugError(error?.message || '알 수 없는 에러가 발생했습니다.');
                toast.error('프로필 정보를 불러오는 데 실패했습니다.');
                // 에러 발생 시 setLoading(false)를 호출하지 않아 오류 메세지 UI 렌더링 유지
            }
        };

        loadProfileData();

        return () => {
            if (blogSaveTimer.current) clearTimeout(blogSaveTimer.current);
            if (instaSaveTimer.current) clearTimeout(instaSaveTimer.current);
            if (youtubeSaveTimer.current) clearTimeout(youtubeSaveTimer.current);
            if (tiktokSaveTimer.current) clearTimeout(tiktokSaveTimer.current);
        };
    }, [isInitialized, authUser, router]);

    const handleBasicInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (!authUser) return;
            const user = authUser;

            if (!formData.phone_number || formData.phone_number.trim().length < 10) {
                toast.error('올바른 연락처를 입력해주세요. 연락처는 필수 항목입니다.');
                setSaving(false);
                return;
            }

            const updateData: any = {
                nickname: formData.nickname,
                name: formData.name,
                phone_number: formData.phone_number,
                company_name: formData.company_name,
                avatar_url: formData.avatar_url,
                bank_name: formData.bank_name,
                account_number: formData.account_number,
                account_holder: formData.account_holder,
                zip_code: formData.zip_code,
                address_base: formData.address_base,
                address_detail: formData.address_detail
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

            toast.success('정보가 성공적으로 저장되었습니다.');
            if (user.id) await fetchProfile(user.id);
            setIsEditingPayout(false); // 저장 후 조회 모드로 전환
        } catch (error: any) {
            toast.error(error?.message || '업데이트에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddressComplete = (data: any) => {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
            if (data.bname !== '') {
                extraAddress += data.bname;
            }
            if (data.buildingName !== '') {
                extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
            }
            fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
        }

        setFormData(prev => ({
            ...prev,
            zip_code: data.zonecode,
            address_base: fullAddress
        }));
        setShowAddressSearch(false);
    };

    const [showAddressSearch, setShowAddressSearch] = useState(false);
    const [isEditingPayout, setIsEditingPayout] = useState(false);

    // 계좌번호 마스킹 함수
    const maskAccountNumber = (acc: string) => {
        if (!acc) return "";
        if (acc.length <= 4) return acc;
        return acc.substring(0, 3) + "****" + acc.substring(acc.length - 3);
    };

    // 소셜 링크 자동 저장 함수
    const autoSaveSocialLink = useCallback(async (field: 'blog' | 'instagram' | 'youtube' | 'tiktok', value: string) => {
        try {
            if (!authUser) return;
            const user = authUser;

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
                // 블로그 URL이 변경될 때 다온지수를 재계산하도록 큐에 넣기 (updated_at 초기화)
                updateData.daon_index_updated_at = null;
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
    }, [authUser, fetchProfile]);

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
            if (!authUser) return;
            const user = authUser;
            if (profileMode === PROFILE_MODES.CREATOR && selectedPlatforms.length === 0) {
                toast.error('크리에이터형은 최소 1개 플랫폼을 선택해야 합니다.');
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    preferred_platforms: buildPreferredPlatforms(profileMode, selectedPlatforms),
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

    const togglePlatform = (id: CreatorPlatformId) => {
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

    const selectedBank = BANK_LIST.find(b => b.name === formData.bank_name);

    const handleOpenWithdrawalRequest = async () => {
        if (!canProceedWithdrawal) {
            toast.error('확인 문구 입력과 동의 체크를 완료해 주세요.');
            return;
        }

        try {
            setWithdrawing(true);
            const response = await fetch('/api/account/withdrawal-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: withdrawReason
                })
            });

            const result = await response.json();
            if (!response.ok || !result?.success) {
                throw new Error(result?.error || '회원탈퇴 요청 접수에 실패했습니다.');
            }

            toast.success('회원탈퇴 요청이 접수되었습니다. 안전을 위해 로그아웃됩니다.');
            await signOut();
            router.push('/');
        } catch (error: any) {
            toast.error(error?.message || '회원탈퇴 요청 처리 중 오류가 발생했습니다.');
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    {debugError ? (
                        <div className="flex flex-col items-center gap-2 max-w-sm text-center">
                            <div className="text-rose-500 font-bold mb-2">로딩 오류 발생</div>
                            <div className="bg-white p-4 rounded-xl shadow-sm text-xs text-slate-600 border border-slate-200">
                                {debugError}
                            </div>
                            <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
                                페이지 새로고침
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-medium text-gray-500">정보를 불러오는 중입니다...</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar
                userType={profile?.role === 'ADVERTISER' ? 'ADVERTISER' : 'INFLUENCER'}
                userName={profile?.role === 'ADVERTISER'
                    ? (profile?.company_name || profile?.nickname || '광고주')
                    : (profile?.nickname || '사용자')
                }
                links={(profile?.role === 'ADVERTISER' ? ADVERTISER_LINKS : INFLUENCER_LINKS).map(link => ({
                    ...link,
                    active: link.href === '/profile/edit'
                }))}
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
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        // 용량 제한 (5MB)
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            toast.error('이미지 크기는 5MB 이하여야 합니다.');
                                                            return;
                                                        }

                                                        setAvatarUploading(true);
                                                        try {
                                                            const { data: { user } } = await supabase.auth.getUser();
                                                            if (!user) throw new Error('로그인이 필요합니다.');

                                                            const fileExt = file.name.split('.').pop();
                                                            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
                                                            const filePath = `avatars/${fileName}`;

                                                            const { error: uploadError } = await supabase.storage
                                                                .from('files') // 'files' 버킷 사용 (전체 프로젝트에서 공통 사용됨)
                                                                .upload(filePath, file);

                                                            if (uploadError) throw uploadError;

                                                            const { data: { publicUrl } } = supabase.storage
                                                                .from('files')
                                                                .getPublicUrl(filePath);

                                                            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
                                                            toast.success('이미지가 업로드되었습니다. 저장 버튼을 눌러주세요.');
                                                        } catch (error: any) {
                                                            console.error('Upload error:', error);
                                                            toast.error('이미지 업로드에 실패했습니다.');
                                                        } finally {
                                                            setAvatarUploading(false);
                                                        }
                                                    }}
                                                />
                                                <Avatar
                                                    src={formData.avatar_url}
                                                    fallback={formData.nickname?.[0] || '?'}
                                                    className={`h-24 w-24 ring-4 ring-white shadow-xl text-2xl ${avatarUploading ? 'opacity-50' : ''}`}
                                                />
                                                <div 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                                >
                                                    {avatarUploading ? (
                                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Camera className="text-white w-6 h-6" />
                                                    )}
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

                                {/* 광고주 전용: 사업자 정보 섹션 */}
                                {profile?.role === 'ADVERTISER' && (
                                    <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl h-full">
                                        <CardHeader>
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-rose-500" />
                                                사업자 정보
                                            </CardTitle>
                                            <CardDescription>인증된 사업자 정보입니다. 수정이 필요한 경우 관리자에게 문의하세요.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="company_name_readonly" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                        <Building2 className="w-4 h-4 text-rose-500" />
                                                        회사명 / 상호명
                                                    </Label>
                                                    <Input
                                                        id="company_name_readonly"
                                                        value={profile?.company_name || '미등록'}
                                                        disabled
                                                        className="bg-slate-100 text-slate-600 border-slate-200 h-12 rounded-xl cursor-not-allowed"
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="biz_number_readonly" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                        <FileText className="w-4 h-4 text-rose-500" />
                                                        사업자 등록번호
                                                    </Label>
                                                    <Input
                                                        id="biz_number_readonly"
                                                        value={profile?.biz_number || '미등록'}
                                                        disabled
                                                        className="bg-slate-100 text-slate-600 border-slate-200 h-12 rounded-xl cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                                                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                <div className="text-sm text-amber-800">
                                                    <p className="font-bold mb-1">수정 안내</p>
                                                    <p className="text-amber-700 leading-relaxed">
                                                        사업자 정보는 보안상의 이유로 직접 수정할 수 없습니다.
                                                        변경이 필요하신 경우 <a href="/contact" className="underline font-bold hover:text-amber-900">1:1 문의</a>를 통해 관리자에게 요청해 주세요.
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl h-full">
                                    <CardHeader>
                                        <CardTitle className="text-xl">추가 정보</CardTitle>
                                        <CardDescription>활동 및 연락을 위한 기본 정보를 관리합니다.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <User className="w-4 h-4 text-rose-500" />
                                                    성함 (본명)
                                                </Label>
                                                <Input
                                                    id="name"
                                                    placeholder="실명을 입력하세요"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-rose-500 h-12 rounded-xl"
                                                />
                                            </div>

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
                                        </div>

                                        <div className="grid gap-4">
                                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-rose-500" />
                                                {profile?.role === 'ADVERTISER' ? '브랜드 소셜 링크' : '활동 소셜 링크'}
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

                                <Card className="border border-rose-200 bg-rose-50/40 rounded-3xl shadow-none">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg text-rose-700 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            위험 작업
                                        </CardTitle>
                                        <CardDescription className="text-rose-700/80 leading-relaxed">
                                            회원탈퇴는 복구가 불가능합니다. 실수 방지를 위해 별도 확인을 거쳐야 요청할 수 있습니다.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {!showWithdrawalConfirm ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="border-rose-300 text-rose-700 hover:bg-rose-100 hover:text-rose-800 font-bold"
                                                onClick={() => setShowWithdrawalConfirm(true)}
                                            >
                                                회원탈퇴 진행하기
                                            </Button>
                                        ) : (
                                            <div className="space-y-4 rounded-2xl border border-rose-200 bg-white p-4">
                                                <div className="text-xs text-slate-600 leading-relaxed space-y-1">
                                                    <p>1. 계정 삭제 후 포인트, 신청/리뷰 이력 복구는 불가합니다.</p>
                                                    <p>2. 정산 중인 항목이 있는 경우 탈퇴 처리가 지연될 수 있습니다.</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="withdrawConfirmText" className="text-sm font-bold text-slate-700">
                                                        확인 문구 입력
                                                    </Label>
                                                    <Input
                                                        id="withdrawConfirmText"
                                                        value={withdrawConfirmText}
                                                        onChange={(e) => setWithdrawConfirmText(e.target.value)}
                                                        placeholder={`정확히 '${WITHDRAWAL_CONFIRM_KEYWORD}' 입력`}
                                                        className="bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-rose-500 h-11 rounded-xl"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="withdrawReason" className="text-sm font-bold text-slate-700">
                                                        탈퇴 사유 (선택)
                                                    </Label>
                                                    <textarea
                                                        id="withdrawReason"
                                                        value={withdrawReason}
                                                        onChange={(e) => setWithdrawReason(e.target.value)}
                                                        placeholder="서비스 개선을 위해 탈퇴 사유를 남겨주세요."
                                                        className="w-full min-h-[96px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                    />
                                                </div>

                                                <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                                        checked={withdrawAgreement}
                                                        onChange={(e) => setWithdrawAgreement(e.target.checked)}
                                                    />
                                                    <span>회원탈퇴 시 데이터 삭제/처리 정책을 확인했고, 복구 불가에 동의합니다.</span>
                                                </label>

                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="border-slate-300 text-slate-700 hover:bg-slate-100"
                                                        onClick={() => {
                                                            setShowWithdrawalConfirm(false);
                                                            setWithdrawConfirmText('');
                                                            setWithdrawAgreement(false);
                                                            setWithdrawReason('');
                                                        }}
                                                        disabled={withdrawing}
                                                    >
                                                        취소
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                                                        disabled={!canProceedWithdrawal || withdrawing}
                                                        onClick={handleOpenWithdrawalRequest}
                                                    >
                                                        {withdrawing ? '요청 접수 중...' : '회원탈퇴 요청하기'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </form>
                        ) : activeTab === 'payout' ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* 본인인증 섹션 */}
                                <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
                                    <CardContent className="p-4 md:p-6">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-gray-900">본인 실명확인</h3>
                                                    <p className="text-[11px] text-gray-500 font-medium leading-tight">정확한 정산 및 본인 확인을 위해 휴대폰 본인인증이 필요합니다.</p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline"
                                                className="w-full md:w-auto px-6 h-10 rounded-xl border-blue-200 text-blue-600 font-bold hover:bg-blue-50 hover:text-blue-700 transition-all text-xs"
                                                onClick={() => toast.info('본인인증 모듈 준비 중입니다.')}
                                            >
                                                <ShieldCheck size={14} className="mr-2" />
                                                본인인증 하기
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
 
                                {!isEditingPayout && profile?.bank_name ? (
                                    /* 요약 카드 모드 (조회 모드) */
                                    <div className="space-y-6">
                                        <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-xl flex items-center gap-2">
                                                        <Lock className="w-5 h-5 text-rose-500" />
                                                        배송 및 정산 정보
                                                    </CardTitle>
                                                    <CardDescription>현재 등록된 안전한 정보입니다.</CardDescription>
                                                </div>
                                                <Button
                                                    onClick={() => setIsEditingPayout(true)}
                                                    variant="outline"
                                                    className="rounded-xl border-slate-200 hover:bg-slate-50 gap-2 font-bold"
                                                >
                                                    <Edit2 size={14} />
                                                    정보 수정
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="p-8 space-y-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {/* 배송지 요약 */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                                            <MapPin size={14} />
                                                            기본 배송지
                                                        </div>
                                                        <div className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-100">
                                                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 mb-1">
                                                                <div className="space-y-1">
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">수령인 성함</div>
                                                                    <div className="text-sm font-bold text-slate-800">{formData.name || '미등록'}</div>
                                                                </div>
                                                                <div className="text-right space-y-1">
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">연락처</div>
                                                                    <div className="text-sm font-medium text-slate-600">{formData.phone_number || '미등록'}</div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-black text-rose-500 bg-rose-50 inline-block px-2 py-0.5 rounded-md mb-2">
                                                                    {formData.zip_code || '-'}
                                                                </div>
                                                                <div className="text-base font-bold text-slate-800 break-keep leading-snug">
                                                                    {formData.address_base || '등록된 주소가 없습니다.'}
                                                                </div>
                                                                <div className="text-slate-500 font-medium text-sm mt-1">
                                                                    {formData.address_detail || ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 계좌 요약 */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                                            <CreditCard size={14} />
                                                            정산 계좌
                                                        </div>
                                                        <div className={`${selectedBank?.color || 'bg-slate-900'} p-6 rounded-2xl space-y-3 shadow-lg relative overflow-hidden transition-colors duration-500`}>
                                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                                <CreditCard size={80} className={`${selectedBank?.text || 'text-white'}`} />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-8 h-8 rounded-full ${selectedBank?.text ? 'bg-black/10' : 'bg-white/20'} flex items-center justify-center text-[10px] ${selectedBank?.text || 'text-white'} font-black`}>
                                                                    {formData.bank_name?.substring(0, 2)}
                                                                </div>
                                                                <span className={`font-bold ${selectedBank?.text || 'text-white'}`}>{formData.bank_name}</span>
                                                            </div>
                                                            <div className={`text-2xl font-black ${selectedBank?.text || 'text-white'} tracking-widest py-2`}>
                                                                {maskAccountNumber(formData.account_number)}
                                                            </div>
                                                            <div className="flex justify-between items-end">
                                                                <div className={`${selectedBank?.text ? 'text-black/40' : 'text-white/50'} text-[10px] uppercase font-bold tracking-widest`}>Account Holder</div>
                                                                <div className={`font-bold ${selectedBank?.text || 'text-white'}`}>{formData.account_holder}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                                    <div className="bg-amber-100 p-2 rounded-full h-fit mt-0.5">
                                                        <Settings className="w-3 h-3 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-amber-800">보안 안내</p>
                                                        <p className="text-[10px] text-amber-700/80 leading-relaxed mt-0.5">
                                                            중요한 금융 정보는 마스킹 처리되어 안전하게 보호됩니다. 수정이 필요하실 때만 수정 버튼을 눌러주세요.
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : (
                                    /* 수정 모드 (입력 폼) */
                                    <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
                                        <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                                            <CardHeader className="bg-slate-900 text-white">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-xl flex items-center gap-2">
                                                        <MapPin className="w-5 h-5 text-rose-500" />
                                                        배송지 정보 수정
                                                    </CardTitle>
                                                    {formData.bank_name && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => setIsEditingPayout(false)}
                                                            className="text-slate-400 hover:text-white"
                                                        >
                                                            취소
                                                        </Button>
                                                    )}
                                                </div>
                                                <CardDescription className="text-slate-400">배송형 캠페인 참여를 위한 기본 배송지입니다.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-8 space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="payout_name" className="text-sm font-bold text-slate-700">수령인 성함</Label>
                                                        <Input
                                                            id="payout_name"
                                                            placeholder="수령인 실명 입력"
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                            className="bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-rose-500 h-12 rounded-xl"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="payout_phone" className="text-sm font-bold text-slate-700">수령인 연락처</Label>
                                                        <Input
                                                            id="payout_phone"
                                                            type="tel"
                                                            placeholder="010-0000-0000"
                                                            value={formData.phone_number}
                                                            onChange={handlePhoneChange}
                                                            maxLength={13}
                                                            className="bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-rose-500 h-12 rounded-xl"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid gap-2 pt-2">
                                                    <Label className="text-sm font-bold text-slate-700">우편번호</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={formData.zip_code}
                                                            readOnly
                                                            placeholder="우편번호"
                                                            className="bg-slate-100 border-none h-12 rounded-xl w-32"
                                                        />
                                                        <Button
                                                            type="button"
                                                            onClick={() => setShowAddressSearch(!showAddressSearch)}
                                                            className="h-12 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-2"
                                                        >
                                                            <Search size={16} />
                                                            주소 검색
                                                        </Button>
                                                    </div>
                                                </div>

                                                {showAddressSearch && (
                                                    <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                                                        <DaumPostcodeEmbed onComplete={handleAddressComplete} />
                                                    </div>
                                                )}

                                                <div className="grid gap-2">
                                                    <Label className="text-sm font-bold text-slate-700">기본 주소</Label>
                                                    <Input
                                                        value={formData.address_base}
                                                        readOnly
                                                        placeholder="주소 검색을 이용해 주세요"
                                                        className="bg-slate-100 border-none h-12 rounded-xl"
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="address_detail" className="text-sm font-bold text-slate-700">상세 주소</Label>
                                                    <Input
                                                        id="address_detail"
                                                        value={formData.address_detail}
                                                        onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
                                                        placeholder="상세 주소를 입력하세요 (동, 호수 등)"
                                                        className="bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-rose-500 h-12 rounded-xl"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                                            <CardHeader className="bg-slate-900 text-white">
                                                <CardTitle className="text-xl flex items-center gap-2">
                                                    <CreditCard className="w-5 h-5 text-rose-500" />
                                                    정산 계좌 정보 수정
                                                </CardTitle>
                                                <CardDescription className="text-slate-400">캠페인 보상금(용역비)이 지급되는 계좌입니다.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-8 space-y-8">
                                                <div className="grid gap-4">
                                                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                        은행 선택
                                                    </Label>
                                                    <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-7 gap-2">
                                                        {BANK_LIST.map(bank => (
                                                            <button
                                                                key={bank.name}
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, bank_name: bank.name })}
                                                                className={`relative group p-2.5 rounded-xl border-2 transition-all duration-300 text-center flex flex-col items-center justify-center gap-1.5 ${formData.bank_name === bank.name
                                                                    ? 'border-rose-500 bg-rose-50 shadow-md scale-[1.02]'
                                                                    : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                {formData.bank_name === bank.name && (
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                                                                        <Check size={10} className="text-white" />
                                                                    </div>
                                                                )}
                                                                <div className={`w-7 h-7 ${bank.color} rounded-full flex items-center justify-center ${bank.text} text-[8px] font-black shadow-sm group-hover:scale-110 transition-transform`}>
                                                                    {bank.name.substring(0, 2)}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-700 leading-tight">{bank.name}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="account_holder" className="text-sm font-bold text-slate-700">예금주</Label>
                                                        <Input
                                                            id="account_holder"
                                                            value={formData.account_holder}
                                                            onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                                                            placeholder="실명 예금주 입력"
                                                            className="bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-rose-500 h-12 rounded-xl"
                                                        />
                                                        <div className="flex items-start gap-1.5 px-1">
                                                            <div className="mt-1 w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                                            <p className="text-[10px] leading-relaxed text-rose-500 font-medium">
                                                                예금주 성함이 계좌 정보와 일치하지 않을 경우, 리워드 정산이 반려되거나 지급이 지연될 수 있습니다.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="account_number" className="text-sm font-bold text-slate-700">계좌번호</Label>
                                                        <Input
                                                            id="account_number"
                                                            value={formData.account_number}
                                                            onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/[^\d]/g, '') })}
                                                            placeholder="- 없이 숫자만 입력"
                                                            className="bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-rose-500 h-12 rounded-xl"
                                                        />
                                                        <p className="text-[11px] text-slate-400 ml-1">계좌번호는 리워드 정산을 위해서만 사용되며 안전하게 보호됩니다.</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Button
                                            type="submit"
                                            disabled={saving}
                                            className="w-full py-8 text-lg font-bold bg-rose-500 hover:bg-rose-600 transition-all rounded-2xl shadow-xl shadow-rose-500/20 active:scale-[0.98]"
                                        >
                                            {saving ? '저장 중...' : '배송 및 정산 정보 저장하기'}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                                    <CardHeader className="bg-slate-900 text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl">활동 플랫폼</CardTitle>
                                                <CardDescription className="text-slate-400">크리에이터형 또는 리뷰어형(구매평) 중 하나를 선택하세요.</CardDescription>
                                            </div>
                                            <div className="bg-rose-500 px-3 py-1 rounded-full text-xs font-bold">
                                                {profileMode === PROFILE_MODES.REVIEWER ? '리뷰어형' : `${selectedPlatforms.length}개 선택`}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setProfileMode(PROFILE_MODES.CREATOR)}
                                                    className={`rounded-2xl border-2 p-4 text-left transition-all ${
                                                        profileMode === PROFILE_MODES.CREATOR
                                                            ? 'border-rose-500 bg-rose-50 shadow-sm'
                                                            : 'border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="text-sm font-black text-slate-900">크리에이터형</div>
                                                    <p className="mt-1 text-xs text-slate-500">SNS 채널 기반 캠페인에 참여합니다.</p>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setProfileMode(PROFILE_MODES.REVIEWER)}
                                                    className={`rounded-2xl border-2 p-4 text-left transition-all ${
                                                        profileMode === PROFILE_MODES.REVIEWER
                                                            ? 'border-rose-500 bg-rose-50 shadow-sm'
                                                            : 'border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="text-sm font-black text-slate-900">리뷰어형 (구매평)</div>
                                                    <p className="mt-1 text-xs text-slate-500">SNS 채널 없이 구매평 중심으로 참여합니다.</p>
                                                </button>
                                            </div>

                                            {profileMode === PROFILE_MODES.CREATOR ? (
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {CREATOR_PLATFORM_OPTIONS.map(platform => (
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
                                            ) : (
                                                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-sm text-slate-700">
                                                    리뷰어형은 저장 시 <span className="font-bold">PURCHASE</span> 플랫폼으로 등록됩니다.
                                                    이후 설정에서 언제든 크리에이터형으로 변경할 수 있습니다.
                                                </div>
                                            )}
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
