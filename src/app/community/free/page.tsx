"use client";

import Link from "next/link";
import { Search } from "lucide-react";

export default function FreeBoardPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">자유게시판</h1>
                    <p className="text-gray-500 mt-1">자유롭게 이야기를 나누는 공간입니다.</p>
                </div>
                <Link
                    href="/community/write"
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
                >
                    글쓰기
                </Link>
            </div>

            {/* 검색 및 필터 */}
            <div className="flex gap-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="검색어를 입력하세요"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>
            </div>

            {/* 게시글 목록 (예시) */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 w-16 text-center">번호</th>
                                <th className="px-6 py-3">제목</th>
                                <th className="px-6 py-3 w-32">작성자</th>
                                <th className="px-6 py-3 w-32 text-center">작성일</th>
                                <th className="px-6 py-3 w-20 text-center">조회</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {/* 게시글이 없는 경우 */}
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    등록된 게시글이 없습니다.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
