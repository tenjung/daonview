import Link from "next/link";
import { Wand2, LineChart, PenTool } from "lucide-react";

export default function AIServicePage() {
    return (
        <div className="container py-16">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold mb-4 flex items-center justify-center gap-3">
                    <Wand2 className="text-primary" size={40} />
                    <span className="text-text-main">AI 부가서비스</span>
                </h1>
                <p className="text-xl text-text-secondary">AI 기술을 활용하여 인플루언서 활동을 더욱 스마트하게 지원합니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Link href="/ai-service/analysis" className="group block h-full">
                    <div className="bg-white border border-border rounded-2xl p-8 h-full hover:shadow-lg hover:border-primary transition-all duration-300">
                        <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <LineChart className="text-primary" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-text-main group-hover:text-primary transition-colors">내 포스팅 분석</h2>
                        <p className="text-text-secondary">
                            작성한 포스팅의 품질과 성과를 AI가 정밀하게 분석해드립니다. <br />
                            누락 여부, 키워드 적합성, 이미지 품질 등을 확인해보세요.
                        </p>
                    </div>
                </Link>

                <Link href="/ai-service/writing-assistant" className="group block h-full">
                    <div className="bg-white border border-border rounded-2xl p-8 h-full hover:shadow-lg hover:border-primary transition-all duration-300">
                        <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <PenTool className="text-primary" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-text-main group-hover:text-primary transition-colors">AI 키워드 글작성 도우미</h2>
                        <p className="text-text-secondary">
                            키워드만 입력하면 AI가 최적화된 글 구조와 내용을 제안합니다. <br />
                            빠르고 효과적인 포스팅 작성을 경험해보세요.
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
