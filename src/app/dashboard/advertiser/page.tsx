'use client';
import Link from 'next/link';

export default function AdvertiserDashboard() {
    return (
        <div className="flex min-h-screen bg-background">
            <aside className="w-[260px] bg-white border-r border-border p-8 flex flex-col shrink-0">
                <div className="mb-8 pb-6 border-b border-border">
                    <div className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-1">ADVERTISER</div>
                    <div className="text-lg font-bold text-text-main">(주)다온컴퍼니</div>
                </div>
                <nav className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer bg-rose-50 text-primary">대시보드</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">캠페인 관리</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">신청자 목록</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">리뷰어 선정</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">결제/포인트</div>
                </nav>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-text-main">캠페인 관리</h1>
                    <Link href="/dashboard/campaign/new" className="btn btn-primary">+ 새 캠페인 등록</Link>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">진행중인 캠페인</div>
                        <div className="text-3xl font-bold text-primary">3</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">신규 신청자</div>
                        <div className="text-3xl font-bold text-primary">12</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">등록 예정 리뷰</div>
                        <div className="text-3xl font-bold text-primary">5</div>
                    </div>
                </div>

                <div className="bg-white border border-border rounded-xl overflow-hidden mt-8 shadow-sm">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h3 className="font-bold text-lg">최근 캠페인 현황</h3>
                        <Link href="#" className="text-xs px-3 py-1.5 border border-border rounded text-gray-500 hover:text-primary">모두 보기</Link>
                    </div>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">캠페인명</th>
                                <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">플랫폼</th>
                                <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">모집기간</th>
                                <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">신청자</th>
                                <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">상태</th>
                                <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-4 text-left border-b border-border text-sm">프리미엄 오마카세 2인권</td>
                                <td className="p-4 text-left border-b border-border text-sm">BLOG</td>
                                <td className="p-4 text-left border-b border-border text-sm">2024.12.01 ~ 12.15</td>
                                <td className="p-4 text-left border-b border-border text-sm">15/20</td>
                                <td className="p-4 text-left border-b border-border text-sm"><span className="inline-block px-2 py-1 rounded text-xs font-bold bg-green-50 text-green-600">진행중</span></td>
                                <td className="p-4 text-left border-b border-border text-sm"><button className="text-xs px-2 py-1 border border-border rounded hover:bg-gray-50">관리</button></td>
                            </tr>
                            <tr>
                                <td className="p-4 text-left border-b border-border text-sm">신상 수분크림 체험단</td>
                                <td className="p-4 text-left border-b border-border text-sm">INSTAGRAM</td>
                                <td className="p-4 text-left border-b border-border text-sm">2024.12.10 ~ 12.20</td>
                                <td className="p-4 text-left border-b border-border text-sm">45/50</td>
                                <td className="p-4 text-left border-b border-border text-sm"><span className="inline-block px-2 py-1 rounded text-xs font-bold bg-green-50 text-green-600">진행중</span></td>
                                <td className="p-4 text-left border-b border-border text-sm"><button className="text-xs px-2 py-1 border border-border rounded hover:bg-gray-50">관리</button></td>
                            </tr>
                            <tr>
                                <td className="p-4 text-left border-b border-border text-sm">겨울철 필수템 가습기</td>
                                <td className="p-4 text-left border-b border-border text-sm">YOUTUBE</td>
                                <td className="p-4 text-left border-b border-border text-sm">2024.11.20 ~ 11.30</td>
                                <td className="p-4 text-left border-b border-border text-sm">30/10</td>
                                <td className="p-4 text-left border-b border-border text-sm"><span className="inline-block px-2 py-1 rounded text-xs font-bold bg-orange-50 text-orange-600">마감</span></td>
                                <td className="p-4 text-left border-b border-border text-sm"><button className="text-xs px-2 py-1 border border-border rounded hover:bg-gray-50">결과</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
