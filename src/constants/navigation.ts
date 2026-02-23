export interface SidebarLink {
    href: string;
    label: string;
    icon?: string; // Lucide icon name
    active?: boolean;
    tag?: string;
    subLinks?: SidebarLink[];
}

export const INFLUENCER_LINKS: SidebarLink[] = [
    { href: '/dashboard/influencer', label: '대시보드', icon: 'LayoutDashboard' },
    { href: '/dashboard/influencer/campaigns', label: '나의 캠페인', icon: 'Megaphone' },
    { href: '/dashboard/influencer/landing-pages', label: '나의 랜딩페이지', icon: 'Globe', tag: 'NEW' },
    { href: '/dashboard/influencer/favorites', label: '관심 캠페인', icon: 'Heart' },
    {
        href: '/profile/edit',
        label: '계정 설정',
        icon: 'UserCog',
        subLinks: [
            { href: '/profile/edit?tab=basic', label: '기본 정보', icon: 'User' },
            { href: '/profile/edit?tab=payout', label: '배송/정산 관리', icon: 'Truck' },
            { href: '/profile/edit?tab=interests', label: '관심사 설정', icon: 'Tags' }
        ]
    },
    { href: '/contact', label: '1:1 문의', icon: 'MessageSquare' }
];

export const ADVERTISER_LINKS: SidebarLink[] = [
    { href: '/dashboard/advertiser', label: '대시보드', icon: 'LayoutDashboard' },
    { href: '/dashboard/advertiser/campaigns', label: '캠페인 관리', icon: 'Megaphone' },
    { href: '/dashboard/advertiser/applicants', label: '신청자 목록', icon: 'Users' },
    { href: '/dashboard/advertiser/reviews', label: '리뷰 작업 현황', icon: 'ClipboardCheck' },
    { href: '/dashboard/advertiser/verification', label: '사업자 인증', icon: 'ShieldCheck' },
    { href: '/dashboard/advertiser/brands', label: '브랜드 관리', icon: 'Store' },
    {
        href: '/dashboard/advertiser/billing',
        label: '결제 관리',
        icon: 'CreditCard',
        subLinks: [
            { href: '/dashboard/advertiser/billing', label: '이용요금 안내', icon: 'Receipt' }
        ]
    },
    {
        href: '/profile/edit',
        label: '계정 설정',
        icon: 'UserCog',
        subLinks: [
            { href: '/profile/edit?tab=basic', label: '기본 정보', icon: 'User' }
        ]
    },
    { href: '/contact', label: '1:1 문의', icon: 'MessageSquare' }
];

export const ADMIN_LINKS: SidebarLink[] = [
    { href: '/dashboard/admin', label: '인사이트', icon: 'BarChart3' },
    { href: '/dashboard/admin/campaigns', label: '캠페인 관리', icon: 'Megaphone' },
    { href: '/dashboard/admin/users', label: '사용자 관리', icon: 'Users' },
    { href: '/dashboard/admin/reviews', label: '리뷰 검수', icon: 'ClipboardCheck' },
    { href: '/dashboard/admin/banners', label: '배너 관리', icon: 'Image' },
    { href: '/dashboard/admin/community', label: '커뮤니티 관리', icon: 'MessageSquare' },
    { href: '/dashboard/admin/stats', label: '통계', icon: 'PieChart' },
    { href: '/contact', label: '고객센터 관리', icon: 'Headset' }
];
