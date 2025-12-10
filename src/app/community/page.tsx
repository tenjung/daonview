export default function CommunityPage() {
    return (
        <div className="container py-16">
            <div className="flex justify-between items-end mb-10 border-b border-gray-200 pb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-text-main mb-2">커뮤니티</h1>
                    <p className="text-text-secondary">인플루언서들의 자유로운 소통 공간입니다.</p>
                </div>
                <button className="btn btn-primary">글쓰기</button>
            </div>

            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="flex gap-4 p-6 border border-border rounded-xl hover:bg-gray-50 transition-colors cursor-pointer bg-white">
                        <div className="flex-1">
                            <div className="flex gap-2 mb-2">
                                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded">자유</span>
                                <h3 className="font-bold text-lg text-gray-800">이번주 블로그 지수 관련해서 질문있어요!</h3>
                            </div>
                            <p className="text-gray-500 text-sm line-clamp-1">요즘 방문자 수가 급격히 떨어지는데 저만 그런가요? 로직이 바뀐건지 ㅠㅠ 고수님들 답변 부탁드려요...</p>
                            <div className="flex gap-3 mt-3 text-xs text-gray-400">
                                <span>닉네임{item}</span>
                                <span>조회 128</span>
                                <span>댓글 5</span>
                                <span>1시간 전</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
