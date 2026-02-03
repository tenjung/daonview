export interface SidebarLink {
    href: string;
    label: string;
    active?: boolean;
    tag?: string;
    subLinks?: SidebarLink[];
}

export const INFLUENCER_LINKS: SidebarLink[] = [
    { href: '/dashboard/influencer', label: '대시보드' },
    { href: '/dashboard/influencer/campaigns', label: '나의 캠페인' },
    { href: '/dashboard/influencer/landing-pages', label: '나의 랜딩페이지', tag: 'NEW' },
    { href: '/dashboard/influencer/favorites', label: '관심 캠페인' },
    {
        href: '/profile/edit',
        label: '계정 설정',
        subLinks: [
            { href: '/profile/edit?tab=basic', label: '기본 정보' },
            { href: '/profile/edit?tab=payout', label: '배송/정산 관리' },
            { href: '/profile/edit?tab=interests', label: '관심사 설정' }
        ]
    },
    { href: '/contact', label: '1:1 문의' }
];

export const ADVERTISER_LINKS: SidebarLink[] = [
    { href: '/dashboard/advertiser', label: '대시보드' },
    { href: '/dashboard/advertiser/campaigns', label: '캠페인 관리' },
    { href: '/dashboard/advertiser/landing-pages', label: '나의 랜딩페이지', tag: 'NEW' },
    { href: '/dashboard/advertiser/applicants', label: '신청자 목록' },
    { href: '/dashboard/advertiser/reviews', label: '리뷰 작업 현황' },
    { href: '/dashboard/advertiser/verification', label: '사업자 인증' },
    { href: '/dashboard/advertiser/brands', label: '브랜드 관리' },
    {
        href: '/profile/edit',
        label: '계정 설정',
        subLinks: [
            { href: '/profile/edit?tab=basic', label: '기본 정보' }
        ]
    },
    { href: '/contact', label: '1:1 문의' }
];

export const ADMIN_LINKS: SidebarLink[] = [
    { href: '/dashboard/admin', label: '인사이트' },
    { href: '/dashboard/admin/campaigns', label: '캠페인 관리' },
    { href: '/dashboard/admin/users', label: '사용자 관리' },
    { href: '/dashboard/admin/reviews', label: '리뷰 검수' },
    { href: '/dashboard/admin/banners', label: '배너 관리' },
    { href: '/dashboard/admin/community', label: '커뮤니티 관리' },
    { href: '/dashboard/admin/stats', label: '통계' },
    { href: '/contact', label: '고객센터 관리' }
];
