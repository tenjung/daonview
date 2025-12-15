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
        <div className="flex gap-2 mb-4">
            <Link
                href={`/dashboard/campaign/new?id=${campaignId}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-black transition-all shadow-sm"
            >
                <Settings className="w-3 h-3" />
                관리자 수정
            </Link>
        </div>
    );
}
