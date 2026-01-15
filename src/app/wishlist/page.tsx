'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/influencer/favorites');
    }, [router]);

    return null;
}
