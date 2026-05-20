import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { addDays, normalizeScheduleType } from '@/lib/campaignSchedule';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const AUTO_EXTENSION_DAYS = 14;
const AUTO_EXTENSION_APPLICATION_STATUSES = ['SELECTED', 'APPROVED'] as const;

type CampaignOptions = Record<string, unknown> & {
  step1Data?: Record<string, unknown>;
  autoExtension?: Record<string, unknown>;
};

interface RecruitableCampaign {
  id: number;
  title: string;
  status: string;
  end_date: string | null;
  total_recruitment: number | null;
  campaign_options: Record<string, unknown> | Record<string, unknown>[] | null;
}

function toCampaignOptions(value: unknown): CampaignOptions {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as CampaignOptions;
  }

  return {};
}

function getCampaignOptions(input: RecruitableCampaign): CampaignOptions {
  if (Array.isArray(input.campaign_options)) {
    return toCampaignOptions(input.campaign_options[0]);
  }

  return toCampaignOptions(input.campaign_options);
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET is required.' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: campaigns, error: campaignError } = await admin
      .from('campaigns')
      .select('id, title, status, end_date, total_recruitment, campaign_options')
      .in('status', ['RECRUITING', 'ONGOING'])
      .lt('end_date', today);

    if (campaignError) {
      throw campaignError;
    }

    const candidates = (campaigns || []).filter((campaign) => {
      const typedCampaign = campaign as RecruitableCampaign;
      if (!typedCampaign.end_date) return false;

      const options = getCampaignOptions(typedCampaign);
      const scheduleType = normalizeScheduleType(options?.step1Data?.scheduleType);
      return scheduleType === 'FAST';
    }) as RecruitableCampaign[];

    const results = [];

    for (const campaign of candidates) {
      const { count: selectedCount, error: selectedCountError } = await admin
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .in('status', Array.from(AUTO_EXTENSION_APPLICATION_STATUSES));

      if (selectedCountError) {
        results.push({
          campaignId: campaign.id,
          title: campaign.title,
          extended: false,
          reason: selectedCountError.message,
        });
        continue;
      }

      const currentSelectedCount = selectedCount || 0;
      const recruitTarget = campaign.total_recruitment ?? null;

      const nextEndDate = addDays(campaign.end_date!, AUTO_EXTENSION_DAYS);
      const options = getCampaignOptions(campaign);
      const autoExtension = {
        ...(options.autoExtension as Record<string, unknown> | undefined),
        lastExtendedAt: new Date().toISOString(),
        extensionDays: AUTO_EXTENSION_DAYS,
        previousEndDate: campaign.end_date,
        nextEndDate,
        selectedCount: currentSelectedCount,
        recruitTarget,
        extensionCount: Number((options.autoExtension as Record<string, unknown> | undefined)?.extensionCount || 0) + 1,
      };

      const { error: updateError } = await admin
        .from('campaigns')
        .update({
          end_date: nextEndDate,
          campaign_options: {
            ...options,
            autoExtension,
          },
        })
        .eq('id', campaign.id);

      if (updateError) {
        results.push({
          campaignId: campaign.id,
          title: campaign.title,
          extended: false,
          reason: updateError.message,
          selectedCount: currentSelectedCount,
          recruitTarget,
        });
        continue;
      }

      results.push({
        campaignId: campaign.id,
        title: campaign.title,
        extended: true,
        previousEndDate: campaign.end_date,
        nextEndDate,
        selectedCount: currentSelectedCount,
        recruitTarget,
      });
    }

    return NextResponse.json({
      success: true,
      checked: candidates.length,
      extended: results.filter((result) => result.extended).length,
      results,
    });
  } catch (error) {
    console.error('[CRON] fast campaign auto extension error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
