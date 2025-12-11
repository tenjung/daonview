import Link from "next/link";

export default function NoticePage() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">공지사항</h1>
                <Link href="/community/write" className="btn btn-primary py-2 text-sm">글쓰기</Link>
            </div>
            <div className="p-8 border border-gray-200 rounded-xl text-center text-gray-500">
                등록된 공지사항이 없습니다.
            </div>
        </div>
    );
}
