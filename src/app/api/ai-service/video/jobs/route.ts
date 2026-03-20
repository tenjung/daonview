import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  assertVideoQuotaAvailable,
  createVideoJob,
  getVideoQuota,
  insertVideoJobAssets,
  updateVideoJob,
  uploadSourceAsset,
  uploadSourceBufferAsset,
} from '@/lib/video/db';
import { parseVideoJobFormData } from '@/lib/video/validation';
import type { CreateVideoJobResponse } from '@/types/video-assistant';

export const runtime = 'nodejs';

function inferFileNameFromUrl(url: string, fallback: string) {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split('/').pop();
    return lastSegment && lastSegment.includes('.') ? lastSegment : fallback;
  } catch {
    return fallback;
  }
}

async function downloadPexelsAsset(asset: { sourceUrl: string; kind: 'IMAGE' | 'VIDEO'; title: string }) {
  const response = await fetch(asset.sourceUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Pexels 자산 다운로드 실패: ${asset.title}`);
  }

  const contentType = response.headers.get('content-type') || (asset.kind === 'VIDEO' ? 'video/mp4' : 'image/jpeg');
  const fallbackName = asset.kind === 'VIDEO' ? 'pexels-video.mp4' : 'pexels-image.jpg';

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType,
    fileName: inferFileNameFromUrl(asset.sourceUrl, fallbackName),
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요한 서비스입니다.' }, { status: 401 });
    }

    const formData = await request.formData();
    const input = parseVideoJobFormData(formData);
    const quota = await getVideoQuota(user.id);
    assertVideoQuotaAvailable(quota);

    const job = await createVideoJob({
      userId: user.id,
      title: input.title,
      script: input.script,
      inputMode: input.inputMode,
      voice: input.voice,
    });

    try {
      const sourceAssets = [];

      if (input.audioFile) {
        sourceAssets.push({
          asset_type: 'AUDIO' as const,
          storage_path: await uploadSourceAsset({ userId: user.id, jobId: job.id, file: input.audioFile, assetType: 'AUDIO' }),
          sort_order: 0,
        });
      }

      const imageAssets = await Promise.all(
        input.imageFiles.map(async (file, index) => ({
          asset_type: 'IMAGE' as const,
          storage_path: await uploadSourceAsset({ userId: user.id, jobId: job.id, file, assetType: 'IMAGE' }),
          sort_order: sourceAssets.length + index,
        }))
      );

      const videoAssets = await Promise.all(
        input.videoFiles.map(async (file, index) => ({
          asset_type: 'VIDEO' as const,
          storage_path: await uploadSourceAsset({ userId: user.id, jobId: job.id, file, assetType: 'VIDEO' }),
          sort_order: sourceAssets.length + imageAssets.length + index,
        }))
      );

      const pexelsAssets = await Promise.all(
        input.pexelsAssets.map(async (asset, index) => {
          const downloaded = await downloadPexelsAsset(asset);
          return {
            asset_type: asset.kind,
            storage_path: await uploadSourceBufferAsset({
              userId: user.id,
              jobId: job.id,
              fileName: downloaded.fileName,
              contentType: downloaded.contentType,
              buffer: downloaded.buffer,
              assetType: asset.kind,
            }),
            sort_order: sourceAssets.length + imageAssets.length + videoAssets.length + index,
          };
        })
      );

      await insertVideoJobAssets(job.id, [...sourceAssets, ...imageAssets, ...videoAssets, ...pexelsAssets]);
      await updateVideoJob(job.id, {
        status: 'QUEUED',
        progress: 0,
        error_message: null,
      });
    } catch (uploadError) {
      await updateVideoJob(job.id, {
        status: 'FAILED',
        progress: 100,
        error_message: uploadError instanceof Error ? uploadError.message : '원본 파일 업로드에 실패했습니다.',
      });
      return NextResponse.json(
        { error: uploadError instanceof Error ? uploadError.message : '원본 파일 업로드에 실패했습니다.' },
        { status: 500 }
      );
    }

    const response: CreateVideoJobResponse = {
      job,
      quota: {
        ...quota,
        count: quota.unlimited ? 0 : quota.count + 1,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[Video Jobs POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '영상 작업 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
