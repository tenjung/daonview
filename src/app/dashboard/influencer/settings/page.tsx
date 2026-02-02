'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function SettingsPage() {
    const { user, profile, isLoading } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        nickname: '',
        phone_number: '',
        sns_url: ''
    });

    useEffect(() => {
        if (!isLoading) {
            if (user && profile?.role === 'ADVERTISER') {
                router.replace('/dashboard/advertiser');
                return;
            }
            if (profile) {
                setFormData({
                    nickname: profile.nickname || '',
                    phone_number: profile.phone_number || '',
                    sns_url: profile.sns_url || ''
                });
            }
            setLoading(false);
        }
    }, [isLoading, profile, user, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setMessage('');

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    nickname: formData.nickname,
                    phone_number: formData.phone_number,
                    sns_url: formData.sns_url
                })
                .eq('id', user.id);

            if (error) throw error;

            setMessage('프로필이 성공적으로 업데이트되었습니다.');
            // 전역 상태 동기화 요청 (필요한 경우 authStore에 추가 로직 필요)
            // 현재는 fetchProfile이 fetch만 하고 set하므로 이를 호출하거나 
            // 직접 setProfile을 노출하여 호출 가능
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('프로필 업데이트에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar
                userType="INFLUENCER"
                userName={profile?.nickname || '사용자'}
                links={[
                    { href: '/dashboard/influencer', label: '대시보드' },
                    { href: '/dashboard/influencer/campaigns', label: '나의 캠페' },
                    { href: '/dashboard/influencer/favorites', label: '관심 캠페인' },
                    { 
                        href: '/dashboard/influencer/settings', 
                        label: '계정 설정',
                        active: true,
                        subLinks: [
                            { href: '/dashboard/influencer/settings', label: '기본 정보' }
                        ]
                    },
                    { href: '/contact', label: '1:1 문의' }
                ]}
            />

            <main className="flex-1 p-10 overflow-y-auto">
                <div className="max-w-2xl">
                    <h1 className="text-2xl font-bold text-text-main mb-8">계정 설정</h1>

                    <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    이메일
                                </label>
                                <input
                                    type="email"
                                    value={profile?.email || ''}
                                    disabled
                                    className="w-full px-4 py-3 border border-border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    닉네임 *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nickname}
                                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="닉네임을 입력하세요"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    전화번호
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="010-1234-5678"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    SNS URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.sns_url}
                                    onChange={(e) => setFormData({ ...formData, sns_url: e.target.value })}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="https://instagram.com/username"
                                />
                                <p className="text-xs text-gray-500 mt-1">인스타그램, 유튜브 등 주요 SNS 링크를 입력하세요.</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    포인트
                                </label>
                                <div className="w-full px-4 py-3 border border-border rounded-lg bg-gray-50 text-gray-700 font-bold">
                                    {profile?.point?.toLocaleString() || 0} P
                                </div>
                            </div>

                            {message && (
                                <div className={`mb-6 p-4 rounded-lg ${message.includes('성공')
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-red-50 text-red-700'
                                    }`}>
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? '저장 중...' : '저장하기'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
