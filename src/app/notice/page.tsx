export default function NoticePage() {
    return (
        <div className="container py-16 max-w-4xl">
            <h1 className="text-3xl font-extrabold text-text-main mb-8 border-b-2 border-black pb-4">공지사항</h1>

            <div className="border-t border-gray-200">
                {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="flex flex-col md:flex-row md:items-center py-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer px-2">
                        <div className="text-gray-400 text-sm w-24 mb-1 md:mb-0">2024.12.0{item}</div>
                        <div className="flex-1 font-medium text-gray-800">
                            <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold mr-2">공지</span>
                            다온뷰 서비스 이용약관 개정 안내
                        </div>
                        <div className="text-gray-400 text-sm w-20 text-right hidden md:block">다온뷰</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
