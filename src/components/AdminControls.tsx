'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Settings } from 'lucide-react';

export default function AdminControls({ campaignId }: { campaignId: string | number }) {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const check = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check Profile Role
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (data?.role === 'ADMIN') {
                setIsAdmin(true);
            }
        };
        check();
    }, []);

    if (!isAdmin) return null;

    return (
        <Link
            href={`/dashboard/campaign/new?id=${campaignId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-all shadow-sm ml-auto"
        >
            <Settings className="w-3 h-3" />
            수정
        </Link>
    );
}
