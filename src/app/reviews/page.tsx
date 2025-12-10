export default function ReviewsPage() {
    return (
        <div className="container py-16">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-text-main mb-4">베스트 리뷰</h1>
                <p className="text-text-secondary text-lg">다온뷰 인플루언서들의 생생한 체험 후기를 만나보세요.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow bg-white">
                        <div className="h-48 bg-gray-200 relative">
                            <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-primary">BEST</div>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                <div className="text-sm font-bold text-gray-700">인플루언서 {item}</div>
                            </div>
                            <h3 className="font-bold text-lg mb-2 line-clamp-2">강남역 분위기 좋은 오마카세, 데이트 코스로 완벽해요! 🍣</h3>
                            <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                                오랜만에 남자친구랑 강남역 데이트를 다녀왔어요. 분위기도 너무 좋고 쉐프님도 친절하셔서...
                            </p>
                            <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-4">
                                <span>BLOG</span>
                                <span>2024.12.10</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
