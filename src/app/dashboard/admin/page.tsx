'use client';
import Link from 'next/link';

export default function AdminDashboard() {
    return (
        <div className="flex min-h-screen bg-background">
            <aside className="w-[260px] bg-white border-r border-border p-8 flex flex-col shrink-0">
                <div className="mb-8 pb-6 border-b border-border">
                    <div className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-1">SUPER ADMIN</div>
                    <div className="text-lg font-bold text-text-main">관리자</div>
                </div>
                <nav className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer bg-rose-50 text-primary">대시보드</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">회원 관리</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">캠페인 승인/관리</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">정산 관리</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">시스템 설정</div>
                </nav>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-text-main">관리자 통합 대시보드</h1>
                    <Link href="/dashboard/campaign/new" className="btn btn-primary text-sm">+ 캠페인 강제 등록</Link>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">총 회원수 (기업/인플)</div>
                        <div className="text-3xl font-bold text-primary">1,250 / 8,400</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">오늘 신규 캠페인</div>
                        <div className="text-3xl font-bold text-primary">32</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">대기중인 승인 요청</div>
                        <div className="text-3xl font-bold text-primary">5</div>
                    </div>
                </div>

                {/* Admin only controls - Just for view */}
                <div className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-200">
                    <h3 className="text-lg font-bold text-indigo-800 mb-4">빠른 이동 (개발용 임시 링크)</h3>
                    <div className="flex gap-4">
                        <Link href="/dashboard/advertiser" className="btn btn-outline bg-white border-indigo-200 text-indigo-600 hover:bg-white hover:text-indigo-800">광고주 대시보드 보기</Link>
                        <Link href="/dashboard/influencer" className="btn btn-outline bg-white border-indigo-200 text-indigo-600 hover:bg-white hover:text-indigo-800">인플루언서 대시보드 보기</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
