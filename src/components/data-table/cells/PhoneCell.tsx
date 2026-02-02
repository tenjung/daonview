import { Phone } from 'lucide-react';

interface PhoneCellProps {
    phone: string | null | undefined;
}

export function PhoneCell({ phone }: PhoneCellProps) {
    if (!phone) {
        return <span className="text-xs text-gray-400 italic">미등록</span>;
    }

    return (
        <div className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
            <Phone size={14} className="text-gray-400 flex-shrink-0" />
            <span>{phone}</span>
        </div>
    );
}
