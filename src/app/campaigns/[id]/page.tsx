import { supabase } from '@/lib/supabaseClient';
import CampaignDetailClient from '@/components/CampaignDetailClient';
import { notFound } from 'next/navigation';

export const revalidate = 60; // ISR: 1분마다 재생성


interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
    const { id } = await params;

    // Fetch campaign data on the server
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*, applications(count)')
        .eq('id', id)
        .single();

    if (error || !campaign) {
        console.error('Campaign not found or error:', error);
        return notFound();
    }

    return (
        <div className="min-h-screen bg-white">
            <CampaignDetailClient campaign={campaign} id={id} />
        </div>
    );
}
