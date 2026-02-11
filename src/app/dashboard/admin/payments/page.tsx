import PaymentManagementClient from "@/components/admin/PaymentManagementClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: '결제 관리 | 다온뷰 관리자',
    description: '결제 내역 및 환불 관리',
};

export default function PaymentManagementPage() {
    return (
        <main className="min-h-screen bg-slate-50/30">
            <PaymentManagementClient />
        </main>
    );
}
