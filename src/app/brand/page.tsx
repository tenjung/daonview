export default function BrandZonePage() {
    return (
        <div className="container py-16">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-text-main mb-4">브랜드 존</h1>
                <p className="text-text-secondary text-lg">다온뷰와 함께하는 프리미엄 제휴 브랜드를 소개합니다.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                    <div key={item} className="aspect-square border border-border rounded-2xl flex flex-col items-center justify-center p-6 hover:border-primary cursor-pointer transition-colors bg-white">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mb-4"></div>
                        <h3 className="font-bold text-gray-800">Brand {item}</h3>
                        <p className="text-xs text-gray-400 mt-1">뷰티/화장품</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
