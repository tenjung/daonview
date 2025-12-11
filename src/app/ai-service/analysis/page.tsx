export default function AnalysisPage() {
    return (
        <div className="container py-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">내 포스팅 분석</h1>
                <div className="bg-white p-12 rounded-xl border border-border text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-xl font-bold mb-2">포스팅 URL을 입력해주세요</h2>
                    <p className="text-gray-500 mb-8">AI가 포스팅을 정밀하게 분석하여 결과를 알려드립니다.</p>

                    <div className="flex gap-2 max-w-lg mx-auto mb-8">
                        <input type="text" placeholder="https://blog.naver.com/..." className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-primary" />
                        <button className="btn btn-primary whitespace-nowrap">분석하기</button>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-left">
                        <p className="mb-1 font-bold">💡 분석 항목</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>검색 노출 가능성 및 누락 여부</li>
                            <li>키워드 반복 횟수 및 적절성</li>
                            <li>이미지 및 글자수 분석</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
