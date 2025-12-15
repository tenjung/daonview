'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import DaumPostcode from 'react-daum-postcode';

type CampaignType = 'VISIT' | 'DELIVERY' | 'PURCHASE';

export default function NewCampaignPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');

    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<CampaignType>('VISIT');

    // Form States
    const [title, setTitle] = useState('');
    const [provision, setProvision] = useState(''); // New Provision State
    const [platform, setPlatform] = useState('BLOG');
    const [category, setCategory] = useState('맛집'); // Default category
    const [recruitCount, setRecruitCount] = useState(0);
    const [recruitStartDate, setRecruitStartDate] = useState('');
    const [recruitEndDate, setRecruitEndDate] = useState('');
    const [endDateOption, setEndDateOption] = useState('manual'); // '1week', '2weeks', 'always', 'manual'
    const [isForever, setIsForever] = useState(false);

    const [announceDate, setAnnounceDate] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [subImage1, setSubImage1] = useState('');
    const [subImage2, setSubImage2] = useState('');

    // Address Modal
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

    // Detail States
    const [storeName, setStoreName] = useState('');
    const [storeAddress, setStoreAddress] = useState('');
    const [naverMapUrl, setNaverMapUrl] = useState(''); // Naver Place URL
    const [productName, setProductName] = useState('');
    const [mission, setMission] = useState('');
    const [keywords, setKeywords] = useState('');

    // Campaign Options (Selection for Applicants)
    const [campaignOptions, setCampaignOptions] = useState<string[]>([]); // e.g. ["Designer A: Cut", "Designer B: Perm"]

    const [campaignId, setCampaignId] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    // Load Data for Editing
    useEffect(() => {
        if (editId) {
            const fetchCampaign = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('id', editId)
                    .single();

                if (data) {
                    setCampaignId(String(data.id));
                    setType(data.type as CampaignType);
                    setTitle(data.title);
                    setProvision(data.provision || ''); // Load provision
                    setPlatform(data.platform);
                    setCategory(data.category);
                    setRecruitCount(data.recruit_count);
                    setRecruitEndDate(data.end_date);
                    setMission(data.description); // Description mapped to mission
                    setThumbnailUrl(data.thumbnail_url || '');
                    setStoreName(data.store_name || '');
                    setStoreAddress(data.store_address || '');
                    setNaverMapUrl(data.naver_map_url || '');
                    setSubImage1(data.sub_image_1 || '');
                    setSubImage2(data.sub_image_2 || '');
                    setIsForever(data.is_always || false);
                    setCampaignOptions(Array.isArray(data.campaign_options) ? data.campaign_options : []);
                } else if (error) {
                    toast.error('캠페인 정보를 불러오는데 실패했습니다.');
                }
                setLoading(false);
            };
            fetchCampaign();
        }
    }, [editId]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);


    // Image Upload Helpers
    const uploadImage = async (file: File) => {
        try {
            // Sanitize filename to strict English/Numbers only to avoid encoding issues
            const fileExt = file.name.split('.').pop();
            const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('campaign-images')
                .upload(safeName, file, {
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) {
                console.error('Storage Upload Error:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('campaign-images')
                .getPublicUrl(safeName);

            return publicUrl;
        } catch (error) {
            console.error('Upload Process Error:', error);
            throw error;
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        // Validate size (e.g. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('이미지 크기는 5MB 이하여야 합니다.');
            e.target.value = '';
            return;
        }

        const toastId = toast.loading('이미지 업로드 중...');

        try {
            const url = await uploadImage(file);
            setter(url);
            toast.success('이미지 업로드 완료', { id: toastId });
        } catch (error: any) {
            console.error(error);
            toast.error(`업로드 실패: ${error.message || '알 수 없는 오류'}`, { id: toastId });
        }

        // Always reset input
        e.target.value = '';
    };

    const fetchNaverPlaceInfo = async () => {
        if (!naverMapUrl) return;
        const toastId = toast.loading('정보를 불러오는 중...');
        try {
            const res = await fetch('/api/naver-place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: naverMapUrl })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.title) setStoreName(data.title);
            if (data.address) setStoreAddress(data.address);
            toast.success('정보를 성공적으로 불러왔습니다.', { id: toastId });
        } catch (e: any) {
            toast.error(e.message || '정보를 불러오는데 실패했습니다.', { id: toastId });
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
        setStoreAddress(fullAddress);
        setIsAddressModalOpen(false);
    };

    const handleStartDateChange = (date: string) => {
        setRecruitStartDate(date);
        applyEndDateOption(date, endDateOption);
    };

    const applyEndDateOption = (start: string, option: string) => {
        if (!start) return;
        const startDateObj = new Date(start);

        if (option === '1week') {
            const end = new Date(startDateObj);
            end.setDate(startDateObj.getDate() + 7);
            setRecruitEndDate(end.toISOString().split('T')[0]);
            setIsForever(false);
        } else if (option === '2weeks') {
            const end = new Date(startDateObj);
            end.setDate(startDateObj.getDate() + 14);
            setRecruitEndDate(end.toISOString().split('T')[0]);
            setIsForever(false);
        } else if (option === 'always') {
            setRecruitEndDate('9999-12-31');
            setAnnounceDate('9999-12-31');
            setIsForever(true);
        } else {
            setIsForever(false);
            // If sticking to manual, let user decide dates, but maybe clear if it was set to forever before?
            // Optional: if (announceDate === '9999-12-31') setAnnounceDate('');
        }
    };

    const handleEndDateOptionChange = (option: string) => {
        setEndDateOption(option);
        applyEndDateOption(recruitStartDate, option);
    };

    const handleSave = async (targetStatus: 'DRAFT' | 'PENDING' | 'RECRUITING') => {
        setLoading(true);

        try {
            // Validation
            if (targetStatus === 'DRAFT') {
                if (!title) {
                    toast.error('임시 저장을 위해 최소한 제목은 입력해주세요.');
                    setLoading(false);
                    return;
                }
            } else {
                // Full validation for Register
                if (!title || !recruitEndDate || !mission) {
                    toast.error('필수 정보를 모두 입력해주세요.');
                    setLoading(false);
                    return;
                }
            }

            // Get current user and role
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('로그인이 필요합니다.');

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const isAdmin = profile?.role === 'ADMIN';

            // Determine final status
            let finalStatus = targetStatus;
            if (targetStatus === 'PENDING' || targetStatus === 'RECRUITING') {
                finalStatus = isAdmin ? 'RECRUITING' : 'PENDING';
            }

            const payload: any = {
                type,
                platform,
                category,
                title,
                provision, // Add to payload
                description: mission,
                recruit_count: Number(recruitCount) || 0,
                end_date: recruitEndDate,
                status: finalStatus,
                thumbnail_url: thumbnailUrl || null,
                store_name: storeName,
                store_address: storeAddress,
                naver_map_url: naverMapUrl,
                sub_image_1: subImage1,
                sub_image_2: subImage2,
                is_always: isForever,
                campaign_options: campaignOptions.filter(opt => opt.trim() !== ''),
                created_by: user.id, // Add owner information
            };

            let currentId = campaignId;

            if (!currentId) {
                // Insert new
                const { data, error } = await supabase
                    .from('campaigns')
                    .insert([payload])
                    .select()
                    .single();

                if (error) throw error;
                currentId = data.id;
            } else {
                // Update existing
                const { error } = await supabase
                    .from('campaigns')
                    .update(payload)
                    .eq('id', currentId);

                if (error) throw error;
            }

            setCampaignId(currentId);
            setIsDirty(false); // Saved changes

            if (targetStatus === 'DRAFT') {
                toast.success('임시 저장되었습니다.');
                // Optional: router.replace(`/dashboard/campaign/edit/${currentId}`) if you have an edit page
            } else {
                if (isAdmin) {
                    toast.success('캠페인이 등록되었습니다. (관리자 승인 완료)');
                    router.push('/dashboard/admin');
                } else {
                    toast.success('캠페인 등록 신청이 완료되었습니다. 관리자 승인 후 게시됩니다.');
                    router.push('/dashboard/advertiser');
                }
            }

        } catch (error: any) {
            console.error('Campaign Save Error:', error);
            toast.error(`저장 실패: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center py-10">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8">새 캠페인 등록</h1>

                {/* Type Selection */}
                <div className="flex gap-4 mb-10 p-2 bg-gray-100 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setType('VISIT')}
                        className={`flex-1 py-4 px-6 rounded-lg text-lg font-bold transition-all ${type === 'VISIT'
                            ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:bg-gray-200/50'
                            }`}
                    >
                        🏢 방문 체험
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('DELIVERY')}
                        className={`flex-1 py-4 px-6 rounded-lg text-lg font-bold transition-all ${type === 'DELIVERY'
                            ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:bg-gray-200/50'
                            }`}
                    >
                        📦 배송 체험
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('PURCHASE')}
                        className={`flex-1 py-4 px-6 rounded-lg text-lg font-bold transition-all ${type === 'PURCHASE'
                            ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:bg-gray-200/50'
                            }`}
                    >
                        🛒 구매평/기자단
                    </button>
                </div>

                <form onSubmit={(e) => e.preventDefault()} onChange={() => !isDirty && setIsDirty(true)} className="space-y-8">

                    {/* Section 1: Re-ordered Layout */}
                    <div className="space-y-8">

                        {/* 1. Title & Provision */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">기본 정보</h2>
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">캠페인 제목 <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="[지역/제품명] 키워드 포함 제목을 입력해주세요"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">제공 내역 (서비스/제품) <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={provision}
                                    onChange={(e) => setProvision(e.target.value)}
                                    placeholder="예: 5만원 식사권, 샴푸 1개, 1박 숙박권 등"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400"
                                    required
                                />
                            </div>
                        </div>

                        {/* 2. Campaign Options */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                체험 옵션 (선택 사항)
                                <span className="block text-xs text-gray-400 font-normal mt-1">
                                    신청자가 선택해야 할 옵션이 있다면 입력해주세요 (예: 디자이너 선택, 체험 코스 선택 등).
                                </span>
                            </label>
                            <div className="space-y-3">
                                {campaignOptions.map((opt, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            placeholder={`옵션 ${index + 1} (예: 다희 디자이너)`}
                                            value={opt}
                                            onChange={(e) => {
                                                const newOptions = [...campaignOptions];
                                                newOptions[index] = e.target.value;
                                                setCampaignOptions(newOptions);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newOptions = campaignOptions.filter((_, i) => i !== index);
                                                setCampaignOptions(newOptions);
                                            }}
                                            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setCampaignOptions([...campaignOptions, ''])}
                                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors font-bold"
                                >
                                    + 옵션 추가하기
                                </button>
                            </div>
                        </div>

                        {/* 3. Images */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200 mb-6">이미지 설정</h2>

                            {/* Representative Image */}
                            <div className="mb-8">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">대표 이미지 <span className="text-red-500">*</span></label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors relative">
                                    {thumbnailUrl ? (
                                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={thumbnailUrl} alt="Representative" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setThumbnailUrl('')} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-500 mb-2">클릭하여 이미지를 업로드하세요</p>
                                            <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleImageChange(e, setThumbnailUrl)} required={!thumbnailUrl} />
                                            <div className="text-4xl text-gray-400">📷</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Detail Images */}
                            <div className="mb-8">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">상세 이미지 (선택)</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Sub Image 1 */}
                                    <div className="border border-gray-200 rounded-lg p-2 h-40 relative flex items-center justify-center bg-gray-50">
                                        {subImage1 ? (
                                            <div className="relative w-full h-full">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={subImage1} alt="Sub 1" className="w-full h-full object-cover rounded" />
                                                <button type="button" onClick={() => setSubImage1('')} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-xs text-gray-400 mb-1">상세 이미지 1 추가</p>
                                                <span className="text-2xl text-gray-300">+</span>
                                                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleImageChange(e, setSubImage1)} />
                                            </div>
                                        )}
                                    </div>
                                    {/* Sub Image 2 */}
                                    <div className="border border-gray-200 rounded-lg p-2 h-40 relative flex items-center justify-center bg-gray-50">
                                        {subImage2 ? (
                                            <div className="relative w-full h-full">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={subImage2} alt="Sub 2" className="w-full h-full object-cover rounded" />
                                                <button type="button" onClick={() => setSubImage2('')} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-xs text-gray-400 mb-1">상세 이미지 2 추가</p>
                                                <span className="text-2xl text-gray-300">+</span>
                                                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleImageChange(e, setSubImage2)} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Category & Schedule (Remaining Info) */}
                        <div className="pt-8 border-t border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200 mb-6">모집 정보</h2>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">채널 선택 <span className="text-red-500">*</span></label>
                                        <select
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={platform}
                                            onChange={(e) => setPlatform(e.target.value)}
                                            required
                                        >
                                            <option value="BLOG">블로그</option>
                                            <option value="INSTAGRAM">인스타그램</option>
                                            <option value="YOUTUBE">유튜브</option>
                                            <option value="TIKTOK">틱톡/릴스/숏츠</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리 <span className="text-red-500">*</span></label>
                                        <select
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            required
                                        >
                                            <option value="맛집">맛집</option>
                                            <option value="뷰티">뷰티</option>
                                            <option value="여행">여행/숙박</option>
                                            <option value="생활">생활/리빙</option>
                                            <option value="푸드">푸드</option>
                                            <option value="IT">IT/가전</option>
                                            <option value="패션">패션</option>
                                            <option value="유아동">유아동</option>
                                            <option value="반려동물">반려동물</option>
                                            <option value="기타">기타</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">모집 인원 <span className="text-red-500">*</span></label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                placeholder="0"
                                                min="1"
                                                value={recruitCount}
                                                onChange={(e) => setRecruitCount(Number(e.target.value))}
                                                required
                                            />
                                            <span className="text-gray-500 font-medium">명</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">당첨자 발표일 <span className="text-red-500">*</span></label>
                                        {isForever ? (
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 font-medium"
                                                value="상시 발표"
                                                disabled
                                            />
                                        ) : (
                                            <input
                                                type="date"
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300"
                                                value={announceDate}
                                                onChange={(e) => setAnnounceDate(e.target.value)}
                                                required={!isForever}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">모집 기간 <span className="text-red-500">*</span></label>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300"
                                                value={recruitStartDate}
                                                onChange={(e) => handleStartDateChange(e.target.value)}
                                                required
                                            />
                                            <span>~</span>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                                                value={recruitEndDate}
                                                onChange={(e) => setRecruitEndDate(e.target.value)}
                                                disabled={isForever || endDateOption !== 'manual'}
                                                required={!isForever}
                                            />
                                        </div>

                                        <div className="flex gap-2 text-sm overflow-x-auto">
                                            {['1week:1주일', '2weeks:2주일', 'always:상시모집', 'manual:직접입력'].map((opt) => {
                                                const [val, label] = opt.split(':');
                                                return (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => handleEndDateOptionChange(val)}
                                                        className={`px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${endDateOption === val
                                                            ? 'bg-primary text-white border-primary'
                                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Detail Info (Conditional) */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-200">
                            {type === 'VISIT' && '방문 정보 및 미션'}
                            {type === 'DELIVERY' && '배송 상품 정보 및 미션'}
                            {type === 'PURCHASE' && '구매 및 페이백 정보'}
                        </h2>

                        {/* ---------- VISIT TYPE ---------- */}
                        {type === 'VISIT' && (
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">업체명 (상호명) <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300"
                                        placeholder="네이버 플레이스에 등록된 정확한 상호명"
                                        value={storeName}
                                        onChange={(e) => setStoreName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">업체 주소 <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300"
                                            placeholder="주소 검색을 이용해주세요"
                                            value={storeAddress}
                                            readOnly
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsAddressModalOpen(true)}
                                            className="px-4 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors"
                                        >
                                            주소검색
                                        </button>

                                        {/* Simple Modal Overlay */}
                                        {isAddressModalOpen && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                                                    <div className="flex justify-between items-center p-4 border-b">
                                                        <h3 className="font-bold text-lg">주소 검색</h3>
                                                        <button type="button" onClick={() => setIsAddressModalOpen(false)} className="text-gray-500 hover:text-black">✕</button>
                                                    </div>
                                                    <div className="flex-1 overflow-auto">
                                                        <DaumPostcode onComplete={handleAddressComplete} className="h-full min-h-[400px]" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg flex flex-col gap-2 border border-green-100">
                                    <label className="text-sm font-bold text-green-800">네이버 플레이스 URL (선택)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            className="flex-1 px-4 py-2 rounded border border-green-200 focus:ring-green-500/20 focus:border-green-500"
                                            placeholder="https://naver.me/xxxxx"
                                            value={naverMapUrl}
                                            onChange={(e) => setNaverMapUrl(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={fetchNaverPlaceInfo}
                                            className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 whitespace-nowrap"
                                        >
                                            불러오기
                                        </button>
                                    </div>
                                    <p className="text-xs text-green-600">입력 시 업체명과 주소를 자동으로 불러옵니다.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">영업시간 및 휴무일</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="예: 매일 10:00~22:00, 연중무휴" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">체험 가능 시간 <span className="text-red-500">*</span></label>
                                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="예: 평일 14:00 이후, 주말 불가" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">예약 방법</label>
                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="예: 방문 2일 전 문자 예약 (010-XXXX-XXXX)" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">원하는 인플루언서 유형</label>
                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="예: 20-30대 커플, 맛집 전문 블로거" />
                                </div>
                            </div>
                        )}

                        {/* ---------- DELIVERY TYPE ---------- */}
                        {type === 'DELIVERY' && (
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">제공 상품명 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300"
                                        placeholder="리뷰어에게 배송될 정확한 상품명"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">시중 판매가</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="예: 35,000원" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">쇼핑몰 링크</label>
                                        <input type="url" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="http://" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">제품 상세 정보 / 사양 (참고용)</label>
                                    <textarea className="w-full px-4 py-3 rounded-lg border border-gray-300 h-24 resize-none" placeholder="포스팅 시 참고할 수 있는 제품의 특장점이나 스펙을 적어주세요."></textarea>
                                </div>
                            </div>
                        )}

                        {/* ---------- PURCHASE TYPE (Simple) ---------- */}
                        {type === 'PURCHASE' && (
                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800 mb-2">
                                    🛍️ <strong>구매형 캠페인 안내:</strong> 리뷰어가 직접 상품을 구매하고 리뷰 작성 후 포인트(페이백)를 받는 방식입니다.
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">구매처 링크 <span className="text-red-500">*</span></label>
                                    <input type="url" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="구매가 일어날 쇼핑몰 URL" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">구매 필수 옵션/가격</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="예: 1+1 세트 필수 구매" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">페이백 포인트 <span className="text-red-500">*</span></label>
                                        <input type="number" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="리뷰 완료 시 지급할 포인트" required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Common Mission Fields (All Types) */}
                        <div className="border-t border-gray-100 pt-6 mt-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">필수 키워드 <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2 mb-2">
                                        <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-500"># 없이 입력 (예: 강남맛집, 파스타)</span>
                                    </div>
                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="제목/본문에 들어갈 키워드를 쉼표(,)로 구분하여 입력해주세요" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">리뷰 가이드 / 요청사항 <span className="text-red-500">*</span></label>
                                    <textarea
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 h-40 resize-none"
                                        placeholder="포스팅 시 꼭 들어가야 할 내용, 사진 가이드, 강조하고 싶은 점 등을 자세히 적어주세요."
                                        value={mission}
                                        onChange={(e) => setMission(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                {type === 'VISIT' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">추가 제공 내역 / 비용 부담</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="기본 제공 내역 외 추가 주문 시 본인 부담 여부 등" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Policies & Privacy (Especially for Delivery) */}
                        <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200 text-sm text-gray-600">
                            <h3 className="font-bold text-gray-900 mb-4">📢 필독 확인사항</h3>

                            <div className="space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" className="mt-1 w-4 h-4 accent-primary shrink-0" required />
                                    <span>
                                        <strong>[환불/취소 규정]</strong> 체험단 모집 공고 게시 후 단순 변심에 의한 취소/환불은 불가합니다.
                                        모집 미달 시 다온뷰 정책에 따라 미달된 인원만큼 부분 환불(포인트) 처리됩니다.
                                    </span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" className="mt-1 w-4 h-4 accent-primary shrink-0" required />
                                    <span>
                                        <strong>[공정위 문구]</strong> 모든 리뷰 컨텐츠 최하단에는 "본 포스팅은 다온뷰를 통해 업체로부터 서비스를 제공받아 작성된 글입니다"
                                        라는 공정거래위원회 표준 문구가 반드시 포함되어야 함을 확인했습니다.
                                    </span>
                                </label>
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                        >
                            취소하기
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSave('DRAFT')}
                            disabled={loading}
                            className="px-6 py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-colors disabled:opacity-50"
                        >
                            {loading ? '저장 중...' : '임시저장'}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSave('PENDING')}
                            disabled={loading}
                            className="px-10 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark hover:-translate-y-1 transition-all disabled:opacity-50"
                        >
                            {loading ? '처리 중...' : '캠페인 등록 신청'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
