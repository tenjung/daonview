'use client';

import { Suspense } from 'react';
import ContactForm from '@/app/contact/ContactForm';

interface InquiryFormCardProps {
  basePath?: string;
}

export default function InquiryFormCard({ basePath = '/contact' }: InquiryFormCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-text-main">
        1:1 문의
      </h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ContactForm basePath={basePath} />
      </Suspense>
    </div>
  );
}
