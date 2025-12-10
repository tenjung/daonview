export default function EventsPage() {
    return (
        <div className="container py-16">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-text-main mb-4">이벤트</h1>
                <p className="text-text-secondary text-lg">다온뷰 회원님들을 위한 특별한 혜택</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2].map((item) => (
                    <div key={item} className="group border border-border rounded-2xl overflow-hidden cursor-pointer bg-white">
                        <div className="aspect-video bg-gray-200 relative">
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-xl">Event Banner {item}</div>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-2 mb-2">
                                <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs font-bold">진행중</span>
                                <span className="text-gray-400 text-xs">2024.12.01 ~ 12.31</span>
                            </div>
                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">신규 회원가입 웰컴 포인트 지급 이벤트!</h3>
                        </div>
                    </div>
                ))}
                <div className="group border border-border rounded-2xl overflow-hidden cursor-pointer opacity-60 bg-white">
                    <div className="aspect-video bg-gray-200 relative">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-bold text-xl bg-gray-300">종료된 이벤트</div>
                    </div>
                    <div className="p-6">
                        <div className="flex gap-2 mb-2">
                            <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">종료</span>
                            <span className="text-gray-400 text-xs">2024.11.01 ~ 11.30</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-500">11월 리뷰왕 선발대회</h3>
                    </div>
                </div>
            </div>
        </div>
    );
}
