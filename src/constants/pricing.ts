export interface UnlimitedPlan {
    period: string;
    pricePerMonth: number;
    total: number;
    discount: number | null;
    highlight: boolean;
}

export const UNLIMITED_PLANS: UnlimitedPlan[] = [
    { period: '1개월', pricePerMonth: 170000, total: 170000, discount: null, highlight: false },
    { period: '3개월', pricePerMonth: 159000, total: 477000, discount: 6, highlight: false },
    { period: '6개월', pricePerMonth: 149000, total: 894000, discount: 12, highlight: false },
    { period: '12개월', pricePerMonth: 129000, total: 1548000, discount: 24, highlight: true },
];
