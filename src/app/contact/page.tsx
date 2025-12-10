export default function ContactPage() {
    return (
        <div className="container py-16 max-w-2xl">
            <h1 className="text-3xl font-extrabold text-text-main mb-8 text-center">1:1 문의하기</h1>

            <form className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">문의 유형</label>
                    <select className="w-full px-4 py-3 rounded-lg border border-gray-300">
                        <option>체험단 관련 문의</option>
                        <option>포인트/정산 문의</option>
                        <option>사이트 이용 오류</option>
                        <option>제휴/광고 문의</option>
                    </select>
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300" placeholder="제목을 입력해주세요" />
                </div>
                <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-2">내용</label>
                    <textarea className="w-full px-4 py-3 rounded-lg border border-gray-300 h-40 resize-none" placeholder="문의하실 내용을 자세히 적어주세요"></textarea>
                </div>
                <button className="w-full btn btn-primary py-4 text-lg">문의 접수하기</button>
            </form>
        </div>
    );
}
