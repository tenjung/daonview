import Link from 'next/link';
import PrivacyContent from '@/components/legal/PrivacyContent';

export default function PrivacyPage() {
    return (
        <div className="bg-background min-h-screen">
            <div className="container py-16">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-text-main mb-4">개인정보처리방침</h1>
                    <p className="text-text-secondary">DAONVIEW는 회원님의 개인정보를 소중히 다룹니다.</p>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl border border-border p-8 md:p-12 shadow-sm">
                    <PrivacyContent />
                </div>

                {/* Back Button */}
                <div className="mt-8 text-center">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-border rounded-xl text-text-secondary hover:border-primary hover:text-primary transition-colors"
                    >
                        ← 홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}
