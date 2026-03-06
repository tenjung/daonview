import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRole } from '@/lib/campaignPermissions';
import { VIDEO_DAILY_LIMIT, VIDEO_GENERATED_BUCKET, VIDEO_SOURCE_BUCKET } from '@/lib/video/constants';
import type { AIQuota } from '@/types/aiQuota';
import type { VideoAssetType, VideoInputMode, VideoJob, VideoJobAsset, VideoVoiceKey } from '@/types/video-assistant';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getKstBounds() {
  const now = new Date();
  const kstDate = new Date(now.getTime() + KST_OFFSET_MS);
  const date = kstDate.toISOString().split('T')[0];
  return {
    start: `${date}T00:00:00+09:00`,
    end: `${date}T23:59:59+09:00`,
  };
}

export async function getVideoUserRole(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (error) throw new Error('사용자 권한 확인 중 오류가 발생했습니다.');
  return String(data?.role || '').toUpperCase();
}

export async function getVideoQuota(userId: string): Promise<AIQuota> {
  const admin = createAdminClient();
  const role = await getVideoUserRole(userId);
  if (isAdminRole(role)) {
    return { count: 0, limit: 0, unlimited: true };
  }

  const { start, end } = getKstBounds();
  const { count, error } = await admin
    .from('ai_video_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('service_type', 'SHORTS_AUTO')
    .gte('created_at', start)
    .lt('created_at', end);

  if (error) throw new Error('영상 서비스 사용량 확인 중 오류가 발생했습니다.');

  return {
    count: count || 0,
    limit: VIDEO_DAILY_LIMIT,
  };
}

export function assertVideoQuotaAvailable(quota: AIQuota) {
  if (!quota.unlimited && quota.count >= quota.limit) {
    throw new Error('일일 영상 제작 제한 횟수(2회)를 모두 소모했습니다. 내일 다시 이용해주세요.');
  }
}

export function buildStoragePath(params: {
  userId: string;
  jobId: string;
  fileName: string;
  type: VideoAssetType;
}) {
  const ext = params.fileName.split('.').pop()?.toLowerCase() || (params.type === 'IMAGE' ? 'jpg' : 'mp4');
  const safeName = params.fileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || params.type.toLowerCase();

  return `${params.userId}/${params.jobId}/${params.type.toLowerCase()}-${Date.now()}-${safeName}.${ext}`;
}

export async function uploadSourceAsset(params: {
  userId: string;
  jobId: string;
  file: File;
  assetType: VideoAssetType;
}) {
  const admin = createAdminClient();
  const path = buildStoragePath({
    userId: params.userId,
    jobId: params.jobId,
    fileName: params.file.name,
    type: params.assetType,
  });

  const buffer = Buffer.from(await params.file.arrayBuffer());
  const { error } = await admin.storage.from(VIDEO_SOURCE_BUCKET).upload(path, buffer, {
    contentType: params.file.type,
    upsert: false,
  });

  if (error) throw new Error(`원본 파일 업로드 실패: ${error.message}`);

  return path;
}

export async function uploadSourceBufferAsset(params: {
  userId: string;
  jobId: string;
  fileName: string;
  contentType: string;
  buffer: Buffer;
  assetType: VideoAssetType;
}) {
  const admin = createAdminClient();
  const path = buildStoragePath({
    userId: params.userId,
    jobId: params.jobId,
    fileName: params.fileName,
    type: params.assetType,
  });

  const { error } = await admin.storage.from(VIDEO_SOURCE_BUCKET).upload(path, params.buffer, {
    contentType: params.contentType,
    upsert: false,
  });

  if (error) throw new Error(`원본 버퍼 업로드 실패: ${error.message}`);

  return path;
}

export async function createVideoJob(params: {
  userId: string;
  title: string;
  script: string;
  inputMode: VideoInputMode;
  voice: VideoVoiceKey;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('ai_video_jobs')
    .insert({
      user_id: params.userId,
      service_type: 'SHORTS_AUTO',
      input_mode: params.inputMode,
      title: params.title || null,
      script: params.script,
      voice: params.voice,
      status: 'UPLOADING',
      progress: 0,
      aspect_ratio: 'VERTICAL_9_16',
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(`영상 작업 생성 실패: ${error?.message || '알 수 없는 오류'}`);
  return data as VideoJob;
}

export async function insertVideoJobAssets(jobId: string, assets: Array<Pick<VideoJobAsset, 'asset_type' | 'storage_path' | 'sort_order'>>) {
  if (assets.length === 0) return;
  const admin = createAdminClient();
  const { error } = await admin.from('ai_video_job_assets').insert(
    assets.map((asset) => ({
      job_id: jobId,
      asset_type: asset.asset_type,
      storage_path: asset.storage_path,
      sort_order: asset.sort_order,
    }))
  );
  if (error) throw new Error(`영상 작업 자산 저장 실패: ${error.message}`);
}

export async function getAuthorizedVideoJob(jobId: string, userId: string) {
  const admin = createAdminClient();
  const role = await getVideoUserRole(userId);

  const { data, error } = await admin
    .from('ai_video_jobs')
    .select('*, assets:ai_video_job_assets(*)')
    .eq('id', jobId)
    .maybeSingle();

  if (error) throw new Error('영상 작업 조회 중 오류가 발생했습니다.');
  if (!data) throw new Error('영상 작업을 찾을 수 없습니다.');
  if (!isAdminRole(role) && data.user_id !== userId) {
    throw new Error('이 작업에 접근할 권한이 없습니다.');
  }

  return data as VideoJob;
}

export async function getQueuedVideoJob() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('ai_video_jobs')
    .select('*')
    .eq('status', 'QUEUED')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`대기 중인 영상 작업 조회 실패: ${error.message}`);
  return (data || null) as VideoJob | null;
}

export async function updateVideoJob(jobId: string, patch: Partial<VideoJob>) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('ai_video_jobs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .select('*')
    .single();

  if (error) throw new Error(`영상 작업 상태 업데이트 실패: ${error.message}`);
  return data as VideoJob;
}

export async function getVideoJobAssets(jobId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('ai_video_job_assets')
    .select('*')
    .eq('job_id', jobId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`영상 자산 조회 실패: ${error.message}`);
  return (data || []) as VideoJobAsset[];
}

export async function uploadGeneratedAsset(params: {
  userId: string;
  jobId: string;
  fileName: string;
  contentType: string;
  buffer: Buffer;
}) {
  const admin = createAdminClient();
  const path = `${params.userId}/${params.jobId}/${params.fileName}`;
  const { error } = await admin.storage.from(VIDEO_GENERATED_BUCKET).upload(path, params.buffer, {
    contentType: params.contentType,
    upsert: true,
  });

  if (error) throw new Error(`생성 결과 업로드 실패: ${error.message}`);

  const { data } = admin.storage.from(VIDEO_GENERATED_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function downloadSourceAsset(storagePath: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(VIDEO_SOURCE_BUCKET).download(storagePath);
  if (error || !data) throw new Error(`원본 자산 다운로드 실패: ${error?.message || storagePath}`);
  return Buffer.from(await data.arrayBuffer());
}
