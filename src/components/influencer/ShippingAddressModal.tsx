'use client';

import { useEffect, useRef, useState } from 'react';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { AlertTriangle, ArrowLeft, LoaderCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { formatDaumAddress, type DaumAddressData } from '@/lib/address';
import type { Profile } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ShippingAddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    profile: Profile | null;
    onSuccess: () => void | Promise<void>;
}

interface ShippingFormData {
    name: string;
    phoneNumber: string;
    zipCode: string;
    addressBase: string;
    addressDetail: string;
}

type ShippingModalView = 'FORM' | 'ADDRESS_SEARCH';

const EMPTY_FORM: ShippingFormData = {
    name: '',
    phoneNumber: '',
    zipCode: '',
    addressBase: '',
    addressDetail: '',
};

function formatPhoneNumber(value: string): string {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length < 4) return numbers;
    if (numbers.length < 8) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    if (numbers.length === 10) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

export default function ShippingAddressModal({
    isOpen,
    onClose,
    userId,
    profile,
    onSuccess,
}: ShippingAddressModalProps) {
    const [formData, setFormData] = useState<ShippingFormData>(EMPTY_FORM);
    const [view, setView] = useState<ShippingModalView>('FORM');
    const [saving, setSaving] = useState(false);
    const addressDetailRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        setFormData({
            name: profile?.name || '',
            phoneNumber: formatPhoneNumber(profile?.phone_number || ''),
            zipCode: profile?.zip_code || '',
            addressBase: profile?.address_base || '',
            addressDetail: profile?.address_detail || '',
        });
        setView('FORM');
    }, [isOpen, profile]);

    const handleAddressComplete = (data: DaumAddressData) => {
        setFormData((current) => ({
            ...current,
            zipCode: data.zonecode,
            addressBase: formatDaumAddress(data),
            addressDetail: '',
        }));
        setView('FORM');
        window.requestAnimationFrame(() => {
            addressDetailRef.current?.focus();
            addressDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const name = formData.name.trim();
        const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
        const addressDetail = formData.addressDetail.trim();

        if (name.length < 2) {
            toast.error('수령인 성함을 2글자 이상 입력해 주세요.');
            return;
        }
        if (!/^01\d{8,9}$/.test(phoneDigits)) {
            toast.error('올바른 수령인 연락처를 입력해 주세요.');
            return;
        }
        if (!formData.zipCode || !formData.addressBase) {
            toast.error('주소 검색을 통해 배송지를 선택해 주세요.');
            return;
        }
        if (!addressDetail) {
            toast.error('상세 주소를 입력해 주세요.');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name,
                    phone_number: formatPhoneNumber(phoneDigits),
                    zip_code: formData.zipCode,
                    address_base: formData.addressBase,
                    address_detail: addressDetail,
                })
                .eq('id', userId);

            if (error) throw error;

            toast.success('배송지가 저장되었습니다. 신청을 계속합니다.');
            await onSuccess();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '배송지 저장에 실패했습니다.';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open && !saving) onClose();
            }}
        >
            <DialogContent className="bottom-0 left-0 top-auto flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden overscroll-contain rounded-t-3xl border-0 p-0 sm:left-1/2 sm:top-1/2 sm:h-[min(90dvh,760px)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border">
                {view === 'FORM' ? (
                    <>
                        <DialogHeader className="relative shrink-0 border-b border-slate-100 px-5 pb-5 pt-7 pr-12 text-left sm:px-6 sm:py-5">
                            <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-300 sm:hidden" />
                            <DialogTitle className="text-xl font-bold text-slate-900 sm:text-2xl">
                                배송지 등록
                            </DialogTitle>
                            <DialogDescription className="break-keep text-sm text-slate-500">
                                제품을 받을 배송 정보를 입력해 주세요.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col animate-in slide-in-from-left-4 duration-200">
                            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
                        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">신청 전 꼭 확인해 주세요</p>
                                <p className="break-keep text-sm leading-relaxed text-amber-900/80">
                                    선정 즉시 등록된 배송지로 출고 준비가 시작될 수 있습니다. 수령인, 연락처, 기본 주소와 상세 주소를 정확히 확인해 주세요. 선정 후에는 주소 변경 및 취소가 어려울 수 있습니다.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="shipping-name" className="text-sm font-semibold text-slate-700">
                                    수령인
                                </Label>
                                <Input
                                    id="shipping-name"
                                    value={formData.name}
                                    onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                                    placeholder="수령인 실명"
                                    autoComplete="name"
                                    className="h-12 rounded-xl text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shipping-phone" className="text-sm font-semibold text-slate-700">
                                    연락처
                                </Label>
                                <Input
                                    id="shipping-phone"
                                    type="tel"
                                    inputMode="numeric"
                                    value={formData.phoneNumber}
                                    onChange={(event) => setFormData((current) => ({
                                        ...current,
                                        phoneNumber: formatPhoneNumber(event.target.value),
                                    }))}
                                    placeholder="010-0000-0000"
                                    autoComplete="tel"
                                    className="h-12 rounded-xl text-base"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">우편번호</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={formData.zipCode}
                                    readOnly
                                    placeholder="우편번호"
                                    className="h-12 w-28 rounded-xl bg-slate-50 text-base sm:w-32"
                                />
                                <Button
                                    type="button"
                                    onClick={() => setView('ADDRESS_SEARCH')}
                                    className="h-12 flex-1 rounded-xl bg-slate-800 text-sm font-semibold text-white hover:bg-slate-700"
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    주소 검색
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">기본 주소</Label>
                            <Input
                                value={formData.addressBase}
                                readOnly
                                placeholder="주소 검색을 이용해 주세요"
                                className="h-12 rounded-xl bg-slate-50 text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="shipping-address-detail" className="text-sm font-semibold text-slate-700">
                                상세 주소
                            </Label>
                            <Input
                                ref={addressDetailRef}
                                id="shipping-address-detail"
                                value={formData.addressDetail}
                                onChange={(event) => setFormData((current) => ({
                                    ...current,
                                    addressDetail: event.target.value,
                                }))}
                                placeholder="동, 호수 등 상세 주소"
                                autoComplete="address-line2"
                                className="h-12 rounded-xl text-base"
                            />
                        </div>

                        <p className="break-keep text-sm text-slate-500">
                            입력한 정보는 제품 배송을 위한 기본 배송지로 저장됩니다.
                        </p>
                            </div>

                            <div className="grid shrink-0 grid-cols-[minmax(88px,0.7fr)_minmax(0,1.3fr)] gap-2 border-t border-slate-100 bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex sm:justify-end sm:px-6 sm:pb-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={saving}
                            className="h-12 rounded-xl text-sm font-semibold sm:w-28"
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="h-12 rounded-xl bg-rose-500 text-sm font-semibold text-white hover:bg-rose-600 sm:min-w-56"
                        >
                            {saving ? (
                                <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    저장 중...
                                </>
                            ) : (
                                '저장하고 신청 계속'
                            )}
                        </Button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col animate-in slide-in-from-right-4 duration-200">
                        <DialogHeader className="relative shrink-0 border-b border-slate-100 px-5 pb-4 pt-7 pr-12 text-left sm:px-6 sm:py-5">
                            <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-300 sm:hidden" />
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setView('FORM')}
                                    aria-label="배송지 입력으로 돌아가기"
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div className="min-w-0">
                                    <DialogTitle className="text-xl font-bold text-slate-900 sm:text-2xl">
                                        주소 검색
                                    </DialogTitle>
                                    <DialogDescription className="break-keep text-sm text-slate-500">
                                        도로명, 건물명 또는 지번을 입력해 주세요.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="min-h-0 flex-1 overflow-hidden bg-white">
                            <DaumPostcodeEmbed
                                onComplete={handleAddressComplete}
                                autoClose={false}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
