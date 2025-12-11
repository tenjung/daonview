import Link from "next/link";

export default function AcademyPage() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">아카데미</h1>
                <Link href="/community/write?mode=notion" className="btn btn-primary py-2 text-sm">글쓰기</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/community/academy/advertiser" className="p-6 border border-gray-200 rounded-xl hover:border-primary transition-colors">
                    <h3 className="text-lg font-bold mb-2">광고주 칼럼</h3>
                    <p className="text-gray-500">광고주를 위한 마케팅 인사이트</p>
                </Link>
                <Link href="/community/academy/influencer" className="p-6 border border-gray-200 rounded-xl hover:border-primary transition-colors">
                    <h3 className="text-lg font-bold mb-2">인플루언서 칼럼</h3>
                    <p className="text-gray-500">인플루언서 성장을 위한 꿀팁</p>
                </Link>
            </div>
        </div>
    );
}
