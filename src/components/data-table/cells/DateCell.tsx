interface DateCellProps {
    date: string | Date | null | undefined;
    showTime?: boolean;
}

export function DateCell({ date, showTime = false }: DateCellProps) {
    if (!date) {
        return <span className="text-gray-400 text-sm">-</span>;
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return (
        <div className="text-sm whitespace-nowrap">
            <div className="font-medium text-gray-900">
                {dateObj.toLocaleDateString('ko-KR')}
            </div>
            {showTime && (
                <div className="text-xs text-gray-400">
                    {dateObj.toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}
                </div>
            )}
        </div>
    );
}
