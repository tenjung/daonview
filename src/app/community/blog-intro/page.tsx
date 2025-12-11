import Link from "next/link";

export default function BlogIntroPage() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">내블로그 소개</h1>
                <Link href="/community/write?mode=notion" className="btn btn-primary py-2 text-sm">글쓰기</Link>
            </div>
            <div className="p-8 border border-gray-200 rounded-xl text-center text-gray-500">
                준비 중입니다.
            </div>
        </div>
    );
}
