import { getPublicServerClient } from '@/lib/supabase/publicServer';
import { createAdminClient } from '@/lib/supabase/admin';
import CampaignDetailClient from '@/components/CampaignDetailClient';
import { notFound } from 'next/navigation';
import { CAMPAIGN_DETAIL_SELECT, CAMPAIGN_METADATA_SELECT } from '@/lib/campaignSelects';
import { normalizeOptionKey, type PublicPurchaseLink } from '@/lib/purchaseLink';

export const revalidate = 60; // ISR: 1분마다 재생성


import { Metadata } from 'next';

interface PageProps {
    params: Promise<{ id: string }>;
}

type CampaignOptionsRecord = Record<string, unknown> & {
    step1Data?: Record<string, unknown>;
};

type CampaignDetailRecord = Record<string, unknown> & {
    campaign_options: unknown;
    product_options?: unknown[] | null;
};

function getCampaignOptionsRecord(value: unknown): CampaignOptionsRecord | null {
    const candidate = Array.isArray(value) ? value[0] : value;
    return candidate && typeof candidate === 'object'
        ? candidate as CampaignOptionsRecord
        : null;
}

function sanitizeCampaignOptions(value: unknown, hideProductUrl: boolean): unknown {
    const sanitizeEntry = (entry: unknown) => {
        if (!entry || typeof entry !== 'object') return entry;
        const options = entry as CampaignOptionsRecord;
        const step1Data = options.step1Data && typeof options.step1Data === 'object'
            ? options.step1Data
            : {};
        const safeStep1Data = { ...step1Data };
        delete safeStep1Data.purchaseLinkPools;

        return {
            ...options,
            step1Data: {
                ...safeStep1Data,
                ...(hideProductUrl ? { productUrl: '' } : {}),
            },
        };
    };

    return Array.isArray(value) ? value.map(sanitizeEntry) : sanitizeEntry(value);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = getPublicServerClient();

    const { data: campaign } = await supabase
        .from('campaigns')
        .select(CAMPAIGN_METADATA_SELECT)
        .eq('id', id)
        .single();

    const metadataCampaign = campaign as {
        title?: string | null;
        thumbnail_url?: string | null;
        campaign_options?: unknown;
    } | null;

    if (!metadataCampaign) return {};

    const campaignOptions = Array.isArray(metadataCampaign.campaign_options)
        ? metadataCampaign.campaign_options[0]
        : metadataCampaign.campaign_options;
    const step2Data = campaignOptions?.step2Data || {};

    const title = step2Data.campaignTitle || metadataCampaign.title;
    const description = '다온뷰 체험단 혜택 및 참여 가이드를 확인해보세요.';
    const thumbnail = metadataCampaign.thumbnail_url;

    return {
        title: `${title} | 다온뷰`,
        description,
        openGraph: {
            title: title,
            description,
            images: thumbnail ? [{ url: thumbnail }] : [],
            url: `https://daonview.com/campaigns/${id}`,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description,
            images: thumbnail ? [thumbnail] : [],
        },
        alternates: {
            canonical: `/campaigns/${id}`,
        }
    };
}

export default async function CampaignDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = getPublicServerClient();

    // Fetch campaign data on the server
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select(CAMPAIGN_DETAIL_SELECT)
        .eq('id', id)
        .single();

    if (error || !campaign) {
        console.error('Campaign not found or error:', error);
        return notFound();
    }

    const campaignRecord = campaign as unknown as CampaignDetailRecord;
    const campaignOptions = getCampaignOptionsRecord(campaignRecord.campaign_options);
    const step1Data = campaignOptions?.step1Data || {};
    const productUrlPrivate = Boolean(step1Data.productUrlPrivate);
    const productUrlIndividual = Boolean(step1Data.productUrlIndividual);
    const optionKeys = new Set(
        (Array.isArray(campaignRecord.product_options) ? campaignRecord.product_options : [])
            .map((option: unknown) => normalizeOptionKey(
                typeof option === 'string'
                    ? option
                    : String((option as { optionName?: unknown })?.optionName || '')
            ))
            .filter(Boolean)
    );
    const publicOptionLinks: PublicPurchaseLink[] = [];

    if (!productUrlPrivate && productUrlIndividual && optionKeys.size > 0) {
        const admin = createAdminClient();
        const { data: linkRows, error: linkError } = await admin
            .from('campaign_purchase_links')
            .select('id, option_key, option_label, purchase_link_url')
            .eq('campaign_id', Number(id))
            .eq('is_active', true)
            .order('id', { ascending: true });

        if (linkError) {
            console.error('Public purchase link lookup failed:', linkError);
        } else {
            const seenKeys = new Set<string>();
            (linkRows || []).forEach((row) => {
                const optionKey = normalizeOptionKey(row.option_key || row.option_label || '');
                const url = String(row.purchase_link_url || '').trim();
                if (!optionKeys.has(optionKey) || seenKeys.has(optionKey) || !/^https?:\/\//i.test(url)) return;
                seenKeys.add(optionKey);
                publicOptionLinks.push({
                    optionKey,
                    optionLabel: String(row.option_label || ''),
                    url,
                });
            });
        }
    }

    const safeCampaign = {
        ...campaignRecord,
        campaign_options: sanitizeCampaignOptions(campaignRecord.campaign_options, productUrlPrivate),
    };

    return (
        <div className="min-h-screen bg-white">
            <CampaignDetailClient campaign={safeCampaign} id={id} publicOptionLinks={publicOptionLinks} />
        </div>
    );
}
