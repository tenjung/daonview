import { supabase } from '@/lib/supabaseClient';
import { mapCampaignToCard } from '@/lib/campaignUtils';
import CampaignListClient from '@/components/CampaignListClient';

export const revalidate = 0;

export default async function CampaignsPage() {
    // Fetch all campaigns on the server
    const { data: rawCampaigns } = await supabase
        .from('campaigns')
        .select('*')
        .in('status', ['RECRUITING', 'ONGOING'])
        .order('created_at', { ascending: false });

    const campaigns = (rawCampaigns || []).map(c => mapCampaignToCard(c as any));

    return (
        <div className="min-h-screen bg-white">
            <CampaignListClient initialCampaigns={campaigns} />
        </div>
    );
}
