'use client';

import { useState, useEffect } from 'react';
import { 
    Plus, 
    Building2, 
    Search, 
    MoreVertical, 
    ExternalLink, 
    Edit2, 
    Trash2,
    Megaphone,
    LayoutGrid,
    List,
    Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Brand {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    category: string | null;
    homepage_url: string | null;
    campaign_count?: number;
}

export default function BrandManagementPage() {
    const { user } = useAuthStore();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        homepage_url: ''
    });

    useEffect(() => {
        if (user) {
            fetchBrands();
        }
    }, [user]);

    const fetchBrands = async () => {
        setIsLoading(true);
        try {
            // 브랜드 정보와 함께 캠페인 개수 가져오기
            const { data: brandsData, error: brandsError } = await supabase
                .from('brands')
                .select(`
                    *,
                    campaignsCount:campaigns(count)
                `)
                .eq('created_by', user?.id)
                .order('name');

            if (brandsError) throw brandsError;

            const formattedBrands = brandsData.map((b: any) => ({
                ...b,
                campaign_count: b.campaignsCount?.[0]?.count || 0
            }));

            setBrands(formattedBrands);
        } catch (error: any) {
            console.error('Error fetching brands:', error);
            toast.error('브랜드 목록을 불러오지 못했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBrand = async () => {
        if (!formData.name.trim()) {
            toast.error('브랜드 이름을 입력해주세요.');
            return;
        }

        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('brands')
                .insert([{
                    name: formData.name,
                    description: formData.description,
                    homepage_url: formData.homepage_url,
                    created_by: user?.id
                }]);

            if (error) throw error;

            toast.success('새 브랜드가 등록되었습니다.');
            setIsAddModalOpen(false);
            resetForm();
            fetchBrands();
        } catch (error: any) {
            toast.error('브랜드 등록에 실패했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEditBrand = async () => {
        if (!selectedBrand || !formData.name.trim()) return;

        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('brands')
                .update({
                    name: formData.name,
                    description: formData.description,
                    homepage_url: formData.homepage_url,
                })
                .eq('id', selectedBrand.id);

            if (error) throw error;

            toast.success('브랜드 정보가 수정되었습니다.');
            setIsEditModalOpen(false);
            fetchBrands();
        } catch (error: any) {
            toast.error('수정에 실패했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteBrand = async (brand: Brand) => {
        if (brand.campaign_count && brand.campaign_count > 0) {
            toast.error('진행 중인 캠페인이 있는 브랜드는 삭제할 수 없습니다.');
            return;
        }

        if (!confirm('정말 이 브랜드를 삭제하시겠습니까?')) return;

        try {
            const { error } = await supabase
                .from('brands')
                .delete()
                .eq('id', brand.id);

            if (error) throw error;
            toast.success('브랜드가 삭제되었습니다.');
            setBrands(prev => prev.filter(b => b.id !== brand.id));
        } catch (error) {
            toast.error('삭제에 실패했습니다.');
        }
    };

    const openEditModal = (brand: Brand) => {
        setSelectedBrand(brand);
        setFormData({
            name: brand.name || '',
            description: brand.description || '',
            homepage_url: brand.homepage_url || ''
        });
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            homepage_url: ''
        });
    };

    const filteredBrands = brands.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-main flex items-center gap-3">
                        <Building2 className="text-primary" size={32} />
                        브랜드 관리
                    </h1>
                    <p className="text-text-secondary mt-1">내가 운영하는 브랜드나 클라이언트를 효율적으로 관리하세요.</p>
                </div>
                <Button 
                    className="bg-primary hover:bg-primary-dark text-white rounded-xl py-6 px-8 text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105"
                    onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                >
                    <Plus className="mr-2" /> 새 브랜드 등록
                </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border shadow-sm">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                        placeholder="브랜드명 또는 카테고리 검색..." 
                        className="pl-12 py-6 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewType('grid')}
                        className={`p-2 rounded-md transition-all ${viewType === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button 
                        onClick={() => setViewType('list')}
                        className={`p-2 rounded-md transition-all ${viewType === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                    <Loader2 className="animate-spin mb-4" size={40} />
                    <p>브랜드 정보를 불러오는 중...</p>
                </div>
            ) : filteredBrands.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <Building2 className="mx-auto h-20 w-20 text-gray-200 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">검색된 브랜드가 없습니다.</h3>
                    <p className="text-gray-500 mt-2">새로운 브랜드를 등록하여 캠페인을 시작해보세요!</p>
                </div>
            ) : viewType === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBrands.map(brand => (
                        <div key={brand.id} className="group bg-white rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl">
                                        {brand.logo_url ? (
                                            <img src={brand.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                                        ) : (
                                            <span className="font-black text-gray-300">{brand.name.substring(0, 1)}</span>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                                <MoreVertical size={20} className="text-gray-400" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem onClick={() => openEditModal(brand)}>
                                                <Edit2 size={16} className="mr-2" /> 수정하기
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteBrand(brand)}>
                                                <Trash2 size={16} className="mr-2" /> 삭제하기
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors truncate">
                                    {brand.name}
                                </h3>
                                
                                <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-6">
                                    {brand.description || '브랜드 설명이 등록되지 않았습니다.'}
                                </p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <Megaphone size={16} className="text-primary" />
                                        <span className="text-sm font-bold">{brand.campaign_count}개 캠페인</span>
                                    </div>
                                    <button className="text-gray-400 hover:text-primary transition-colors">
                                        <ExternalLink size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-border">
                            <tr>
                                <th className="p-6 font-bold text-sm text-gray-600">브랜드</th>
                                <th className="p-6 font-bold text-sm text-gray-600">등록 캠페인</th>
                                <th className="p-6 font-bold text-sm text-gray-600">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredBrands.map(brand => (
                                <tr key={brand.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-gray-300">
                                                {brand.name.substring(0, 1)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{brand.name}</div>
                                                <div className="text-xs text-gray-400">{brand.homepage_url || '홈페이지 없음'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-1.5 font-semibold">
                                            <Megaphone size={16} className="text-primary" />
                                            {brand.campaign_count}개
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                className="p-2 hover:bg-white border hover:border-blue-200 rounded-lg text-gray-600 hover:text-blue-600 transition-all"
                                                onClick={() => openEditModal(brand)}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                className="p-2 hover:bg-white border hover:border-red-200 rounded-lg text-gray-600 hover:text-red-600 transition-all"
                                                onClick={() => handleDeleteBrand(brand)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Dialog 
                open={isAddModalOpen || isEditModalOpen} 
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddModalOpen(false);
                        setIsEditModalOpen(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[500px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">
                            {isAddModalOpen ? '새 브랜드 등록' : '브랜드 정보 수정'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="py-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-base font-bold">브랜드명 <span className="text-red-500">*</span></Label>
                            <Input 
                                placeholder="예: 다온뷰, 삼성전자, 나이키 등" 
                                className="py-6 rounded-xl border-slate-200"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-base font-bold">홈페이지 URL</Label>
                            <Input 
                                placeholder="https://..." 
                                className="py-6 rounded-xl border-slate-200"
                                value={formData.homepage_url}
                                onChange={(e) => setFormData({...formData, homepage_url: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-base font-bold">브랜드 소개</Label>
                            <Textarea 
                                placeholder="브랜드에 대한 간단한 설명을 입력해주세요." 
                                className="rounded-xl border-slate-200 min-h-[100px] resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button 
                            variant="ghost" 
                            className="rounded-xl py-6 flex-1 font-bold"
                            onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                        >
                            취소
                        </Button>
                        <Button 
                            className="bg-primary hover:bg-primary-dark text-white rounded-xl py-6 flex-1 font-bold"
                            onClick={isAddModalOpen ? handleAddBrand : handleEditBrand}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <Loader2 className="animate-spin mr-2" size={20} />
                            ) : null}
                            {isAddModalOpen ? '등록하기' : '저장하기'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
