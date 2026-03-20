interface DateCellProps {
    date: string | Date | null | undefined;
    showTime?: boolean;
}

function formatKstDateTime(input: Date) {
    // 환경/로케일에 따라 문자열이 달라지는 toLocale* 대신
    // KST 기준 고정 포맷(YYYY.MM.DD HH:mm)으로 렌더링한다.
    const kstMs = input.getTime() + 9 * 60 * 60 * 1000;
    const kst = new Date(kstMs);

    const year = kst.getUTCFullYear();
    const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kst.getUTCDate()).padStart(2, '0');
    const hours = String(kst.getUTCHours()).padStart(2, '0');
    const minutes = String(kst.getUTCMinutes()).padStart(2, '0');

    return {
        date: `${year}.${month}.${day}`,
        time: `${hours}:${minutes}`,
    };
}

export function DateCell({ date, showTime = false }: DateCellProps) {
    if (!date) {
        return <span className="text-gray-400 text-sm">-</span>;
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const formatted = formatKstDateTime(dateObj);

    return (
        <div className="text-sm whitespace-nowrap">
            <div className="font-medium text-gray-900">
                {formatted.date}
            </div>
            {showTime && (
                <div className="text-xs text-gray-400">
                    {formatted.time}
                </div>
            )}
        </div>
    );
}
