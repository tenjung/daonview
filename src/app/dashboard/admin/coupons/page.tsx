import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import CouponManagementClient from "@/components/admin/CouponManagementClient";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: '쿠폰 관리 | 다온뷰 관리자',
    description: '쿠폰 발행 및 관리',
};

export default async function CouponManagementPage() {
    await requireDashboardRole('ADMIN');
    return (
        <AdminPageLayout>
            <CouponManagementClient />
        </AdminPageLayout>
    );
}
