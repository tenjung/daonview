import { getRequestAuth } from '@/lib/auth/requestAuth';
import { CAMPAIGN_DETAIL_SELECT } from '@/lib/campaignSelects';
import { toPublicCampaign } from '@/lib/publicCampaignDto';
import { canEditCampaign } from '@/lib/campaignPermissions';
import { getPublicCampaign } from '@/lib/publicCampaignServer';
import { createAdminClient } from '@/lib/supabase/admin';
import CampaignDetailClient from '@/components/CampaignDetailClient';
import { notFound } from 'next/navigation';
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
    const campaign = await getPublicCampaign(id);

    const metadataCampaign = campaign as {
        title?: string | null;
        thumbnail_url?: string | null;
        campaign_options?: unknown;
    } | null;

    if (!metadataCampaign) return { robots: { index: false, follow: true } };

    const campaignOptions = Array.isArray(metadataCampaign.campaign_options)
        ? metadataCampaign.campaign_options[0]
        : metadataCampaign.campaign_options;
    const step2Data = campaignOptions?.step2Data || {};

    const title = step2Data.campaignTitle || metadataCampaign.title;
    const description = '다온뷰 체험단 혜택 및 참여 가이드를 확인해보세요.';
    const thumbnail = metadataCampaign.thumbnail_url;

    return {
        robots: { index: false, follow: true },
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
    let campaign = await getPublicCampaign(id);
    if (!campaign && /^\d+$/.test(id)) {
        const auth = await getRequestAuth();
        if (auth.user && !auth.profileError && ['ADMIN', 'ADVERTISER'].includes(auth.role || '')) {
            const result = await auth.supabase.from('campaigns').select(CAMPAIGN_DETAIL_SELECT).eq('id', id).maybeSingle();
            if (result.error) throw new Error('캠페인 미리보기를 불러오지 못했습니다.');
            const preview = result.data as unknown as (Record<string, unknown> & { created_by: string }) | null;
            if (preview && canEditCampaign({ userId: auth.user.id, role: auth.role, campaignCreatorId: preview.created_by })) campaign = toPublicCampaign(preview);
        }
    }
    if (!campaign) return notFound();

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
