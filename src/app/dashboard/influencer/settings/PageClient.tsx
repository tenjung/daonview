'use client';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import { Settings } from 'lucide-react';
import DashboardPageLayout from '@/components/dashboard/DashboardPageLayout';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { updateMyProfile, getProfileUpdateErrorMessage } from '@/lib/profile/updateMyProfile';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

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
            await updateMyProfile({
                nickname: formData.nickname,
                phone_number: formData.phone_number,
                sns_url: formData.sns_url
            }, { expectedUserId: user.id });

            setMessage('프로필이 성공적으로 업데이트되었습니다.');
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage(getProfileUpdateErrorMessage(error, '프로필 업데이트에 실패했습니다.'));
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
        <DashboardPageLayout role="INFLUENCER" userName={profile?.nickname || '사용자'}>

                <div className="max-w-2xl">
                    <DashboardPageHeader icon={Settings} title="계정 설정" description="연락처와 SNS 정보 등 계정 정보를 관리합니다." />

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
        </DashboardPageLayout>
    );
}
