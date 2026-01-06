'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types/database';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, Mail, Phone, Globe, User } from 'lucide-react';

export default function ProfileEditPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nickname: '',
        phone_number: '',
        sns_url: '',
        company_name: '',
        avatar_url: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    setProfile(data);
                    setFormData({
                        nickname: data.nickname || '',
                        phone_number: data.phone_number || '',
                        sns_url: data.sns_url || '',
                        company_name: data.company_name || '',
                        avatar_url: data.avatar_url || ''
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('프로필을 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('profiles')
                .update({
                    nickname: formData.nickname,
                    phone_number: formData.phone_number,
                    sns_url: formData.sns_url,
                    company_name: formData.company_name,
                    avatar_url: formData.avatar_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', session.user.id);

            if (error) throw error;

            toast.success('프로필이 성공적으로 업데이트되었습니다.');
            
            // Force refresh to update navbar etc.
            window.location.reload();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('프로필 업데이트에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-500">정보를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12">
            <div className="container max-w-2xl px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">내 정보 수정</h1>
                    <p className="text-gray-500 mt-1">회원님의 소중한 정보를 안전하게 관리하세요.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-rose-500 to-rose-600 text-white pb-12">
                            <CardTitle className="text-xl">기본 프로필</CardTitle>
                            <CardDescription className="text-rose-100">공개되는 프로필 정보를 설정합니다.</CardDescription>
                        </CardHeader>
                        <CardContent className="relative pt-0">
                            {/* Avatar Section */}
                            <div className="flex justify-center -translate-y-12 mb-[-3rem]">
                                <div className="relative group">
                                    <Avatar 
                                        src={formData.avatar_url} 
                                        fallback={formData.nickname?.[0] || '?'} 
                                        className="h-24 w-24 ring-4 ring-white shadow-xl text-2xl"
                                    />
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Camera className="text-white w-6 h-6" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 mt-8">
                                <div className="grid gap-2">
                                    <Label htmlFor="avatar_url" className="flex items-center gap-2">
                                        <Camera className="w-4 h-4 text-gray-400" />
                                        프로필 이미지 URL
                                    </Label>
                                    <Input 
                                        id="avatar_url" 
                                        placeholder="이미지 주소를 입력하세요"
                                        value={formData.avatar_url}
                                        onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                        className="bg-gray-50/50 focus:bg-white transition-all"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="nickname" className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        닉네임 <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input 
                                        id="nickname" 
                                        placeholder="사용할 닉네임을 입력하세요"
                                        value={formData.nickname}
                                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                        required
                                        className="bg-gray-50/50 focus:bg-white transition-all"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        이메일 (계정 정보)
                                    </Label>
                                    <Input 
                                        value={profile?.email || ''} 
                                        disabled 
                                        className="bg-gray-100 text-gray-500 cursor-not-allowed border-dashed" 
                                    />
                                    <p className="text-[10px] text-gray-400">이메일 계정은 변경이 불가능합니다.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-gray-200/50">
                        <CardHeader>
                            <CardTitle className="text-xl">추가 정보</CardTitle>
                            <CardDescription>활동 및 연락을 위한 추가 정보를 입력하세요.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone_number" className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        연락처
                                    </Label>
                                    <Input 
                                        id="phone_number" 
                                        placeholder="010-0000-0000"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        className="bg-gray-50/50 focus:bg-white transition-all"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="sns_url" className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-gray-400" />
                                        SNS URL
                                    </Label>
                                    <Input 
                                        id="sns_url" 
                                        placeholder="https://instagram.com/..."
                                        value={formData.sns_url}
                                        onChange={(e) => setFormData({ ...formData, sns_url: e.target.value })}
                                        className="bg-gray-50/50 focus:bg-white transition-all"
                                    />
                                </div>

                                {profile?.role === 'ADVERTISER' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="company_name" className="flex items-center gap-2">
                                            회사명/브랜드명
                                        </Label>
                                        <Input 
                                            id="company_name" 
                                            placeholder="회사 이름을 입력하세요"
                                            value={formData.company_name}
                                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                            className="bg-gray-50/50 focus:bg-white transition-all"
                                        />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            className="flex-1 py-6 text-base font-bold text-gray-500 hover:bg-gray-100 transition-all rounded-xl"
                            onClick={() => router.back()}
                        >
                            취소
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={saving}
                            className="flex-[2] py-6 text-base font-bold bg-rose-500 hover:bg-rose-600 transition-all rounded-xl shadow-lg shadow-rose-500/20"
                        >
                            {saving ? '저장 중...' : '변경사항 저장하기'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
