"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
    ShieldCheck,
    Filter,
    Users as UsersIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { createUserColumns } from './users-columns';

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

    const handleDeleteUser = async (userId: string, email: string) => {
        if (!confirm(`${email} 회원을 강제로 탈퇴 처리하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
        
        // 실제 운영 시에는 Auth 서비스와 연동된 삭제 로직이 필요하나, 
        // 여기서는 프로필 소프트 삭제 또는 별도 처리 가정
        toast.info('회원 탈퇴 처리 로직이 필요합니다. (API 연동)');
    };

    const filteredUsers = useMemo(() => {
        if (currentTab === 'all') return users;
        return users.filter(user => user.role === currentTab);
    }, [users, currentTab]);

    const columns = useMemo(() => createUserColumns({
        onRoleChange: handleRoleChange,
        onDelete: handleDeleteUser,
        isAdmin: true
    }), [users]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/30">
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
                <DataTable 
                    columns={columns}
                    data={filteredUsers}
                    searchKey="nickname"
                    searchPlaceholder="닉네임으로 검색..."
                    isLoading={loading}
                    enableRowSelection={true}
                />
            </main>
        </div>
    );
}
