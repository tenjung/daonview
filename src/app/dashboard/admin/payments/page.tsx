import PaymentManagementClient from "@/components/admin/PaymentManagementClient";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: '결제 관리 | 다온뷰 관리자',
    description: '결제 내역 및 환불 관리',
};

export default function PaymentManagementPage() {
    return (
        <AdminPageLayout>
            <PaymentManagementClient />
        </AdminPageLayout>
    );
}
