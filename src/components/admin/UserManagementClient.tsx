'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types/database';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search,
    Filter,
    Building2,
    ShieldCheck,
    MoreHorizontal,
    Mail,
    Phone,
    Calendar
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import SocialIconBadges from '@/components/SocialIconBadges';

type TabType = 'all' | 'INFLUENCER' | 'ADVERTISER' | 'ADMIN';

interface UserManagementClientProps {
    initialUsers: Profile[];
    initialStats: {
        total: number;
        influencer: number;
        advertiser: number;
        admin: number;
    };
}

export default function UserManagementClient({ initialUsers, initialStats }: UserManagementClientProps) {
    const searchParams = useSearchParams();
    const [users, setUsers] = useState<Profile[]>(initialUsers);
    const [stats, setStats] = useState(initialStats);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentTab, setCurrentTab] = useState<TabType>(
        (searchParams.get('tab') as TabType) || 'all'
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const tab = searchParams.get('tab') as TabType;
        if (tab && ['all', 'INFLUENCER', 'ADVERTISER', 'ADMIN'].includes(tab)) {
            setCurrentTab(tab);
        }
    }, [searchParams]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setUsers(data as Profile[]);
                const counts = data.reduce((acc, user) => {
                    acc.total++;
                    if (user.role === 'INFLUENCER') acc.influencer++;
                    else if (user.role === 'ADVERTISER') acc.advertiser++;
                    else if (user.role === 'ADMIN') acc.admin++;
                    return acc;
                }, { total: 0, influencer: 0, advertiser: 0, admin: 0 });
                setStats(counts);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('회원 목록을 동기화하는 데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            toast.success('회원 등급이 변경되었습니다.');
            fetchUsers();
        } catch (error) {
            console.error('Error changing role:', error);
            toast.error('등급 변경에 실패했습니다.');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTab = currentTab === 'all' || user.role === currentTab;

        return matchesSearch && matchesTab;
    });

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return <span className="bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-violet-200 whitespace-nowrap">관리자</span>;
            case 'ADVERTISER':
                return <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-200 whitespace-nowrap">광고주</span>;
            case 'INFLUENCER':
                return <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-rose-200 whitespace-nowrap">인플루언서</span>;
            default:
                return <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-gray-200 whitespace-nowrap">{role}</span>;
        }
    };

    return (
        <>
            <header className="bg-white border-b border-border py-8">
                <div className="container px-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-text-main tracking-tight flex items-center gap-3">
                                <ShieldCheck className="text-primary w-8 h-8" />
                                회원 통합 관리
                            </h1>
                            <p className="text-gray-500 mt-1">플랫폼의 모든 회원을 관리하고 등급을 조정할 수 있습니다.</p>
                        </div>
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                            <button
                                onClick={() => setCurrentTab('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${currentTab === 'all' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                전체 {stats.total}
                            </button>
                            <button
                                onClick={() => setCurrentTab('INFLUENCER')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${currentTab === 'INFLUENCER' ? 'bg-white shadow-sm text-rose-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                인플루언서 {stats.influencer}
                            </button>
                            <button
                                onClick={() => setCurrentTab('ADVERTISER')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${currentTab === 'ADVERTISER' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                광고주 {stats.advertiser}
                            </button>
                            <button
                                onClick={() => setCurrentTab('ADMIN')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${currentTab === 'ADMIN' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                관리자 {stats.admin}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container px-4 py-8 flex-1">
                {/* Search & Stats Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="lg:col-span-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="이메일, 닉네임, 업체명으로 검색하세요..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 py-7 rounded-2xl border-none shadow-sm shadow-gray-200/50 bg-white focus:ring-2 focus:ring-primary/20 text-lg"
                            />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-border flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">검색 결과</span>
                            <span className="text-2xl font-bold text-text-main">{filteredUsers.length}명</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                            <Filter className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest min-w-[240px]">회원 정보</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest min-w-[120px]">역할/등급</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest min-w-[150px]">연락처</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest min-w-[120px]">활동채널</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest min-w-[120px]">가입일</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest min-w-[80px]">액션</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-6 py-8">
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
                                                    <div className="space-y-2">
                                                        <div className="w-48 h-4 bg-gray-100 rounded"></div>
                                                        <div className="w-32 h-3 bg-gray-50 rounded"></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <Avatar
                                                        src={user.avatar_url}
                                                        fallback={user.nickname?.[0] || user.email?.[0]}
                                                        className="h-12 w-12 border border-border shadow-sm group-hover:scale-105 transition-transform"
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-text-main truncate group-hover:text-primary transition-colors">
                                                            {user.nickname || '닉네임 없음'}
                                                        </span>
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Mail size={12} />
                                                            {user.email}
                                                        </span>
                                                        {user.role === 'ADVERTISER' && user.company_name && (
                                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mt-1 font-bold flex items-center gap-1 w-fit">
                                                                <Building2 size={10} />
                                                                {user.company_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getRoleBadge(user.role || 'INFLUENCER')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                                                    <Phone size={14} className="text-gray-400" />
                                                    {user.phone_number || '미등록'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <SocialIconBadges snsUrl={user.sns_url} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    {new Date(user.created_at || '').toLocaleDateString('ko-KR', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-full">
                                                                <MoreHorizontal size={18} className="text-gray-400" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuLabel>등급 변경</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleRoleChange(user.id, 'INFLUENCER')}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                                                인플루언서로 변경
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleRoleChange(user.id, 'ADVERTISER')}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                광고주로 변경
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleRoleChange(user.id, 'ADMIN')}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                                                                관리자로 변경
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-red-500 focus:text-red-600 focus:bg-red-50">
                                                                회원 탈퇴 처리
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                                            검색 조건에 맞는 회원이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </>
    );
}
