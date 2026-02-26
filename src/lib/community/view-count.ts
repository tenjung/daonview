import { createAdminClient } from '@/lib/supabase/admin';

type CommunityViewTarget = 'POST' | 'NOTICE';

export async function incrementCommunityViewCount(
  target: CommunityViewTarget,
  id: string,
  nextViewCount: number
): Promise<void> {
  const admin = createAdminClient();

  if (target === 'POST') {
    const { error } = await admin
      .from('posts')
      .update({ view_count: nextViewCount })
      .eq('id', id);

    if (error) {
      console.error('[community:view-count] increment failed', {
        target,
        id,
        error: error.message,
      });
    }
    return;
  }

  const noticeId = Number(id);
  if (!Number.isInteger(noticeId)) {
    console.error('[community:view-count] invalid notice id', { id });
    return;
  }

  const { error } = await admin.rpc('increment_notice_view_count', { notice_id: noticeId });
  if (error) {
    console.error('[community:view-count] increment failed', {
      target,
      id,
      error: error.message,
    });
  }
}
