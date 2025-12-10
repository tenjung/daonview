'use client';
import Link from 'next/link';

export default function InfluencerDashboard() {
    return (
        <div className="flex min-h-screen bg-background">
            <aside className="w-[260px] bg-white border-r border-border p-8 flex flex-col shrink-0">
                <div className="mb-8 pb-6 border-b border-border">
                    <div className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-1">INFLUENCER</div>
                    <div className="text-lg font-bold text-text-main">김다온 님</div>
                </div>
                <nav className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer bg-rose-50 text-primary">대시보드</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">나의 캠페인</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">관심 캠페인</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">계정 설정</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">1:1 문의</div>
                </nav>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-text-main">나의 활동</h1>
                    <Link href="/campaigns" className="btn btn-primary text-sm px-4 py-2">캠페인 찾아보기</Link>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">신청한 캠페인</div>
                        <div className="text-3xl font-bold text-primary">8</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">선정된 캠페인</div>
                        <div className="text-3xl font-bold text-primary">2</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">작성해야 할 리뷰</div>
                        <div className="text-3xl font-bold text-primary">1</div>
                    </div>
                </div>

                <div className="bg-white border border-border rounded-xl overflow-hidden mt-8 shadow-sm">
                    <div className="p-6 border-b border-border">
                        <h3 className="font-bold text-lg">최근 신청 내역</h3>
                    </div>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">캠페인명</th>
                                <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">플랫폼</th>
                                <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">신청일</th>
                                <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">상태</th>
                                <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">비고</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-4 text-left border-b border-border text-sm">성수동 핫플 카페 디저트</td>
                                <td className="p-4 text-left border-b border-border text-sm">BLOG</td>
                                <td className="p-4 text-left border-b border-border text-sm">2024.12.09</td>
                                <td className="p-4 text-left border-b border-border text-sm"><span className="inline-block px-2 py-1 rounded text-xs font-bold bg-orange-50 text-orange-600">심사중</span></td>
                                <td className="p-4 text-left border-b border-border text-sm">-</td>
                            </tr>
                            <tr>
                                <td className="p-4 text-left border-b border-border text-sm">무선 노이즈캔슬링 헤드폰</td>
                                <td className="p-4 text-left border-b border-border text-sm">YOUTUBE</td>
                                <td className="p-4 text-left border-b border-border text-sm">2024.12.05</td>
                                <td className="p-4 text-left border-b border-border text-sm"><span className="inline-block px-2 py-1 rounded text-xs font-bold bg-green-50 text-green-600">선정됨</span></td>
                                <td className="p-4 text-left border-b border-border text-sm">가이드 확인 필요</td>
                            </tr>
                            <tr>
                                <td className="p-4 text-left border-b border-border text-sm">데일리 비타민 C</td>
                                <td className="p-4 text-left border-b border-border text-sm">INSTAGRAM</td>
                                <td className="p-4 text-left border-b border-border text-sm">2024.12.01</td>
                                <td className="p-4 text-left border-b border-border text-sm"><span className="inline-block px-2 py-1 rounded text-xs font-bold bg-red-50 text-red-600">미선정</span></td>
                                <td className="p-4 text-left border-b border-border text-sm">아쉽게도 선정되지 않았습니다.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
