import { User } from '@/types/database';

interface UserInfoCellProps {
    user: User | null | undefined;
    showEmail?: boolean;
    showAvatar?: boolean;
}

export function UserInfoCell({ user, showEmail = true, showAvatar = true }: UserInfoCellProps) {
    if (!user) {
        return <span className="text-gray-400 text-sm">사용자 정보 없음</span>;
    }

    return (
        <div className="flex items-center gap-3">
            {showAvatar && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {user.nickname?.charAt(0) || '?'}
                </div>
            )}
            <div className="min-w-0">
                <div className="font-bold text-gray-900 truncate">
                    {user.name ? (
                        <span className="flex items-center gap-1.5">
                            {user.name}
                            <span className="text-xs font-normal text-gray-500">({user.nickname})</span>
                        </span>
                    ) : user.nickname || '이름 없음'}
                </div>
                {showEmail && (
                    <div className="text-xs text-gray-500 truncate">
                        {user.email}
                    </div>
                )}
            </div>
        </div>
    );
}
