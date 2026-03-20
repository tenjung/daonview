'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    ShieldCheck, 
    CheckCircle2, 
    Clock, 
    XCircle, 
    ExternalLink, 
    Search,
    Filter,
    ArrowRight,
    Building2,
    Building
} from 'lucide-react';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function AdminVerificationManagementPage() {
    const { user, isChecking } = useRoleGuard(['ADMIN']);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

    useEffect(() => {
        if (isChecking) return;
        if (!user) {
            setLoading(false);
            return;
        }
        fetchRequests();
    }, [filter, isChecking, user?.id]);

    async function fetchRequests() {
        setLoading(true);
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .eq('role', 'ADVERTISER')
                .not('biz_verification_status', 'is', null);

            if (filter !== 'ALL') {
                query = query.eq('biz_verification_status', filter);
            }

            const { data, error } = await query.order('biz_verification_requested_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching verification requests:', error);
            toast.error('요청 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }

    const handleAction = async (userId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    biz_verification_status: status,
                    biz_rejection_reason: reason || null
                })
                .eq('id', userId);

            if (error) throw error;

            toast.success(status === 'APPROVED' ? '승인되었습니다.' : '반려되었습니다.');
            fetchRequests();

            // Notify user (Optional: you could add an entry to notifications table)
            await supabase.from('notifications').insert({
                user_id: userId,
                type: 'SYSTEM',
                title: status === 'APPROVED' ? '🏢 사업자 인증 승인 완료' : '⚠️ 사업자 인증 반려 안내',
                content: status === 'APPROVED' 
                    ? '사업자 인증이 완료되었습니다. 이제 캠페인을 등록하실 수 있습니다!' 
                    : `사업자 인증이 반려되었습니다. 사유: ${reason}`,
                link: '/dashboard/advertiser/verification'
            });

        } catch (error) {
            console.error('Error processing action:', error);
            toast.error('처리에 실패했습니다.');
        }
    };

    const filteredRequests = requests.filter(req => 
        req.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.biz_number?.includes(searchTerm) ||
        req.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminPageLayout containerClassName="max-w-[1400px]">
            <div className="p-8 overflow-y-auto bg-gray-50/50">
                <div>
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                                <ShieldCheck className="w-8 h-8 text-primary" />
                                사업자 인증 관리
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium">광고주 회원의 사업자 등록증 및 정보를 심사합니다.</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-2">
                            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
                                <Button
                                    key={f}
                                    variant={filter === f ? 'default' : 'outline'}
                                    onClick={() => setFilter(f)}
                                    className={`rounded-xl font-bold px-5 ${filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 border-gray-100 hover:bg-gray-50'}`}
                                >
                                    {f === 'PENDING' ? '대기중' : f === 'APPROVED' ? '승인됨' : f === 'REJECTED' ? '반려됨' : '전체'}
                                </Button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input 
                                placeholder="회사명, 번호, 닉네임 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse border border-gray-100" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRequests.map((req) => (
                                <Card key={req.id} className="border-none shadow-xl shadow-gray-200/40 rounded-[32px] overflow-hidden bg-white hover:shadow-2xl transition-all group">
                                    <div className={`h-2 ${
                                        req.biz_verification_status === 'APPROVED' ? 'bg-emerald-500' :
                                        req.biz_verification_status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'
                                    }`} />
                                    <CardHeader className="p-6 pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <Building2 size={24} />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg font-bold text-gray-900">{req.company_name || '미등록'}</CardTitle>
                                                    <p className="text-xs text-gray-400 font-medium">@{req.nickname || '익명'}</p>
                                                </div>
                                            </div>
                                            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                req.biz_verification_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                                req.biz_verification_status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                                {req.biz_verification_status}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-4 space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-400 font-medium">사업자 번호</span>
                                                <span className="font-bold text-gray-700">{req.biz_number || '미등록'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-400 font-medium">요청 일시</span>
                                                <span className="font-medium text-gray-600">
                                                    {req.biz_verification_requested_at ? new Date(req.biz_verification_requested_at).toLocaleDateString() : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group/img">
                                            {req.biz_certificate_url ? (
                                                <>
                                                    <img 
                                                        src={req.biz_certificate_url} 
                                                        alt="Cert" 
                                                        className="w-full h-full object-cover transition-transform group-hover/img:scale-105" 
                                                    />
                                                    <a 
                                                        href={req.biz_certificate_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                    >
                                                        <ExternalLink className="text-white w-6 h-6" />
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 italic text-xs">
                                                    증빙 서류 없음
                                                </div>
                                            )}
                                        </div>

                                        {req.biz_verification_status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <Button 
                                                    onClick={() => handleAction(req.id, 'APPROVED')}
                                                    className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100"
                                                >
                                                    승인하기
                                                </Button>
                                                <Button 
                                                    onClick={() => {
                                                        const reason = prompt('반려 사유를 입력하세요:');
                                                        if (reason) handleAction(req.id, 'REJECTED', reason);
                                                    }}
                                                    variant="outline"
                                                    className="flex-1 h-12 rounded-xl border-rose-100 text-rose-500 hover:bg-rose-50 font-bold"
                                                >
                                                    반려하기
                                                </Button>
                                            </div>
                                        )}

                                        {req.biz_verification_status === 'REJECTED' && req.biz_rejection_reason && (
                                            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                                                <p className="text-[10px] font-black text-rose-400 uppercase mb-1">반려 사유</p>
                                                <p className="text-xs text-rose-600 font-medium italic leading-relaxed">
                                                    {req.biz_rejection_reason}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {filteredRequests.length === 0 && !loading && (
                        <div className="text-center py-32 bg-white rounded-[32px] border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                                ✨
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">대기 중인 요청이 없습니다.</h3>
                            <p className="text-gray-500 font-medium">모든 사업자 인증이 성공적으로 처리되었습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminPageLayout>
    );
}
