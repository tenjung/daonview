'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ContactForm from './ContactForm';

// 메인 페이지 컴포넌트
export default function ContactPage() {
    return (
        <div className="container py-16 max-w-2xl">
            <h1 className="text-3xl font-extrabold text-text-main mb-8 text-center">
                1:1 문의하기
            </h1>
            <Suspense fallback={<div>Loading...</div>}>
                <ContactForm />
            </Suspense>
        </div>
    );
}
