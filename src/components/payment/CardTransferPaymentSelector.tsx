'use client';

import { Building2, CreditCard } from 'lucide-react';

type SelectorVariant = 'CAMPAIGN' | 'UNLIMITED';
type CorePaymentMethod = 'CARD' | 'TRANSFER';

interface CardTransferPaymentSelectorProps {
    selectedMethod: string | null | undefined;
    onSelect: (method: CorePaymentMethod) => void;
    cardLabel?: string;
    cardDescription: string;
    transferLabel?: string;
    transferDescription: string;
    variant?: SelectorVariant;
}

const isSelected = (value: string | null | undefined, target: CorePaymentMethod) =>
    String(value || '').toUpperCase() === target;

export default function CardTransferPaymentSelector({
    selectedMethod,
    onSelect,
    cardLabel = '신용 / 체크카드',
    cardDescription,
    transferLabel = '계좌이체',
    transferDescription,
    variant = 'UNLIMITED',
}: CardTransferPaymentSelectorProps) {
    const cardSelected = isSelected(selectedMethod, 'CARD');
    const transferSelected = isSelected(selectedMethod, 'TRANSFER');
    const isCampaign = variant === 'CAMPAIGN';

    const cardClasses = isCampaign
        ? cardSelected
            ? 'border-blue-500 bg-blue-50 shadow-sm'
            : 'border-gray-200 hover:border-blue-300 hover:bg-slate-50'
        : cardSelected
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-100 bg-gray-50 hover:border-gray-200';

    const transferClasses = isCampaign
        ? transferSelected
            ? 'border-emerald-500 bg-emerald-50 shadow-sm'
            : 'border-gray-200 hover:border-emerald-300 hover:bg-slate-50'
        : transferSelected
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-100 bg-gray-50 hover:border-gray-200';

    return (
        <div className="flex flex-col gap-3">
            <button
                type="button"
                onClick={() => onSelect('CARD')}
                className={`relative flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all group ${cardClasses}`}
            >
                <div className="flex items-center gap-4 flex-1 text-left">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${cardSelected ? (isCampaign ? 'border-blue-500 bg-blue-500' : 'border-purple-500 bg-purple-500') : 'border-gray-300'}`}>
                        {cardSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                    <div className={`p-2.5 rounded-xl ${isCampaign ? 'bg-blue-100/50 text-blue-600' : 'bg-purple-100/50 text-purple-600'}`}>
                        <CreditCard size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-[15px] text-gray-900 leading-none mb-1">{cardLabel}</span>
                        <span className="text-[13px] text-gray-500 font-medium">{cardDescription}</span>
                    </div>
                </div>
            </button>

            <button
                type="button"
                onClick={() => onSelect('TRANSFER')}
                className={`relative flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all group ${transferClasses}`}
            >
                <div className="flex items-center gap-4 flex-1 text-left">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${transferSelected ? (isCampaign ? 'border-emerald-500 bg-emerald-500' : 'border-purple-500 bg-purple-500') : 'border-gray-300'}`}>
                        {transferSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                    <div className={`p-2.5 rounded-xl ${isCampaign ? 'bg-emerald-100/50 text-emerald-600' : 'bg-purple-100/50 text-purple-600'}`}>
                        <Building2 size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-[15px] text-gray-900 leading-none mb-1">{transferLabel}</span>
                        <span className="text-[13px] text-gray-500 font-medium">{transferDescription}</span>
                    </div>
                </div>
            </button>
        </div>
    );
}
