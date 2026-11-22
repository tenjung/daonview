import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';

/** Call only after a successful authorized write. Cache failure must not retry the write. */
export function invalidatePublicCampaigns(ids: Array<string | number> = []): string | undefined {
  try {
    revalidateTag('public-campaigns', { expire: 0 });
    revalidateTag('home-banner-data', { expire: 0 });
    for (const path of ['/', '/campaigns', '/dashboard/admin/campaigns', '/dashboard/advertiser/campaigns']) revalidatePath(path);
    for (const id of new Set(ids.map(id => String(id).replace(/^0+(?=\d)/, '')))) {
      revalidateTag(`public-campaign:${id}`, { expire: 0 });
      revalidatePath(`/campaigns/${id}`);
      revalidatePath(`/c/${id}`);
    }
    return undefined;
  } catch {
    return '저장은 완료됐으나 화면 캐시 갱신에 실패했습니다. 잠시 후 새로고침해 주세요.';
  }
}
