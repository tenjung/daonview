'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    ShieldCheck,
    FileText,
    Upload,
    CheckCircle2,
    Clock,
    AlertCircle,
    Building2,
    ArrowRight,
    XCircle,
    FileSearch
} from 'lucide-react';
import AdvertiserSidebar from '@/components/AdvertiserSidebar';
import DashboardSidebar from '@/components/DashboardSidebar';
import { ADVERTISER_LINKS } from '@/constants/navigation';

export default function AdvertiserVerificationPage() {
    const { user, profile, fetchProfile } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [bizNumber, setBizNumber] = useState(profile?.biz_number || '');
    const [companyName, setCompanyName] = useState(profile?.company_name || '');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAiVerifying, setIsAiVerifying] = useState(false);

    useEffect(() => {
        if (profile) {
            setBizNumber(profile.biz_number || '');
            setCompanyName(profile.company_name || '');
        }
    }, [profile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!bizNumber || !companyName || (!file && !profile?.biz_certificate_url)) {
            toast.error('모든 필수 정보를 입력하고 등록증을 첨부해 주세요.');
            return;
        }

        setLoading(true);
        try {
            // 1. AI 자동 인증 시도
            let isAutoApproved = false;
            if (file) {
                setIsAiVerifying(true);
                try {
                    const base64 = await fileToBase64(file);
                    const aiRes = await fetch('/api/ai-service/verify-biz', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            companyName,
                            bizNumber,
                            fileBase64: base64,
                            userId: user.id
                        })
                    });
                    const aiData = await aiRes.json();

                    if (aiData.autoApproved) {
                        isAutoApproved = true;
                        toast.success('AI 심사 결과 정보가 일치하여 즉시 승인되었습니다! 🎉');
                    } else if (aiData.reason) {
                        toast.info(`AI 심사 알림: ${aiData.reason}\n(수동 심사로 전환됩니다.)`);
                    }
                } catch (aiErr) {
                    console.error('AI verification failed:', aiErr);
                    // AI 실패해도 수동 심사는 진행
                } finally {
                    setIsAiVerifying(false);
                }
            }

            // 2. 파일 업로드 및 최종 업데이트
            let certificateUrl = profile?.biz_certificate_url;
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('files')
                    .upload(`biz-certificates/${fileName}`, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('files')
                    .getPublicUrl(`biz-certificates/${fileName}`);

                certificateUrl = publicUrl;
            }

            // AI가 이미 승인한 경우와 아닌 경우의 상태 결정
            const status = isAutoApproved ? 'APPROVED' : 'PENDING';

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    company_name: companyName,
                    biz_number: bizNumber,
                    biz_certificate_url: certificateUrl,
                    biz_verification_status: status,
                    biz_verification_requested_at: new Date().toISOString(),
                    biz_rejection_reason: null
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            if (!isAutoApproved) {
                // 관리자에게 알림 전송 (수동 심사 레이어)
                const { data: adminUsers } = await supabase.from('profiles').select('id').eq('role', 'ADMIN');
                if (adminUsers && adminUsers.length > 0) {
                    const notifications = adminUsers.map(admin => ({
                        user_id: admin.id,
                        type: 'SYSTEM',
                        title: '🏢 새 사업자 인증 요청',
                        content: `[${companyName}] 광고주가 사업자 인증을 요청했습니다. (AI 자동승인 실패)`,
                        link: '/dashboard/admin/verifications'
                    }));
                    await supabase.from('notifications').insert(notifications);
                }
                toast.success('인증 요청이 제출되었습니다. 관리자 승인 후 캠페인 등록이 가능합니다.');
            }

            await fetchProfile(user.id);
        } catch (error: any) {
            console.error('Verification error:', error);
            toast.error(error.message || '인증 요청 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const renderStatus = () => {
        const status = profile?.biz_verification_status || 'NONE';

        if (status === 'PENDING') {
            return (
                <div className="bg-amber-50 border border-amber-100 p-8 rounded-3xl text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <Clock size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-amber-900">심사 진행 중</h3>
                    <p className="text-amber-700 max-w-md mx-auto leading-relaxed">
                        사업자 인증 심사가 진행 중입니다. <br />
                        AI 분석이 완료되었으며, 현재 관리자가 최종 검토 중입니다.
                    </p>
                    <div className="pt-4">
                        <div className="inline-flex items-center gap-2 text-sm text-amber-600 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-amber-100/50">
                            요청일: {new Date(profile?.biz_verification_requested_at || '').toLocaleDateString()}
                        </div>
                    </div>
                </div>
            );
        }

        if (status === 'APPROVED') {
            return (
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-900">인증 완료</h3>
                    <p className="text-emerald-700 max-w-md mx-auto leading-relaxed">
                        비즈니스 인증이 성공적으로 완료되었습니다. <br />
                        이제 자유롭게 캠페인을 등록하고 인플루언서를 모집할 수 있습니다.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-6 max-w-sm mx-auto">
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Company</div>
                            <div className="text-sm font-bold text-gray-900 truncate">{profile?.company_name}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Biz ID</div>
                            <div className="text-sm font-bold text-gray-900">{profile?.biz_number}</div>
                        </div>
                    </div>
                </div>
            );
        }

        if (status === 'REJECTED') {
            return (
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl text-center space-y-4 mb-10">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                        <XCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-rose-900">심사 반려 안내</h3>
                    <p className="text-rose-700 max-w-md mx-auto leading-relaxed">
                        사업자 정보가 아래의 사유로 반려되었습니다. <br />
                        정보를 수정하여 다시 제출해 주세요.
                    </p>
                    <div className="bg-white p-5 rounded-2xl border border-rose-200 text-left mt-4 shadow-sm">
                        <div className="text-[10px] text-rose-400 font-black uppercase mb-1 tracking-widest pl-1">반려 사유</div>
                        <p className="text-sm text-rose-600 font-medium whitespace-pre-line leading-relaxed italic">
                            {profile?.biz_rejection_reason || '사유가 기재되지 않았습니다.'}
                        </p>
                    </div>
                    <Button
                        onClick={() => window.scrollTo({ top: 1000, behavior: 'smooth' })}
                        variant="ghost"
                        className="text-rose-600 font-bold hover:bg-rose-100/50"
                    >
                        다시 신청하기 <ArrowRight size={16} className="ml-2" />
                    </Button>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="ADVERTISER"
                userName={profile?.company_name || profile?.nickname || '광고주'}
                links={ADVERTISER_LINKS.map(link => ({
                    ...link,
                    active: link.href === '/dashboard/advertiser/verification'
                }))}
            />

            <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                                <ShieldCheck className="w-8 h-8 text-primary" />
                                비즈니스 인증
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium">AI 자동 시스템을 통해 사업자 정보를 즉시 인증받으세요.</p>
                        </div>
                    </div>

                    {renderStatus()}

                    {(profile?.biz_verification_status === 'NONE' || profile?.biz_verification_status === 'REJECTED') && (
                        <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-[32px] overflow-hidden bg-white mt-8">
                            <CardHeader className="bg-gray-900 text-white p-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-primary">
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">사업자 정보 입력</CardTitle>
                                        <CardDescription className="text-gray-400">AI가 서류 정보를 분석하여 일치할 경우 즉시 승인합니다.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold text-gray-700 pl-1 flex items-center gap-2">
                                                <Building2 size={16} className="text-gray-400" />
                                                회사명 / 상호명
                                            </Label>
                                            <Input
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                placeholder="(주)다온컴퍼니"
                                                className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-medium"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold text-gray-700 pl-1 flex items-center gap-2">
                                                <FileSearch size={16} className="text-gray-400" />
                                                사업자 등록번호
                                            </Label>
                                            <Input
                                                value={bizNumber}
                                                onChange={(e) => setBizNumber(e.target.value)}
                                                placeholder="000-00-00000"
                                                className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-medium"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-gray-700 pl-1 flex items-center gap-2">
                                            <FileText size={16} className="text-gray-400" />
                                            사업자 등록증 첨부
                                        </Label>

                                        <div className="relative group">
                                            <Input
                                                type="file"
                                                onChange={handleFileChange}
                                                accept="image/*,.pdf"
                                                className="hidden"
                                                id="biz-cert-upload"
                                            />
                                            <label
                                                htmlFor="biz-cert-upload"
                                                className={`w-full h-64 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center cursor-pointer transition-all ${previewUrl
                                                        ? 'border-primary/30 bg-primary/5'
                                                        : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                                                    }`}
                                            >
                                                {previewUrl ? (
                                                    <div className="relative w-full h-full p-4 flex flex-col items-center">
                                                        {file?.type.includes('pdf') ? (
                                                            <div className="flex-1 flex flex-col items-center justify-center text-primary">
                                                                <FileSearch size={64} className="mb-4" />
                                                                <span className="font-bold text-lg">{file.name}</span>
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={previewUrl}
                                                                alt="Preview"
                                                                className="flex-1 h-full object-contain rounded-2xl shadow-lg"
                                                            />
                                                        )}
                                                        <div className="mt-4 text-xs font-bold text-primary bg-white px-4 py-2 rounded-full shadow-sm">
                                                            파일 교체하기
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 mb-4">
                                                            <Upload size={32} />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="font-bold text-gray-700 text-lg">클릭하여 파일 업로드</p>
                                                            <p className="text-sm text-gray-400 mt-2 font-medium">JPG, PNG, PDF (최대 10MB)</p>
                                                        </div>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="pt-6 pointer-events-none opacity-50 select-none">
                                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex gap-4">
                                            <ShieldCheck className="text-gray-400 shrink-0 mt-1" />
                                            <div className="text-xs text-gray-500 leading-relaxed font-medium">
                                                <p className="font-bold text-gray-700 mb-1">개인정보 수집 및 이용 안내</p>
                                                입력하신 사업자 정보는 비즈니스 신원 확인을 위한 목적으로만 사용되며, <br />
                                                승인 완료 후 안전하게 보호됩니다. 허위 정보 기재 시 이용이 제한될 수 있습니다.
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-16 rounded-2xl bg-primary text-white text-lg font-black shadow-xl shadow-rose-200 hover:shadow-2xl transition-all transform active:scale-95 disabled:opacity-50 mt-4"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                {isAiVerifying ? 'AI 서류 정밀 분석 중...' : '인증 요청 처리 중...'}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 uppercase tracking-tight">
                                                인증 요청 제출하기 <CheckCircle2 size={24} />
                                            </div>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
