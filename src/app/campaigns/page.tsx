import { supabase } from '@/lib/supabase/client';
import { mapCampaignToCard } from '@/lib/campaignUtils';
import CampaignListClient from '@/components/CampaignListClient';
import { ACTIVE_CAMPAIGN_STATUSES } from '@/constants/campaign';

export const revalidate = 30; // ISR: 30초마다 재생성


export default async function CampaignsPage() {
    // Fetch all campaigns on the server
    const { data: rawCampaigns } = await supabase
        .from('campaigns')
        .select('*, applications(count)')
        .in('status', ACTIVE_CAMPAIGN_STATUSES as unknown as string[])
        .order('created_at', { ascending: false });

    const campaigns = (rawCampaigns || []).map(c => mapCampaignToCard(c as any));

    return (
        <div className="min-h-screen bg-white">
            <CampaignListClient initialCampaigns={campaigns} />
        </div>
    );
}
