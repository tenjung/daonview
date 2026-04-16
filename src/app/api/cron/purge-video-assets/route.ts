import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { VIDEO_GENERATED_BUCKET, VIDEO_SOURCE_BUCKET } from '@/lib/video/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const PURGE_BATCH_SIZE = 20;
const STORAGE_REMOVE_BATCH_SIZE = 100;

interface PurgeAsset {
  storage_path: string | null;
}

interface PurgeChapter {
  storage_path: string | null;
}

interface PurgeVideoJob {
  id: string;
  video_url: string | null;
  audio_url: string | null;
  subtitle_url: string | null;
  thumbnail_url: string | null;
  assets?: PurgeAsset[];
  chapters?: PurgeChapter[];
}

function uniquePaths(paths: Array<string | null | undefined>) {
  return Array.from(new Set(paths.map((path) => String(path || '').trim()).filter(Boolean)));
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function extractGeneratedPathFromPublicUrl(url: string | null | undefined) {
  if (!url) return null;
  const marker = `/${VIDEO_GENERATED_BUCKET}/`;
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return null;

  const rawPath = url.slice(markerIndex + marker.length).split('?')[0];
  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

function isMissingStorageObjectError(error: { message?: string; statusCode?: string | number }) {
  const message = String(error.message || '').toLowerCase();
  return String(error.statusCode || '') === '404' || message.includes('not found') || message.includes('does not exist');
}

async function removeStoragePaths(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  paths: string[]
) {
  for (const batch of chunkArray(paths, STORAGE_REMOVE_BATCH_SIZE)) {
    const { error } = await admin.storage.from(bucket).remove(batch);
    if (error && !isMissingStorageObjectError(error)) {
      throw new Error(`${bucket} 파일 삭제 실패: ${error.message}`);
    }
  }
}

async function purgeVideoJob(admin: ReturnType<typeof createAdminClient>, job: PurgeVideoJob) {
  const sourcePaths = uniquePaths((job.assets || []).map((asset) => asset.storage_path));
  const generatedPaths = uniquePaths([
    ...(job.chapters || []).map((chapter) => chapter.storage_path),
    extractGeneratedPathFromPublicUrl(job.video_url),
    extractGeneratedPathFromPublicUrl(job.audio_url),
    extractGeneratedPathFromPublicUrl(job.subtitle_url),
    extractGeneratedPathFromPublicUrl(job.thumbnail_url),
  ]);

  await removeStoragePaths(admin, VIDEO_SOURCE_BUCKET, sourcePaths);
  await removeStoragePaths(admin, VIDEO_GENERATED_BUCKET, generatedPaths);

  const { error: assetDeleteError } = await admin.from('ai_video_job_assets').delete().eq('job_id', job.id);
  if (assetDeleteError) {
    throw new Error(`영상 원본 자산 row 삭제 실패: ${assetDeleteError.message}`);
  }

  const { error: chapterDeleteError } = await admin.from('ai_video_job_chapters').delete().eq('job_id', job.id);
  if (chapterDeleteError) {
    throw new Error(`영상 챕터 row 삭제 실패: ${chapterDeleteError.message}`);
  }

  const { error: jobUpdateError } = await admin
    .from('ai_video_jobs')
    .update({
      script: '',
      video_url: null,
      audio_url: null,
      subtitle_url: null,
      thumbnail_url: null,
      subtitle_draft: null,
      subtitle_final: null,
      purged_at: new Date().toISOString(),
      purge_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id);

  if (jobUpdateError) {
    throw new Error(`영상 작업 purge 상태 업데이트 실패: ${jobUpdateError.message}`);
  }

  return {
    jobId: job.id,
    sourceFilesDeleted: sourcePaths.length,
    generatedFilesDeleted: generatedPaths.length,
  };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is required.' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from('ai_video_jobs')
      .select('id, video_url, audio_url, subtitle_url, thumbnail_url, assets:ai_video_job_assets(storage_path), chapters:ai_video_job_chapters(storage_path)')
      .eq('status', 'COMPLETED')
      .is('purged_at', null)
      .lte('purge_after', new Date().toISOString())
      .order('purge_after', { ascending: true })
      .limit(PURGE_BATCH_SIZE);

    if (error) {
      throw error;
    }

    const jobs = (data || []) as PurgeVideoJob[];
    const results = [];

    for (const job of jobs) {
      try {
        results.push({ success: true, ...(await purgeVideoJob(admin, job)) });
      } catch (purgeError) {
        const message = purgeError instanceof Error ? purgeError.message : '알 수 없는 purge 오류';
        console.error('[CRON] video purge failed:', { jobId: job.id, message });
        await admin
          .from('ai_video_jobs')
          .update({
            purge_error: message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
        results.push({ success: false, jobId: job.id, error: message });
      }
    }

    return NextResponse.json({
      success: true,
      checked: jobs.length,
      purged: results.filter((result) => result.success).length,
      failed: results.filter((result) => !result.success).length,
      results,
    });
  } catch (error) {
    console.error('[CRON] video purge error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
