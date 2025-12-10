import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="h-[70px] bg-surface border-b border-border sticky top-0 z-[100] flex items-center">
      <div className="flex items-center justify-between w-[90%] max-w-[1200px] mx-auto">
        <Link href="/" className="text-2xl font-bold text-primary tracking-tighter">
          DAONVIEW
        </Link>

        <div className="flex gap-8">
          <Link href="/campaigns" className="font-medium text-text-secondary hover:text-primary transition-colors">캠페인</Link>
          <Link href="/reviews" className="font-medium text-text-secondary hover:text-primary transition-colors">리뷰</Link>
          <Link href="/brand" className="font-medium text-text-secondary hover:text-primary transition-colors">브랜드존</Link>
          <Link href="/community" className="font-medium text-text-secondary hover:text-primary transition-colors">커뮤니티</Link>
        </div>

        <div className="flex gap-4">
          <Link href="/login" className="btn btn-outline py-2 text-sm">
            로그인
          </Link>
          <Link href="/signup" className="btn btn-primary py-2 text-sm">
            회원가입
          </Link>
        </div>
      </div>
    </nav>
  );
}
