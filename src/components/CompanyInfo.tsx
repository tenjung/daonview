import { COMPANY_INFO } from '@/constants/companyInfo';

interface CompanyInfoProps {
  variant?: 'full' | 'minimal' | 'footer';
  className?: string;
  showEmail?: boolean;
}

export default function CompanyInfo({ 
  variant = 'full', 
  className = '',
  showEmail = true 
}: CompanyInfoProps) {
  if (variant === 'footer') {
    return (
      <div className={`grid grid-cols-2 gap-x-16 text-xs text-text-secondary ${className}`}>
        {/* 좌측: 상호명, 대표자명, 주소 */}
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <span className="font-medium text-text-main min-w-[70px]">상호명</span>
            <span><strong>{COMPANY_INFO.name}</strong></span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-text-main min-w-[70px]">대표자명</span>
            <span>{COMPANY_INFO.ceo}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-text-main min-w-[70px]">주소</span>
            <span>{COMPANY_INFO.address}</span>
          </div>
        </div>

        {/* 우측: 사업자등록번호, 전화번호 */}
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <span className="font-medium text-text-main min-w-[110px]">사업자등록번호</span>
            <span>{COMPANY_INFO.businessNumber}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-text-main min-w-[110px]">전화번호</span>
            <span>{COMPANY_INFO.phone}</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`space-y-1 text-sm text-text-secondary ${className}`}>
        <p><strong>회사명:</strong> {COMPANY_INFO.name}</p>
        <p><strong>사업자등록번호:</strong> {COMPANY_INFO.businessNumber}</p>
        <p><strong>대표자:</strong> {COMPANY_INFO.ceo}</p>
        <p><strong>전화:</strong> {COMPANY_INFO.phone}</p>
        {showEmail && <p><strong>이메일:</strong> {COMPANY_INFO.email}</p>}
        <p><strong>주소:</strong> {COMPANY_INFO.address}</p>
      </div>
    );
  }

  // variant === 'full'
  return (
    <div className={`space-y-1 text-sm text-text-secondary ${className}`}>
      <p><strong>회사명:</strong> {COMPANY_INFO.name}</p>
      <p><strong>사업자등록번호:</strong> {COMPANY_INFO.businessNumber}</p>
      <p><strong>대표자:</strong> {COMPANY_INFO.ceo}</p>
      <p><strong>전화:</strong> {COMPANY_INFO.phone}</p>
      {showEmail && <p><strong>이메일:</strong> {COMPANY_INFO.email}</p>}
      <p><strong>주소:</strong> {COMPANY_INFO.address}</p>
    </div>
  );
}
