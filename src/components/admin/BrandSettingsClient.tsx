'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Globe, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface BrandConfig {
    favicon_url: string;
    logo_url?: string;
}

interface BrandSettingsClientProps {
    initialConfig: BrandConfig;
}

export default function BrandSettingsClient({ initialConfig }: BrandSettingsClientProps) {
    const [config, setConfig] = useState<BrandConfig>(initialConfig);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'favicon' | 'logo') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 파비콘의 경우 .ico, .png, .svg 추천
        if (type === 'favicon' && !['image/x-icon', 'image/png', 'image/svg+xml'].includes(file.type)) {
            toast.error('파비콘은 .ico, .png, .svg 형식만 지원합니다.');
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${type}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            setConfig(prev => ({
                ...prev,
                [`${type}_url`]: publicUrl
            }));

            toast.success(`${type === 'favicon' ? '파비콘' : '로고'} 업로드 완료! (저장 버튼을 눌러야 반영됩니다)`);
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('파일 업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    key: 'brand_config',
                    value: config,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success('브랜드 설정이 성공적으로 저장되었습니다.');
            
            // 페이지 새로고침하여 레이아웃 반영 (또는 전역 상태 업데이트)
            window.location.reload();
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error('설정 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const removeImage = (type: 'favicon' | 'logo') => {
        setConfig(prev => ({
            ...prev,
            [`${type}_url`]: ''
        }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-sm">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <Globe className="text-primary" />
                    파비콘 및 브랜드 자산 관리
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* favicon 섹션 */}
                    <div className="space-y-4">
                        <Label className="text-sm font-bold text-gray-700">사이트 파비콘 (Favicon)</Label>
                        <p className="text-xs text-gray-500">
                            브라우저 탭에 표시되는 아이콘입니다. (추천: 32x32px, .png 또는 .ico)
                        </p>
                        
                        <div className="relative group w-24 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                            {config.favicon_url ? (
                                <>
                                    <Image 
                                        src={config.favicon_url} 
                                        alt="Favicon Preview" 
                                        width={48} 
                                        height={48} 
                                        className="object-contain"
                                    />
                                    <button 
                                        onClick={() => removeImage('favicon')}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                    >
                                        <Trash2 className="text-white w-6 h-6" />
                                    </button>
                                </>
                            ) : (
                                <Upload className="text-gray-300 w-8 h-8" />
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                id="favicon-upload"
                                className="hidden"
                                accept=".ico,.png,.svg"
                                onChange={(e) => handleFileUpload(e, 'favicon')}
                                disabled={isUploading}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('favicon-upload')?.click()}
                                disabled={isUploading}
                                className="flex-1"
                            >
                                {isUploading ? <Loader2 className="animate-spin" /> : '파일 선택'}
                            </Button>
                        </div>
                    </div>

                    {/* 로고 섹션 (추가 확장성) */}
                    <div className="space-y-4">
                        <Label className="text-sm font-bold text-gray-700">메인 로고 (이미지용)</Label>
                        <p className="text-xs text-gray-500">
                            사이트 곳곳에 사용될 이미지형 로고입니다. (현재는 텍스트 로고 사용 중)
                        </p>
                        
                        <div className="relative group w-full h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                            {config.logo_url ? (
                                <>
                                    <Image 
                                        src={config.logo_url} 
                                        alt="Logo Preview" 
                                        fill
                                        className="object-contain p-2"
                                    />
                                    <button 
                                        onClick={() => removeImage('logo')}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                    >
                                        <Trash2 className="text-white w-6 h-6" />
                                    </button>
                                </>
                            ) : (
                                <Upload className="text-gray-300 w-8 h-8" />
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                id="logo-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'logo')}
                                disabled={isUploading}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('logo-upload')?.click()}
                                disabled={isUploading}
                                className="flex-1"
                            >
                                {isUploading ? <Loader2 className="animate-spin" /> : '파일 선택'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || isUploading}
                        className="bg-primary hover:bg-primary-dark text-white font-bold h-12 px-12 rounded-xl"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                저장 중...
                            </>
                        ) : (
                            '브랜드 설정 저장하기'
                        )}
                    </Button>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h4 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
                    💡 안내사항
                </h4>
                <ul className="text-sm text-blue-700 space-y-2 list-disc ml-5">
                    <li>파비콘은 저장 즉시 사이트 전체 레이아웃에 반영됩니다.</li>
                    <li>캐시 문제로 인해 브라우저에서 즉시 바뀌지 않을 경우, 강력 새로고침(Ctrl+F5)을 해주세요.</li>
                    <li>업로드한 이미지는 Supabase Storage의 'site-assets' 버킷에 안전하게 보관됩니다.</li>
                </ul>
            </div>
        </div>
    );
}
