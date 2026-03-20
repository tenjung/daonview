import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { MessageCircle, Construction } from 'lucide-react';

export default async function AdminKakaoNotificationsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    return (
        <AdminPageLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">카카오톡 전송 관리</h1>
                <p className="text-gray-600">카카오 알림톡 템플릿을 관리할 수 있습니다</p>
            </div>
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-12 max-w-md text-center border border-yellow-100">
                    <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Construction className="text-yellow-600" size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">준비 중입니다</h3>
                    <p className="text-gray-600 mb-6">
                        카카오 알림톡 템플릿 관리 기능은 현재 개발 중입니다.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                            <MessageCircle className="text-yellow-600" size={20} />
                            <span className="font-medium">현재 사용 중인 템플릿</span>
                        </div>
                        <ul className="mt-3 space-y-2 text-left text-sm text-gray-600">
                            <li>• 인플루언서 선정 알림</li>
                            <li>• 리뷰 제출 완료 알림</li>
                            <li>• 리뷰 승인 알림</li>
                            <li>• 배송 시작 알림</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AdminPageLayout>
    );
}
