'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

type UserType = 'INFLUENCER' | 'ADVERTISER';

export default function SignupPage() {
    const router = useRouter();
    const [userType, setUserType] = useState<UserType>('INFLUENCER');
    const [loading, setLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [name, setName] = useState(''); // Handles 'name' or 'manager'
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (password !== passwordConfirm) {
            toast.error('비밀번호가 일치하지 않습니다.');
            setLoading(false);
            return;
        }

        try {
            // 1. SignUp with Metadata
            // 메타데이터를 함께 보내면 나중에 트리거로 처리하기도 좋습니다.
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        role: userType,
                        company_name: companyName,
                        phone: phone,
                    }
                }
            });

            if (authError) {
                // 이미 가입된 경우, 바로 로그인 시도 (사용자 경험 개선)
                if (authError.message.includes('already registered')) {
                    console.log('User already registered, attempting login...');

                    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                        email,
                        password
                    });

                    if (!loginError && loginData.session) {
                        toast.success('이미 가입된 계정입니다.', {
                            description: '자동으로 로그인되었습니다.',
                        });

                        // 프로필이 없는 경우를 대비해 프로필 생성 로직(치유) 실행
                        // (로그인 페이지의 로직과 동일하게 여기서도 한 번 더 챙겨줍니다)
                        const { data: profileCheck } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('id', loginData.user.id)
                            .single();

                        if (!profileCheck) {
                            await supabase.from('profiles').insert([{
                                id: loginData.user.id,
                                email: email,
                                role: userType,
                                nickname: name,
                                company_name: userType === 'ADVERTISER' ? companyName : null,
                                phone_number: phone,
                                point: 0
                            }]);
                        }

                        router.push('/');
                        return;
                    } else {
                        // 로그인 실패 (비밀번호 불일치)
                        // 강제로 페이지 이동하지 않고, 사용자가 이메일을 바꾸거나 비밀번호를 다시 입력할 수 있게 함
                        toast.error('이미 사용 중인 이메일입니다.', {
                            description: '입력하신 비밀번호와 기존 계정의 비밀번호가 다릅니다.',
                            duration: 4000,
                        });
                        setLoading(false); // 로딩 풀기
                        return;
                    }
                }
                throw authError;
            }

            if (!authData.user) {
                throw new Error('회원가입 초기화 실패');
            }

            // 2. Check if email confirmation is required
            // 세션이 없으면 이메일 인증이 필요한 상태입니다.
            if (authData.user && !authData.session) {
                toast.success('인증 메일이 발송되었습니다!', {
                    description: '이메일함을 확인하여 가입을 완료해주세요.',
                    duration: 5000,
                });
                // 인증 대기 화면이나 로그인 화면으로 이동
                setTimeout(() => router.push('/login'), 2000);
                return;
            }

            // 3. Insert Profile (Only if logged in automatically)
            // 이메일 인증이 꺼져있어서 바로 로그인 된 경우에만 프로필 생성 시도
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        email: email,
                        role: userType,
                        nickname: name,
                        company_name: userType === 'ADVERTISER' ? companyName : null,
                        phone_number: phone,
                        point: 0
                    }
                ]);

            if (profileError) {
                // 이미 프로필이 존재한다면(23505), 이는 사실상 성공입니다.
                if (profileError.code === '23505') {
                    console.log('Profile already exists, proceeding as success.');
                    toast.success('회원가입이 완료되었습니다!', {
                        description: '다온뷰에 오신 것을 환영합니다.',
                    });
                    router.push('/');
                    return;
                }

                console.error('Profile creation failed:', profileError);
                // 프로필 생성에 진짜 문제가 있어도, 일단 로그인은 되었으니 메인으로 보내고
                // 추후 로그인 시 자동 복구되도록 합니다. 쫓아내지 않습니다.
                toast.warning('가입은 완료되었으나 프로필 설정에 지연이 있습니다.', {
                    description: '서비스 이용에는 문제가 없습니다.'
                });
                router.push('/');
                return;
            }

            toast.success('회원가입이 완료되었습니다!', {
                description: '다온뷰에 오신 것을 환영합니다.',
            });
            router.push('/');

        } catch (error: any) {
            console.error('Signup Error:', error);
            toast.error(`회원가입 실패: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-8 bg-background">
            <div className="w-full max-w-[450px] bg-surface p-10 rounded-2xl border border-border shadow-sm">
                <h1 className="text-3xl font-bold text-center mb-2 text-primary tracking-tight">회원가입</h1>
                <p className="text-center text-text-secondary text-sm mb-8">
                    {userType === 'INFLUENCER' ? '다온뷰의 다양한 캠페인을 경험해보세요' : '효과적인 인플루언서 마케팅을 시작해보세요'}
                </p>

                {/* Type Toggle */}
                <div className="flex gap-2 mb-8 p-1 bg-slate-100 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setUserType('INFLUENCER')}
                        className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all ${userType === 'INFLUENCER' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-text-secondary'}`}
                    >
                        인플루언서
                    </button>
                    <button
                        type="button"
                        onClick={() => setUserType('ADVERTISER')}
                        className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all ${userType === 'ADVERTISER' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-text-secondary'}`}
                    >
                        광고주 (기업)
                    </button>
                </div>

                <form onSubmit={handleSignup}>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="email">이메일</label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-4 py-3 border border-border rounded-lg text-base transition-all bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="password">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 border border-border rounded-lg text-base transition-all bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300"
                            placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="password-confirm">비밀번호 확인</label>
                        <input
                            type="password"
                            id="password-confirm"
                            className="w-full px-4 py-3 border border-border rounded-lg text-base transition-all bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300"
                            placeholder="비밀번호를 다시 입력해주세요"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            required
                        />
                    </div>

                    {userType === 'ADVERTISER' ? (
                        <>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="company">회사명 (브랜드명)</label>
                                <input
                                    type="text"
                                    id="company"
                                    className="w-full px-4 py-3 border border-border rounded-lg text-base transition-all bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300"
                                    placeholder="사업자등록증 상의 상호명"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="manager">담당자 이름</label>
                                <input
                                    type="text"
                                    id="manager"
                                    className="w-full px-4 py-3 border border-border rounded-lg text-base transition-all bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300"
                                    placeholder="담당자 성함을 입력해주세요"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="name">이름</label>
                            <input
                                type="text"
                                id="name"
                                className="w-full px-4 py-3 border border-border rounded-lg text-base transition-all bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300"
                                placeholder="실명을 입력해주세요"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-text-main mb-2" htmlFor="phone">휴대폰 번호</label>
                        <input
                            type="tel"
                            id="phone"
                            className="w-full px-4 py-3 border border-border rounded-lg text-base transition-all bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300"
                            placeholder="010-0000-0000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary w-full py-4 text-base shadow-lg shadow-primary/20 disabled:opacity-50">
                        {loading ? '가입 처리중...' : (userType === 'INFLUENCER' ? '인플루언서로 시작하기' : '광고주로 시작하기')}
                    </button>
                </form>

                <div className="my-8 flex items-center text-text-secondary text-xs before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border">
                    <span className="px-4">또는 SNS 간편가입</span>
                </div>

                <button className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-medium transition-all mb-3 border cursor-pointer bg-[#FEE500] text-[#391B1B] border-[#FEE500] hover:bg-[#E6CF00]" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.358 2 10.5C2 13.213 3.784 15.619 6.559 16.969C6.425 17.437 5.986 18.969 5.867 19.395C5.748 19.822 6.189 20.065 6.536 19.832C8.653 18.423 11.237 16.712 11.954 16.223L12 16.22C12.33 16.233 12.663 16.24 13 16.24C18.523 16.24 23 12.882 23 8.74C23 4.602 18.523 3 12 3Z" fill="currentColor" />
                    </svg>
                    카카오로 3초 만에 시작하기
                </button>

                <button className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-medium transition-all mb-3 border cursor-pointer bg-white border-border text-text-main hover:bg-slate-50" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107" /><path d="M3.15295 7.3455L6.4385 9.755C7.2275 7.5615 9.413 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.159 2 4.828 4.1685 3.15295 7.3455Z" fill="#FF3D00" /><path d="M12 22C14.6605 22 17.0715 20.9505 18.8585 19.255L15.6555 16.711C14.63 17.4395 13.376 17.917 12 18C9.378 18 7.154 16.3215 6.328 13.9845L3.0645 16.481C4.7865 19.824 8.163 22 12 22Z" fill="#4CAF50" /><path d="M21.8055 10.0415H21V10H12V14H17.6515C17.257 15.108 16.546 16.0755 15.6555 16.711L18.8585 19.255C20.7725 17.498 21.9215 14.9475 21.9965 12.086C21.999 11.401 21.9335 10.7185 21.8055 10.0415Z" fill="#1976D2" /></svg>
                    Google로 시작하기
                </button>

                <div className="mt-8 text-center text-sm text-text-secondary">
                    이미 계정이 있으신가요?
                    <Link href="/login" className="text-primary font-bold underline ml-2">로그인</Link>
                </div>
            </div>
        </div>
    );
}
