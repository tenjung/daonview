"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TiptapEditor from "@/components/editor/TiptapEditor";

export default function WritePage() {
    return (
        <div className="max-w-5xl mx-auto container py-12">
            <div className="mb-8">
                <Link
                    href="/community"
                    className="inline-flex items-center text-gray-500 hover:text-primary mb-4 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-1" />
                    돌아가기
                </Link>
                <div className="flex justify-between items-end">
                    <h1 className="text-3xl font-bold text-text-main">
                        글쓰기
                    </h1>
                </div>
            </div>

            <div className="mb-8 space-y-6">
                <input
                    type="text"
                    placeholder="제목을 입력하세요"
                    className="w-full text-4xl font-bold border-none py-4 px-0 focus:outline-none focus:ring-0 bg-transparent placeholder-gray-200 transition-colors text-gray-800"
                />

                <TiptapEditor />
            </div>

            <div className="flex justify-end gap-3 sticky bottom-8">
                <Link href="/community">
                    <button className="btn btn-outline bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm">취소</button>
                </Link>
                <button className="btn btn-primary shadow-lg hover:shadow-indigo-500/30">등록하기</button>
            </div>
        </div>
    );
}
