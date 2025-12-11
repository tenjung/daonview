export default function FAQPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">자주묻는문의</h1>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-xl">
                        <h3 className="font-bold mb-2">Q. 자주 묻는 질문 예시 {i}</h3>
                        <p className="text-gray-500">A. 여기에 답변 내용이 들어갑니다.</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
