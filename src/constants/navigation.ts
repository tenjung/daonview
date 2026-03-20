export interface SidebarLink {
    href: string;
    label: string;
    icon?: string; // Lucide icon name
    active?: boolean;
    tag?: string;
    subLinks?: SidebarLink[];
    exact?: boolean;
    matchPaths?: string[];
    badgeKey?: 'campaignTotal' | 'reviewPending';
    collapsible?: boolean;
}

const PROFILE_BASIC_LINK: SidebarLink = {
    href: '/profile/edit?tab=basic',
    label: '기본 정보',
    icon: 'User'
};

export const CONTACT_LINKS: SidebarLink[] = [
    { href: '/contact', label: '1:1 문의', icon: 'MessageSquare' },
    { href: '/contact/my', label: '나의 문의 확인', icon: 'FileText' }
];

function createDashboardContactMenu(basePath: '/dashboard/advertiser' | '/dashboard/influencer'): SidebarLink {
    return {
        href: `${basePath}/contact`,
        label: '문의 관리',
        icon: 'MessageSquare',
        matchPaths: [`${basePath}/contact`, `${basePath}/contact/my`],
        subLinks: [
            { href: `${basePath}/contact`, label: '1:1 문의', icon: 'MessageSquare' },
            { href: `${basePath}/contact/my`, label: '나의 문의 확인', icon: 'FileText' }
        ]
    };
}

const COMMON_PROFILE_LINK: SidebarLink = {
    href: '/profile/edit',
    label: '계정 설정',
    icon: 'UserCog',
    matchPaths: ['/profile/edit', '/dashboard/influencer/settings']
};

export const INFLUENCER_MENU_FRAGMENTS: {
    profile: SidebarLink;
    support: SidebarLink[];
} = {
    profile: {
        ...COMMON_PROFILE_LINK,
        subLinks: [
            PROFILE_BASIC_LINK,
            { href: '/profile/edit?tab=payout', label: '배송/정산 관리', icon: 'Truck' },
            { href: '/profile/edit?tab=interests', label: '관심사 설정', icon: 'Tags' }
        ]
    },
    support: [createDashboardContactMenu('/dashboard/influencer')]
};

export const ADVERTISER_MENU_FRAGMENTS: {
    profile: SidebarLink;
    support: SidebarLink[];
} = {
    profile: {
        ...COMMON_PROFILE_LINK,
        subLinks: [PROFILE_BASIC_LINK]
    },
    support: [createDashboardContactMenu('/dashboard/advertiser')]
};

export const INFLUENCER_NAV: SidebarLink[] = [
    { href: '/dashboard/influencer', label: '대시보드', icon: 'LayoutDashboard' },
    { href: '/dashboard/influencer/campaigns', label: '나의 캠페인', icon: 'Megaphone' },
    { href: '/dashboard/influencer/reviews', label: '나의 리뷰', icon: 'ClipboardCheck', badgeKey: 'reviewPending' },
    { href: '/dashboard/influencer/landing-pages', label: '나의 랜딩페이지', icon: 'Globe' },
    { href: '/dashboard/influencer/favorites', label: '관심 캠페인', icon: 'Heart' },
    INFLUENCER_MENU_FRAGMENTS.profile,
    ...INFLUENCER_MENU_FRAGMENTS.support
];

export const ADVERTISER_NAV: SidebarLink[] = [
    { href: '/dashboard/advertiser', label: '대시보드', icon: 'LayoutDashboard' },
    {
        href: '/dashboard/advertiser/campaigns',
        label: '캠페인 관리',
        icon: 'Megaphone',
        matchPaths: [
            '/dashboard/advertiser/campaigns',
            '/dashboard/advertiser/applicants',
            '/dashboard/advertiser/reviews',
            '/dashboard/campaign/new',
            '/dashboard/campaign/drafts'
        ],
        subLinks: [
            { href: '/dashboard/advertiser/campaigns', label: '캠페인 목록', icon: 'Megaphone' },
            { href: '/dashboard/advertiser/reviews', label: '리뷰 현황', icon: 'ClipboardCheck' }
        ]
    },
    { href: '/dashboard/advertiser/verification', label: '사업자 인증', icon: 'ShieldCheck' },
    { href: '/dashboard/advertiser/brands', label: '브랜드 관리', icon: 'Store' },
    { href: '/dashboard/advertiser/billing', label: '결제 관리', icon: 'CreditCard', exact: true },
    { href: '/dashboard/advertiser/pricing', label: '이용요금 안내', icon: 'Receipt', tag: 'HOT', matchPaths: ['/dashboard/advertiser/pricing', '/dashboard/advertiser/billing/unlimited'] },
    ADVERTISER_MENU_FRAGMENTS.profile,
    ...ADVERTISER_MENU_FRAGMENTS.support
];

