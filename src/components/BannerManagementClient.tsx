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
    show_content: boolean;
}

interface BannerConfig {
    new_count: number;
    hot_count: number;
    rolling_interval?: number;
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
        is_active: true,
        show_content: true
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
        // Ensure default if not set
        const finalConfig = {
            ...config,
            rolling_interval: config.rolling_interval || 3
        };

        const { error } = await supabase
            .from('site_settings')
            .upsert({ key: 'banner_config', value: finalConfig }, { onConflict: 'key' })
            .select();

        if (error) {
            console.error('Config save error:', error);
            toast.error('설정 저장 실패: ' + (error.message || '알 수 없는 오류'));
        } else {
            toast.success('배너 노출 설정이 저장되었습니다.');
        }
        setConfigLoading(false);
    }

    // Image Upload Logic
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            toast.loading('사용자 확인 중...', { id: 'upload-status' });
            
            // 1. 세션 확인
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                toast.error('로그인이 필요하거나 세션이 만료되었습니다.', { id: 'upload-status' });
                setUploading(false);
                return;
            }

            // 2. 파일 형식 체크
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            const fileExt = file.name.split('.').pop()?.toLowerCase();
            if (!fileExt || !allowedExtensions.includes(fileExt)) {
                toast.error('허용되지 않는 파일 형식입니다.', { id: 'upload-status' });
                setUploading(false);
                return;
            }

            toast.loading('저장소에 연결 중...', { id: 'upload-status' });
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = fileName;

            // 3. 업로드 시도
            const { error: uploadError } = await supabase.storage
                .from('banners')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Error uploading:', uploadError);
                toast.error(`업로드 오류: ${uploadError.message}`, { id: 'upload-status' });
                setUploading(false);
                return;
            }

            toast.loading('이미지 주소 생성 중...', { id: 'upload-status' });
            // 4. URL 가져오기
            const { data: { publicUrl } } = supabase.storage
                .from('banners')
                .getPublicUrl(filePath);

            if (isEdit) {
                setEditForm(prev => ({ ...prev, image_url: publicUrl }));
            } else {
                setNewBanner(prev => ({ ...prev, image_url: publicUrl }));
            }
            toast.success('이미지 업로드 완료!', { id: 'upload-status' });
        } catch (error: any) {
            console.error('Upload process error:', error);
            toast.error('처리 중 오류 발생: ' + (error.message || '알 수 없는 오류'), { id: 'upload-status' });
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    }

    async function handleAddBanner() {
        if (!newBanner.title || !newBanner.image_url) {
            toast.error('제목과 이미지 URL은 필수입니다.');
            return;
        }

        setIsSubmitting(true);
        toast.loading('배너 정보 저장 중...', { id: 'submit-status' });

        try {
            const nextOrder = banners.length > 0 ? Math.max(...banners.map(b => b.display_order)) + 1 : 0;
            const insertData = {
                ...newBanner,
                display_order: nextOrder
            };

            const { data, error } = await supabase
                .from('banners')
                .insert([insertData])
                .select();

            if (error) {
                console.error('❌ 배너 추가 실패:', error);
                toast.error('배너 추가 실패: ' + error.message, { id: 'submit-status' });
            } else {
                toast.success('배너가 추가되었습니다.', { id: 'submit-status' });
                setBanners([...banners, data[0]]);
                setNewBanner({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true, show_content: true });
            }
        } catch (error: any) {
            toast.error('오류 발생: ' + error.message, { id: 'submit-status' });
        } finally {
            setIsSubmitting(false);
        }
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
                is_active: editForm.is_active,
                show_content: editForm.show_content
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
                    <div className="space-y-2 col-span-1 md:col-span-2 pt-4 border-t border-gray-50">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">자동 롤링 간격 (초)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range" min="1" max="10" step="1"
                                className="flex-1 accent-indigo-500"
                                value={config.rolling_interval || 3}
                                onChange={e => setConfig({ ...config, rolling_interval: parseInt(e.target.value) })}
                            />
                            <span className="w-12 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl font-black text-indigo-600">
                                {config.rolling_interval || 3}s
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">* 배너가 다음 장으로 자동으로 넘어가는 시간 간격입니다. (권장: 3~5초)</p>
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
                        <div className="space-y-2 pt-2">
                            <button
                                onClick={() => setNewBanner({ ...newBanner, show_content: !newBanner.show_content })}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${newBanner.show_content ? 'bg-primary/5 text-primary border-primary/20' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                            >
                                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${newBanner.show_content ? 'bg-primary text-white' : 'bg-gray-300 text-white'}`}>
                                    {newBanner.show_content ? <Check size={10} /> : <X size={10} />}
                                </div>
                                메인 슬라이드 제목 노출: {newBanner.show_content ? 'ON' : 'OFF'}
                            </button>
                            <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                * 제목 노출 안함(OFF)으로 설정하면 메인 페이지 슬라이드에서 글자 없이 이미지만 꽉 차게 나옵니다.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wider">
                                이미지 설정 <span className="text-red-500">*</span>
                            </label>
                            <div className="mb-3 w-full aspect-[21/9] rounded-xl overflow-hidden border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center relative group">
                                {newBanner.image_url ? (
                                    <>
                                        <img src={newBanner.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-[10px] text-white font-bold truncate">{newBanner.image_url.split('/').pop()}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-300">
                                        <ImageIcon size={32} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">이미지를 등록해주세요</span>
                                    </div>
                                )}
                            </div>
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
                                            <div className="pt-1">
                                                <button
                                                    onClick={() => setEditForm({ ...editForm, show_content: !editForm.show_content })}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${editForm.show_content ? 'bg-primary/5 text-primary border-primary/20' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                                                >
                                                    메인 슬라이드 제목 노출: {editForm.show_content ? 'ON' : 'OFF'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="font-black text-gray-900 truncate text-sm flex items-center gap-2">
                                                {banner.title}
                                                {banner.show_content === false && <span className="text-[8px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded uppercase leading-none">Title Hidden</span>}
                                            </h3>
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
