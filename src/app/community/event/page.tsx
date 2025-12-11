import Link from "next/link";

export default function EventPage() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">이벤트</h1>
                <Link href="/community/write" className="btn btn-primary py-2 text-sm">글쓰기</Link>
            </div>
            <div className="p-8 border border-gray-200 rounded-xl text-center text-gray-500">
                진행 중인 이벤트가 없습니다.
            </div>
        </div>
    );
}
