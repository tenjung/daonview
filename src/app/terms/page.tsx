import Link from 'next/link';
import TermsContent from '@/components/legal/TermsContent';

export default function TermsPage() {
    return (
        <div className="bg-background min-h-screen">
            <div className="container py-16">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-text-main mb-4">운영정책</h1>
                    <p className="text-text-secondary">DAONVIEW 서비스 이용약관 및 운영정책입니다.</p>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl border border-border p-8 md:p-12 shadow-sm">
                    <TermsContent />
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
