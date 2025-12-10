import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-surface border-t border-border py-16 mt-16">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-8 w-[90%] max-w-[1200px] mx-auto">
                <div>
                    <div className="font-bold text-xl text-text-main">DAONVIEW</div>
                    <p className="text-text-secondary text-sm mt-4 max-w-[300px] leading-relaxed">
                        프리미엄 체험단 플랫폼 다온뷰에서<br />
                        특별한 경험을 시작해보세요.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <h3 className="font-semibold text-text-main mb-2">서비스</h3>
                    <Link href="/campaigns" className="text-text-secondary text-sm hover:text-primary transition-colors">캠페인 찾기</Link>
                    <Link href="/reviews" className="text-text-secondary text-sm hover:text-primary transition-colors">베스트 리뷰</Link>
                    <Link href="/events" className="text-text-secondary text-sm hover:text-primary transition-colors">이벤트</Link>
                </div>

                <div className="flex flex-col gap-3">
                    <h3 className="font-semibold text-text-main mb-2">고객센터</h3>
                    <Link href="/notice" className="text-text-secondary text-sm hover:text-primary transition-colors">공지사항</Link>
                    <Link href="/faq" className="text-text-secondary text-sm hover:text-primary transition-colors">FAQ</Link>
                    <Link href="/contact" className="text-text-secondary text-sm hover:text-primary transition-colors">1:1 문의</Link>
                </div>

                <div className="flex flex-col gap-3">
                    <h3 className="font-semibold text-text-main mb-2">기업</h3>
                    <Link href="/about" className="text-text-secondary text-sm hover:text-primary transition-colors">회사소개</Link>
                    <Link href="/terms" className="text-text-secondary text-sm hover:text-primary transition-colors">이용약관</Link>
                    <Link href="/privacy" className="text-text-secondary text-sm hover:text-primary transition-colors">개인정보처리방침</Link>
                </div>
            </div>
            <div className="text-center mt-16 pt-8 border-t border-border text-text-secondary text-sm">
                © 2024 DAONVIEW. All rights reserved.
            </div>
        </footer>
    );
}