export const ADMIN_NAV: SidebarLink[] = [
    { href: '/dashboard/admin', label: '인사이트', icon: 'LayoutDashboard', exact: true },
    {
        href: '/dashboard/admin/campaigns',
        label: '캠페인 운영',
        icon: 'Megaphone',
        badgeKey: 'campaignTotal',
        matchPaths: [
            '/dashboard/admin/campaigns',
            '/dashboard/admin/reviews',
            '/dashboard/admin/stats',
            '/dashboard/campaign/new'
        ],
        subLinks: [
            {
                href: '/dashboard/admin/campaigns',
                label: '캠페인 관리',
                icon: 'Megaphone',
                matchPaths: ['/dashboard/admin/campaigns', '/dashboard/campaign/new']
            },
            { href: '/dashboard/admin/reviews', label: '리뷰 관리', icon: 'ClipboardCheck', matchPaths: ['/dashboard/admin/reviews'] },
            { href: '/dashboard/admin/stats', label: '진행 대시보드', icon: 'PieChart', exact: true }
        ]
    },
    {
        href: '/dashboard/admin/users',
        label: '회원·인증 관리',
        icon: 'Users',
        matchPaths: ['/dashboard/admin/users', '/dashboard/admin/verifications'],
        subLinks: [
            { href: '/dashboard/admin/users', label: '회원 관리', icon: 'Users', matchPaths: ['/dashboard/admin/users'] },
            { href: '/dashboard/admin/verifications', label: '사업자 인증', icon: 'ShieldCheck', matchPaths: ['/dashboard/admin/verifications'] }
        ]
    },
    {
        href: '/dashboard/admin/community',
        label: '콘텐츠 운영',
        icon: 'MessageSquare',
        matchPaths: [
            '/dashboard/admin/banners',
            '/dashboard/admin/community',
            '/dashboard/admin/notifications'
        ],
        subLinks: [
            { href: '/dashboard/admin/banners', label: '배너 관리', icon: 'Image', exact: true },
            { href: '/dashboard/admin/community', label: '커뮤니티 관리', icon: 'MessageSquare', matchPaths: ['/dashboard/admin/community'] },
            {
                href: '/dashboard/admin/notifications',
                label: '알림 전송 관리',
                icon: 'Bell',
                collapsible: true,
                matchPaths: ['/dashboard/admin/notifications'],
                subLinks: [
                    { href: '/dashboard/admin/notifications/email', label: '이메일 전송', icon: 'Mail', exact: true },
                    { href: '/dashboard/admin/notifications/kakao', label: '카카오톡 전송', icon: 'MessageCircle', exact: true }
                ]
            }
        ]
    },
    {
        href: '/dashboard/admin/payments',
        label: '정산·혜택 관리',
        icon: 'CreditCard',
        matchPaths: ['/dashboard/admin/payments', '/dashboard/admin/coupons'],
        subLinks: [
            { href: '/dashboard/admin/payments', label: '결제 관리', icon: 'CreditCard', matchPaths: ['/dashboard/admin/payments'] },
            { href: '/dashboard/admin/coupons', label: '쿠폰 관리', icon: 'Ticket', matchPaths: ['/dashboard/admin/coupons'] }
        ]
    },
    {
        href: '/dashboard/admin/contact',
        label: '지원',
        icon: 'Headset',
        matchPaths: ['/dashboard/admin/contact', '/dashboard/admin/inquiries'],
        subLinks: [
            { href: '/dashboard/admin/contact', label: '고객센터', icon: 'Headset', matchPaths: ['/dashboard/admin/contact'] },
            { href: '/dashboard/admin/inquiries', label: '제휴 문의', icon: 'Mail', matchPaths: ['/dashboard/admin/inquiries'] }
        ]
    }
];

export const INFLUENCER_LINKS = INFLUENCER_NAV;
export const ADVERTISER_LINKS = ADVERTISER_NAV;
export const ADMIN_LINKS = ADMIN_NAV;
