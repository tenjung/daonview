'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Fetch user profile to get role
            let { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', authData.user?.id)
                .single();

            // If profile is missing (PGRST116), try to create it automatically
            if (profileError && (profileError.code === 'PGRST116' || !profileData)) {
                console.log('Profile missing, creating default profile...');
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: authData.user?.id,
                        email: email,
                        role: 'INFLUENCER', // Default role
                        nickname: email.split('@')[0], // Default nickname
                        point: 0
                    }]);

                if (insertError) {
                    throw new Error('프로필 자동 생성 실패: ' + insertError.message);
                }

                // Retry fetch
                const retry = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authData.user?.id)
                    .single();

                profileData = retry.data;
                profileError = retry.error;
            }

            if (profileError || !profileData) {
                console.error('Profile fetch error:', profileError);
                toast.error('프로필 정보를 불러오는데 실패했습니다.');
                return;
            }

            toast.success('로그인에 성공했습니다.');

            // Redirect based on role
            if (profileData?.role === 'ADVERTISER') {
                router.push('/dashboard/advertiser');
            } else if (profileData?.role === 'ADMIN') {
                router.push('/dashboard/admin');
            } else {
                router.push('/dashboard/influencer');
            }

        } catch (error: any) {
            console.error('Login Error:', error);
            toast.error('로그인 실패', {
                description: error.message || '이메일 또는 비밀번호를 확인해주세요.',
            });
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-8 bg-background">
            <div className="w-full max-w-[450px] bg-surface p-10 rounded-2xl border border-border shadow-sm">
                <h1 className="text-3xl font-bold text-center mb-2 text-primary tracking-tight">로그인</h1>
                <p className="text-center text-text-secondary text-sm mb-8">다온뷰에 오신 것을 환영합니다</p>

                <form onSubmit={handleLogin}>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="email">이메일</label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-4 py-3 border border-border rounded-lg text-base transition-all bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="password">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 border border-border rounded-lg text-base transition-all bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300"
                            placeholder="비밀번호를 입력해주세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-full py-4 text-base shadow-lg shadow-primary/20">
                        로그인
                    </button>
                </form>



                <div className="my-8 flex items-center text-text-secondary text-xs before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border">
                    <span className="px-4">또는 SNS 로그인</span>
                </div>

                <button className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-medium transition-all mb-3 border cursor-pointer bg-[#FEE500] text-[#391B1B] border-[#FEE500] hover:bg-[#E6CF00]" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.358 2 10.5C2 13.213 3.784 15.619 6.559 16.969C6.425 17.437 5.986 18.969 5.867 19.395C5.748 19.822 6.189 20.065 6.536 19.832C8.653 18.423 11.237 16.712 11.954 16.223L12 16.22C12.33 16.233 12.663 16.24 13 16.24C18.523 16.24 23 12.882 23 8.74C23 4.602 18.523 3 12 3Z" fill="currentColor" />
                    </svg>
                    카카오로 로그인
                </button>

                <button className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-medium transition-all mb-3 border cursor-pointer bg-white border-border text-text-main hover:bg-slate-50" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107" /><path d="M3.15295 7.3455L6.4385 9.755C7.2275 7.5615 9.413 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.159 2 4.828 4.1685 3.15295 7.3455Z" fill="#FF3D00" /><path d="M12 22C14.6605 22 17.0715 20.9505 18.8585 19.255L15.6555 16.711C14.63 17.4395 13.376 17.917 12 18C9.378 18 7.154 16.3215 6.328 13.9845L3.0645 16.481C4.7865 19.824 8.163 22 12 22Z" fill="#4CAF50" /><path d="M21.8055 10.0415H21V10H12V14H17.6515C17.257 15.108 16.546 16.0755 15.6555 16.711L18.8585 19.255C20.7725 17.498 21.9215 14.9475 21.9965 12.086C21.999 11.401 21.9335 10.7185 21.8055 10.0415Z" fill="#1976D2" /></svg>
                    Google로 로그인
                </button>

                <div className="mt-8 text-center text-sm text-text-secondary">
                    아직 계정이 없으신가요?
                    <Link href="/signup" className="text-primary font-bold underline ml-2">회원가입</Link>
                </div>
            </div>
        </div>
    );
}
