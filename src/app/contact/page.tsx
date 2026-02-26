'use client';

import { Suspense } from 'react';
import ContactForm from './ContactForm';

// 메인 페이지 컴포넌트
export default function ContactPage() {
    return (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
            <h1 className="mb-8 text-center text-3xl font-extrabold text-text-main">
                1:1 문의하기
            </h1>
            <Suspense fallback={<div>Loading...</div>}>
                <ContactForm />
            </Suspense>
        </div>
    );
}
