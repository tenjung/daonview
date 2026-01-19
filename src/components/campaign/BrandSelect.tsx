'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Building2, Loader2, Search, Edit2, Trash2, Megaphone } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Brand {
    id: string;
    name: string;
    logo_url?: string;
    category?: string;
    campaign_count?: number;
}

interface BrandSelectProps {
    value: string | null;
    onChange: (brandId: string, brandName: string) => void;
    userId: string;
}

export default function BrandSelect({ value, onChange, userId }: BrandSelectProps) {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // New/Edit Brand Form
    const [newName, setNewName] = useState('');
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchBrands();
        }
    }, [userId]);

    const fetchBrands = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('brands')
                .select('*, campaignsCount:campaigns(count)')
                .eq('created_by', userId)
                .order('name');

            if (error) throw error;
            
            const formattedBrands = data?.map((b: any) => ({
                ...b,
                campaign_count: b.campaignsCount?.[0]?.count || 0
            })) || [];
            
            setBrands(formattedBrands);
        } catch (error) {
            console.error('Error fetching brands:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveBrand = async () => {
        if (!newName.trim()) {
            toast.error('브랜드 이름을 입력해주세요.');
            return;
        }

        setIsCreating(true);
        try {
            if (editingBrand) {
                const { error } = await supabase
                    .from('brands')
                    .update({ name: newName })
                    .eq('id', editingBrand.id);

                if (error) throw error;
                
                toast.success('브랜드 정보가 수정되었습니다.');
                setBrands(prev => prev.map(b => b.id === editingBrand.id ? { ...b, name: newName } : b));
                
                if (value === editingBrand.id) {
                    onChange(editingBrand.id, newName);
                }
            } else {
                const { data, error } = await supabase
                    .from('brands')
                    .insert([{ name: newName, created_by: userId }])
                    .select()
                    .single();

                if (error) throw error;

                toast.success('새 브랜드가 등록되었습니다.');
                const newBrand = { ...data, campaign_count: 0 };
                setBrands(prev => [...prev, newBrand].sort((a, b) => a.name.localeCompare(b.name)));
                onChange(data.id, data.name);
            }
            
            setShowModal(false);
            setNewName('');
            setEditingBrand(null);
        } catch (error: any) {
            console.error('Error saving brand:', error);
            toast.error(editingBrand ? '수정에 실패했습니다.' : '브랜드 등록에 실패했습니다.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteBrand = async (e: React.MouseEvent, brand: Brand) => {
        e.stopPropagation();
        
        if (brand.campaign_count && brand.campaign_count > 0) {
            toast.error('삭제 불가', {
                description: `이 브랜드를 사용하는 캠페인이 ${brand.campaign_count}개 있습니다.`,
            });
            return;
        }

        if (!confirm(`'${brand.name}' 브랜드를 삭제하시겠습니까?`)) return;

        setIsDeleting(brand.id);
        try {
            const { error } = await supabase
                .from('brands')
                .delete()
                .eq('id', brand.id);

            if (error) throw error;

            toast.success('브랜드가 삭제되었습니다.');
            setBrands(prev => prev.filter(b => b.id !== brand.id));
            if (value === brand.id) {
                onChange('', '');
            }
        } catch (error) {
            console.error('Error deleting brand:', error);
            toast.error('삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(null);
        }
    };

    const openEditModal = (e: React.MouseEvent, brand: Brand) => {
        e.stopPropagation();
        setEditingBrand(brand);
        setNewName(brand.name);
        setShowModal(true);
        setIsPopoverOpen(false); // 모달 열 때 팝오버 닫기
    };

    const filteredBrands = brands.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedBrand = brands.find(b => b.id === value);

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                                "w-full justify-between py-6 px-4 rounded-xl border-gray-200 bg-white hover:bg-gray-50 transition-all text-base",
                                !value && "text-gray-400"
                            )}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Building2 size={18} className={value ? "text-primary" : "text-gray-300"} />
                                {selectedBrand ? (
                                    <span className="font-bold text-gray-900">{selectedBrand.name}</span>
                                ) : (
                                    "진행할 브랜드를 선택하세요"
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                {selectedBrand && (
                                    <span className="text-xs bg-rose-50 text-primary px-2 py-0.5 rounded-full font-bold">
                                        캠페인 {selectedBrand.campaign_count}개
                                    </span>
                                )}
                                <Search size={16} />
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[500px] rounded-2xl overflow-hidden shadow-2xl border-border" align="start">
                        <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <Input
                                    placeholder="브랜드 검색..."
                                    className="pl-9 bg-white border-gray-200 h-10 text-sm focus:ring-primary/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto py-2 custom-scrollbar">
                            {isLoading ? (
                                <div className="p-8 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-primary" size={20} />
                                </div>
                            ) : filteredBrands.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Building2 className="mx-auto h-10 w-10 text-gray-200 mb-2" />
                                    <p className="text-sm text-gray-500 font-medium">
                                        {searchTerm ? "검색 결과가 없습니다." : "등록된 브랜드가 없습니다."}
                                    </p>
                                </div>
                            ) : (
                                filteredBrands.map((brand) => (
                                    <div key={brand.id} className="px-2 pb-1">
                                        <div 
                                            className={cn(
                                                "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                                                value === brand.id 
                                                    ? "bg-rose-50 border border-rose-100" 
                                                    : "hover:bg-gray-50 border border-transparent"
                                            )}
                                            onClick={() => {
                                                onChange(brand.id, brand.name);
                                                setIsPopoverOpen(false);
                                            }}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                                                    value === brand.id ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                                                )}>
                                                    {brand.name.substring(0, 1)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className={cn("text-sm font-bold truncate", value === brand.id ? "text-primary" : "text-gray-900")}>
                                                        {brand.name}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">캠페인 {brand.campaign_count}개</div>
                                                </div>
                                                {value === brand.id && <Check size={14} className="text-primary shrink-0" />}
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 rounded-md hover:bg-white text-gray-400 hover:text-blue-500"
                                                    onClick={(e) => openEditModal(e, brand)}
                                                >
                                                    <Edit2 size={12} />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 rounded-md hover:bg-white text-gray-400 hover:text-red-500"
                                                    onClick={(e) => handleDeleteBrand(e, brand)}
                                                    disabled={isDeleting === brand.id}
                                                >
                                                    {isDeleting === brand.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-2 bg-gray-50 border-t border-gray-100">
                            <Button 
                                variant="ghost" 
                                className="w-full justify-center gap-2 py-5 text-sm font-bold text-primary hover:bg-rose-100/50 hover:text-primary transition-colors"
                                onClick={() => {
                                    setEditingBrand(null);
                                    setNewName('');
                                    setShowModal(true);
                                    setIsPopoverOpen(false);
                                }}
                            >
                                <Plus size={16} /> 새 브랜드 등록하기
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Registration/Edit Modal */}
            <Dialog open={showModal} onOpenChange={(open) => {
                setShowModal(open);
                if (!open) {
                    setEditingBrand(null);
                    setNewName('');
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBrand ? '브랜드 정보 수정' : '새 브랜드 등록'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="brand-name">브랜드명 <span className="text-red-500">*</span></Label>
                            <Input 
                                id="brand-name" 
                                placeholder="예: 다온뷰, 나이키 등" 
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>취소</Button>
                        <Button onClick={handleSaveBrand} disabled={isCreating}>
                            {isCreating ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                            {editingBrand ? '수정 완료' : '등록하기'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
