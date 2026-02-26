'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

const INQUIRY_CATEGORY_OPTIONS = [
    { value: 'EXPERIENCE', label: '체험단 관련 문의' },
    { value: 'POINT', label: '정산 문의' },
    { value: 'ERROR', label: '사이트 이용 오류' },
    { value: 'AD_PARTNERSHIP', label: '제휴/광고 문의' },
] as const;

const inquirySchema = z.object({
    category: z.string().min(1, '문의 유형을 선택해주세요.'),
    title: z.string().min(5, '제목은 5자 이상 입력해주세요.'),
    content: z.string().min(10, '내용은 10자 이상 입력해주세요.'),
});

type InquiryForm = z.infer<typeof inquirySchema>;

export default function ContactForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<InquiryForm>({
        resolver: zodResolver(inquirySchema),
        defaultValues: {
            category: 'EXPERIENCE', // 기본값 설정
            title: '',
            content: '',
        },
    });

    const onSubmit = async (data: InquiryForm) => {
        setIsSubmitting(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                toast.error('로그인이 필요한 서비스입니다.');
                router.push('/login?next=/contact');
                return;
            }

            const { error } = await supabase.from('inquiries').insert({
                user_id: user.id, // profiles 테이블을 참조하므로 user.id 사용 (프로필이 생성되어 있어야 함)
                category: data.category,
                title: data.title,
                content: data.content,
                status: 'PENDING',
            });

            if (error) {
                const detail = [error.code, error.message].filter(Boolean).join(': ');
                console.error('Error submitting inquiry:', detail, error);
                toast.error(`문의 접수 실패: ${error.message}`);
                return;
            }

            toast.success('문의가 성공적으로 접수되었습니다.');
            router.push('/contact/my');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '문의 접수 중 오류가 발생했습니다.';
            console.error('Error submitting inquiry:', message, error);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className=""
        >
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    문의 유형
                </label>
                <select
                    {...register('category')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    {INQUIRY_CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {errors.category && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.category.message}
                    </p>
                )}
            </div>

            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    제목
                </label>
                <input
                    type="text"
                    {...register('title')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="제목을 입력해주세요"
                />
                {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
            </div>

            <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    내용
                </label>
                <textarea
                    {...register('content')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="문의하실 내용을 자세히 적어주세요"
                ></textarea>
                {errors.content && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.content.message}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? '접수 중...' : '문의 접수하기'}
            </button>
        </form>
    )
}
