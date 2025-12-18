'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Save, Upload, Pencil, X, Check, MoveUp, MoveDown, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

interface Banner {
    id: number;
    title: string;
    subtitle: string;
    image_url: string;
    link_url: string;
    display_order: number;
    is_active: boolean;
}

interface BannerConfig {
    new_count: number;
    hot_count: number;
}

interface BannerManagementClientProps {
    initialBanners: Banner[];
    initialConfig: BannerConfig;
}

export default function BannerManagementClient({ initialBanners, initialConfig }: BannerManagementClientProps) {
    const [banners, setBanners] = useState<Banner[]>(initialBanners);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Config State
    const [config, setConfig] = useState<BannerConfig>(initialConfig);
    const [configLoading, setConfigLoading] = useState(false);

    // Edit Mode State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Banner>>({});

    // New Banner Item State
    const [newBanner, setNewBanner] = useState({
        title: '',
        subtitle: '',
        image_url: '',
        link_url: '',
        is_active: true
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // Auth Check Logging
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            console.log('👤 현재 로그인 유저 (Singleton):', user ? `User ID: ${user.id}` : '비로그인 상태 (Anon)');
        };
        checkUser();
    }, []);

    // --- Banner Sorting Logic ---
    async function moveBanner(index: number, direction: 'up' | 'down') {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= banners.length) return;

        const newBanners = [...banners];
        const currentBanner = newBanners[index];
        const neighborBanner = newBanners[newIndex];

        // Swap display_order in DB
        const { error } = await supabase.rpc('swap_banner_order', {
            banner_a_id: currentBanner.id,
            banner_b_id: neighborBanner.id
        });

        // Fallback if RPC is not available
        if (error) {
            const tempOrder = currentBanner.display_order;
            await supabase.from('banners').update({ display_order: neighborBanner.display_order }).eq('id', currentBanner.id);
            await supabase.from('banners').update({ display_order: tempOrder }).eq('id', neighborBanner.id);
        }

        // Update local state
        [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];
        setBanners(newBanners);
        toast.success('순서가 변경되었습니다.');
    }

    // --- Banner Config Logic ---
    async function saveConfig() {
        setConfigLoading(true);
        const { error } = await supabase
            .from('site_settings')
            .upsert({ key: 'banner_config', value: config }, { onConflict: 'key' })
            .select();

        if (error) toast.error('설정 저장 실패');
        else toast.success('배너 노출 설정이 저장되었습니다.');
        setConfigLoading(false);
    }

    // Image Upload Logic
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) {
        const file = e.target.files?.[0];
        console.log('📁 파일 선택:', file);

        if (!file) {
            console.log('❌ 파일 없음');
            return;
        }

        try {
            setUploading(true);
            console.log('⏳ 업로드 시작...');

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `banner-images/${fileName}`;
            console.log('📂 파일 경로:', filePath);

            console.log('☁️ Supabase Storage 업로드 시도...');
            const { error: uploadError } = await supabase.storage
                .from('banners')
                .upload(filePath, file);

            console.log('📡 업로드 응답:', { uploadError });

            if (uploadError) {
                console.error('❌ 업로드 에러:', uploadError);
                throw uploadError;
            }

            console.log('✅ 업로드 성공, Public URL 가져오기...');
            const { data: { publicUrl } } = supabase.storage
                .from('banners')
                .getPublicUrl(filePath);

            console.log('🔗 Public URL:', publicUrl);

            if (isEdit) {
                setEditForm({ ...editForm, image_url: publicUrl });
            } else {
                setNewBanner({ ...newBanner, image_url: publicUrl });
            }
            toast.success('이미지가 업로드되었습니다.');
            console.log('✅ 이미지 업로드 완료');
        } catch (error: any) {
            console.error('💥 업로드 실패:', error);
            toast.error('업로드 실패: ' + (error.message || '알 수 없는 오류'));
        } finally {
            setUploading(false);
            console.log('🏁 업로드 프로세스 종료');
        }
    }

    async function handleAddBanner() {
        console.log('🔵 handleAddBanner 시작');
        console.log('📝 newBanner 데이터:', newBanner);

        if (!newBanner.title || !newBanner.image_url) {
            console.log('❌ 유효성 검사 실패:', { title: newBanner.title, image_url: newBanner.image_url });
            toast.error('제목과 이미지 URL은 필수입니다.');
            return;
        }

        setIsSubmitting(true);
        console.log('⏳ isSubmitting = true');

        const nextOrder = banners.length > 0 ? Math.max(...banners.map(b => b.display_order)) + 1 : 0;
        console.log('📊 다음 순서:', nextOrder);

        const insertData = {
            ...newBanner,
            display_order: nextOrder
        };
        console.log('💾 DB에 저장할 데이터:', insertData);

        const { data, error } = await supabase
            .from('banners')
            .insert([insertData])
            .select();

        console.log('📡 Supabase 응답:', { data, error });

        if (error) {
            console.error('❌ 배너 추가 실패:', error);
            toast.error('배너 추가 실패: ' + error.message);
        } else {
            console.log('✅ 배너 추가 성공:', data);
            toast.success('배너가 추가되었습니다.');
            setBanners([...banners, data[0]]);
            setNewBanner({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true });
        }
        setIsSubmitting(false);
        console.log('✅ handleAddBanner 완료');
    }

    function startEditing(banner: Banner) {
        setEditingId(banner.id);
        const { id, display_order, ...editableFields } = banner;
        setEditForm(editableFields);
    }

    async function handleUpdateBanner() {
        if (!editForm.title || !editForm.image_url) {
            toast.error('제목과 이미지는 필수입니다.');
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase
            .from('banners')
            .update({
                title: editForm.title,
                subtitle: editForm.subtitle,
                image_url: editForm.image_url,
                link_url: editForm.link_url,
                is_active: editForm.is_active
            })
            .eq('id', editingId);

        if (error) {
            toast.error('수정 실패');
        } else {
            setBanners(banners.map(b => b.id === editingId ? { ...b, ...editForm } as Banner : b));
            setEditingId(null);
            toast.success('수정되었습니다.');
        }
        setIsSubmitting(false);
    }

    async function handleDeleteBanner(id: number) {
        if (!confirm('정말 이 배너를 삭제하시겠습니까?')) return;

        const { error } = await supabase
            .from('banners')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('삭제 실패');
        } else {
            setBanners(banners.filter(b => b.id !== id));
            toast.success('삭제되었습니다.');
        }
    }

    async function toggleActive(id: number, currentStatus: boolean) {
        const { error } = await supabase
            .from('banners')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (error) {
            toast.error('상태 변경 실패');
        } else {
            setBanners(banners.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
        }
    }

    return (
        <>
            {/* Global Banner Settings */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 mb-8 border-l-4 border-l-primary/30">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" /> 자동 배너 노출 설정
                    </h2>
                    <button
                        onClick={saveConfig}
                        disabled={configLoading}
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center gap-2"
                    >
                        {configLoading ? '저장 중...' : <><Save size={14} /> 설정 저장하기</>}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">신규 캠페인 노출 개수</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range" min="0" max="10"
                                className="flex-1 accent-primary"
                                value={config.new_count}
                                onChange={e => setConfig({ ...config, new_count: parseInt(e.target.value) })}
                            />
                            <span className="w-12 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl font-black text-primary">
                                {config.new_count}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">인기 캠페인 노출 개수</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range" min="0" max="10"
                                className="flex-1 accent-orange-500"
                                value={config.hot_count}
                                onChange={e => setConfig({ ...config, hot_count: parseInt(e.target.value) })}
                            />
                            <span className="w-12 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl font-black text-orange-600">
                                {config.hot_count}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Add Form */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 mb-10">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" /> 새 수동 배너 추가
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wider">
                                배너 제목 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition-colors ${!newBanner.title && isSubmitting
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-200 focus:border-primary focus:bg-white'
                                    }`}
                                placeholder="예: 신규 캠페인 특별 할인"
                                value={newBanner.title}
                                onChange={e => setNewBanner({ ...newBanner, title: e.target.value })}
                            />
                            {!newBanner.title && isSubmitting && (
                                <p className="text-xs text-red-500 mt-1">배너 제목은 필수입니다.</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wider">
                                배너 설명 <span className="text-gray-400 font-normal">(선택)</span>
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary focus:bg-white transition-colors"
                                placeholder="예: 최대 50% 할인 혜택"
                                value={newBanner.subtitle}
                                onChange={e => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wider">
                                이미지 설정 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className={`flex-1 px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${!newBanner.image_url && isSubmitting
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-200 focus:border-primary focus:bg-white'
                                        }`}
                                    placeholder="이미지 URL 또는 업로드"
                                    value={newBanner.image_url}
                                    onChange={e => setNewBanner({ ...newBanner, image_url: e.target.value })}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="px-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    {uploading ? '...' : <Upload size={18} />}
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e)} />
                            </div>
                            {!newBanner.image_url && isSubmitting && (
                                <p className="text-xs text-red-500 mt-1">이미지는 필수입니다.</p>
                            )}
                            {newBanner.image_url && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-xs text-green-700 flex items-center gap-1">
                                        <Check size={14} /> 이미지가 설정되었습니다.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wider">
                                링크 <span className="text-gray-400 font-normal">(선택)</span>
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary focus:bg-white transition-colors"
                                placeholder="예: /campaigns"
                                value={newBanner.link_url}
                                onChange={e => setNewBanner({ ...newBanner, link_url: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                        <span className="text-red-500">*</span> 표시는 필수 입력 항목입니다.
                    </p>
                    <button
                        onClick={handleAddBanner}
                        disabled={isSubmitting || uploading}
                        className="btn btn-primary px-10 py-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSubmitting ? '저장 중...' : uploading ? '업로드 중...' : '배너 등록하기'}
                    </button>
                </div>
            </div>

            {/* Banner List */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold">수동 배너 목록 ({banners.length})</h2>
                {banners.length === 0 ? (
                    <div className="py-24 bg-white border border-dashed border-gray-300 rounded-[32px] flex flex-col items-center justify-center text-gray-400">
                        <p className="text-lg font-medium">관리 중인 수동 배너가 없습니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {banners.map((banner, index) => (
                            <div key={banner.id} className={`bg-white border rounded-[28px] p-5 flex gap-6 items-center group transition-all ${editingId === banner.id ? 'border-primary' : 'border-gray-200 hover:shadow-lg'}`}>
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                                    <button disabled={index === 0} onClick={() => moveBanner(index, 'up')} className="p-1 hover:bg-gray-100 rounded"><MoveUp size={16} /></button>
                                    <button disabled={index === banners.length - 1} onClick={() => moveBanner(index, 'down')} className="p-1 hover:bg-gray-100 rounded"><MoveDown size={16} /></button>
                                </div>
                                <div className="w-40 h-24 bg-gray-100 rounded-2xl overflow-hidden shrink-0 border border-gray-50 relative">
                                    <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                                    {!banner.is_active && <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center text-white text-[10px] font-black">INACTIVE</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {editingId === banner.id ? (
                                        <div className="space-y-2">
                                            <input className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm font-bold" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                                            <input className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-xs" value={editForm.subtitle} onChange={e => setEditForm({ ...editForm, subtitle: e.target.value })} />
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="font-black text-gray-900 truncate text-sm">{banner.title}</h3>
                                            <p className="text-xs text-gray-500 truncate">{banner.subtitle}</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
                                    {editingId === banner.id ? (
                                        <>
                                            <button onClick={handleUpdateBanner} className="p-2.5 bg-green-500 text-white rounded-xl"><Check size={20} /></button>
                                            <button onClick={() => setEditingId(null)} className="p-2.5 bg-gray-100 text-gray-500 rounded-xl"><X size={20} /></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => toggleActive(banner.id, banner.is_active)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black ${banner.is_active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                {banner.is_active ? 'SHOWN' : 'HIDDEN'}
                                            </button>
                                            <button onClick={() => startEditing(banner)} className="p-2 text-gray-400 hover:text-primary"><Pencil size={18} /></button>
                                            <button onClick={() => handleDeleteBanner(banner.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
