import { createClient } from '@supabase/supabase-js';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VOICE_MAP = {
  FEMALE_SOFT: 'nova',
  FEMALE_CLEAR: 'shimmer',
  MALE_CALM: 'echo',
};

const AUDIO_CONTENT_TYPE_BY_EXT = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
};

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
}
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
}

async function updateJob(id, patch) {
  const { error } = await supabase.from('ai_video_jobs').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(`작업 업데이트 실패: ${error.message}`);
}

async function getNextJob() {
  const { data, error } = await supabase
    .from('ai_video_jobs')
    .select('*')
    .eq('status', 'QUEUED')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const { data: claimed, error: claimError } = await supabase
    .from('ai_video_jobs')
    .update({ status: 'PROCESSING_TTS', progress: 5, updated_at: new Date().toISOString() })
    .eq('id', data.id)
    .eq('status', 'QUEUED')
    .select('*')
    .maybeSingle();

  if (claimError) throw new Error(claimError.message);
  return claimed || null;
}

async function getAssets(jobId) {
  const { data, error } = await supabase
    .from('ai_video_job_assets')
    .select('*')
    .eq('job_id', jobId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

async function callTts(script, voiceKey = 'FEMALE_SOFT') {
  const openAiVoice = VOICE_MAP[voiceKey] || VOICE_MAP.FEMALE_SOFT;
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'tts-1', voice: openAiVoice, input: script, format: 'mp3' }),
  });
  if (!response.ok) throw new Error(`TTS 실패: ${await response.text()}`);
  return Buffer.from(await response.arrayBuffer());
}

function resolveAudioMeta(filePath) {
  const fileName = filePath.split('/').pop() || 'audio.mp3';
  const extension = fileName.split('.').pop()?.toLowerCase() || 'mp3';

  return {
    fileName,
    contentType: AUDIO_CONTENT_TYPE_BY_EXT[extension] || 'audio/mpeg',
  };
}

async function callWhisper(audioBuffer, fileName = 'narration.mp3', contentType = 'audio/mpeg') {
  const formData = new FormData();
  formData.append('file', new Blob([new Uint8Array(audioBuffer)], { type: contentType }), fileName);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'srt');
  formData.append('language', 'ko');
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  });
  if (!response.ok) throw new Error(`Whisper 실패: ${await response.text()}`);
  return Buffer.from(await response.text(), 'utf8');
}

async function run(cmd, args, cwd) {
  await execFileAsync(cmd, args, { cwd });
}

async function getDuration(filePath) {
  const { stdout } = await execFileAsync(ffprobePath, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath,
  ]);
  return Math.max(0, Number.parseFloat(stdout.trim()) || 0);
}

async function downloadAsset(storagePath, targetPath) {
  const { data, error } = await supabase.storage.from('video-source-assets').download(storagePath);
  if (error || !data) throw new Error(`자산 다운로드 실패: ${error?.message || storagePath}`);
  await writeFile(targetPath, Buffer.from(await data.arrayBuffer()));
}

async function downloadAudioAsset(asset, tempDir) {
  const fileName = asset.storage_path.split('/').pop() || 'source-audio';
  const sourcePath = join(tempDir, `audio-${fileName}`);
  await downloadAsset(asset.storage_path, sourcePath);
  return sourcePath;
}

async function downloadPublicFile(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`생성 오디오 다운로드 실패: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function createVideoSegment(inputPath, outputPath) {
  await run(ffmpegPath, [
    '-y',
    '-i', inputPath,
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p',
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    outputPath,
  ]);
  return getDuration(outputPath);
}

async function createImageSegment(inputPath, outputPath, duration) {
  await run(ffmpegPath, [
    '-y',
    '-loop', '1',
    '-t', String(duration),
    '-i', inputPath,
    '-vf', "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0008,1.15)':d=125:fps=30,format=yuv420p",
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    outputPath,
  ]);
  return duration;
}

async function createTemplateSegment(outputPath, duration, color) {
  await run(ffmpegPath, [
    '-y',
    '-f', 'lavfi',
    '-i', `color=${color}:s=1080x1920:d=${duration}`,
    '-vf', 'fps=30,format=yuv420p',
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    outputPath,
  ]);
  return duration;
}

async function concatSegments(listFile, outputPath) {
  await run(ffmpegPath, ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outputPath]);
}

async function renderFinalVideo(visualPath, audioPath, subtitlePath, outputPath) {
  const safeSubtitlePath = subtitlePath
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/'/g, "\\'");
  await run(ffmpegPath, [
    '-y',
    '-i', visualPath,
    '-i', audioPath,
    '-vf', `subtitles=filename=${safeSubtitlePath}:force_style='Alignment=2,FontSize=20,MarginV=80,Outline=2,Shadow=1'`,
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-c:a', 'aac',
    '-shortest',
    outputPath,
  ]);
}

async function createThumbnail(videoPath, outputPath) {
  await run(ffmpegPath, ['-y', '-ss', '1', '-i', videoPath, '-vframes', '1', outputPath]);
}

async function uploadGenerated(job, localPath, bucketFileName, contentType) {
  const buffer = await readFile(localPath);
  const path = `${job.user_id}/${job.id}/${bucketFileName}`;
  const { error } = await supabase.storage.from('video-generated-assets').upload(path, buffer, { contentType, upsert: true });
  if (error) throw new Error(`생성 파일 업로드 실패: ${error.message}`);
  const { data } = supabase.storage.from('video-generated-assets').getPublicUrl(path);
  return data.publicUrl;
}

async function processJob(job) {
  const tempDir = await mkdtemp(join(tmpdir(), `daon-video-${job.id}-`));
  try {
    const assets = await getAssets(job.id);
    let audioPath = join(tempDir, 'narration.mp3');
    let audioBuffer;
    let audioOutputFileName = 'narration.mp3';
    let audioContentType = 'audio/mpeg';
    const subtitleSource = String(job.subtitle_final || '').trim();
    const isRerender = Boolean(subtitleSource && job.audio_url);

    if (isRerender) {
      await updateJob(job.id, { status: 'RENDERING_VIDEO', progress: 55, error_message: null });
      audioBuffer = await downloadPublicFile(job.audio_url);
      const audioMeta = resolveAudioMeta(job.audio_url);
      audioOutputFileName = audioMeta.fileName;
      audioContentType = audioMeta.contentType;
      audioPath = join(tempDir, audioOutputFileName);
      await writeFile(audioPath, audioBuffer);
    } else if (job.input_mode === 'AUDIO_SUBTITLE') {
      await updateJob(job.id, { status: 'PROCESSING_SUBTITLE', progress: 20, error_message: null });
      const audioAsset = assets.find((item) => item.asset_type === 'AUDIO');
      if (!audioAsset) {
        throw new Error('오디오 원본 파일을 찾을 수 없습니다.');
      }
      audioPath = await downloadAudioAsset(audioAsset, tempDir);
      audioBuffer = await readFile(audioPath);
      const audioMeta = resolveAudioMeta(audioPath);
      audioOutputFileName = audioMeta.fileName;
      audioContentType = audioMeta.contentType;
    } else {
      await updateJob(job.id, { status: 'PROCESSING_TTS', progress: 10, error_message: null });
      audioBuffer = await callTts(job.script, job.voice);
      await writeFile(audioPath, audioBuffer);
      await updateJob(job.id, { status: 'PROCESSING_SUBTITLE', progress: 35 });
    }

    const subtitlePath = join(tempDir, 'subtitle.srt');
    let subtitleText = subtitleSource;

    if (!isRerender) {
      const srtBuffer = await callWhisper(audioBuffer, audioOutputFileName, audioContentType);
      subtitleText = srtBuffer.toString('utf8');
      await writeFile(subtitlePath, srtBuffer);
      await updateJob(job.id, {
        subtitle_draft: subtitleText,
        subtitle_final: null,
      });
      await updateJob(job.id, { status: 'RENDERING_VIDEO', progress: 55 });
    } else {
      await writeFile(subtitlePath, Buffer.from(subtitleText, 'utf8'));
    }

    const audioDuration = Math.max(3, await getDuration(audioPath));
    const segmentPaths = [];
    let builtDuration = 0;
    let segmentIndex = 0;

    for (const asset of assets.filter((item) => item.asset_type === 'VIDEO')) {
      if (builtDuration >= audioDuration) break;
      const sourcePath = join(tempDir, `${segmentIndex}-${asset.storage_path.split('/').pop()}`);
      const outputPath = join(tempDir, `${segmentIndex}-video.mp4`);
      await downloadAsset(asset.storage_path, sourcePath);
      const duration = await createVideoSegment(sourcePath, outputPath);
      segmentPaths.push(outputPath);
      builtDuration += duration;
      segmentIndex += 1;
    }

    const imageAssets = assets.filter((item) => item.asset_type === 'IMAGE');
    let imageCursor = 0;
    while (builtDuration < audioDuration && imageCursor < imageAssets.length) {
      const asset = imageAssets[imageCursor];
      const remaining = Math.max(0, audioDuration - builtDuration);
      const segmentDuration = Math.min(3, remaining);
      const sourcePath = join(tempDir, `${segmentIndex}-${asset.storage_path.split('/').pop()}`);
      const outputPath = join(tempDir, `${segmentIndex}-image.mp4`);
      await downloadAsset(asset.storage_path, sourcePath);
      await createImageSegment(sourcePath, outputPath, segmentDuration);
      segmentPaths.push(outputPath);
      builtDuration += segmentDuration;
      segmentIndex += 1;
      imageCursor += 1;
    }

    if (builtDuration < audioDuration) {
      const fallbackDuration = Math.max(0.5, audioDuration - builtDuration);
      const outputPath = join(tempDir, `${segmentIndex}-template.mp4`);
      await createTemplateSegment(outputPath, fallbackDuration, '#101828');
      segmentPaths.push(outputPath);
      builtDuration += fallbackDuration;
    }

    if (segmentPaths.length === 0) {
      const outputPath = join(tempDir, `${segmentIndex}-template.mp4`);
      await createTemplateSegment(outputPath, audioDuration, '#101828');
      segmentPaths.push(outputPath);
    }

    const concatListPath = join(tempDir, 'segments.txt');
    await writeFile(concatListPath, segmentPaths.map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join('\n'));
    const visualPath = join(tempDir, 'visual.mp4');
    await concatSegments(concatListPath, visualPath);

    const finalPath = join(tempDir, 'final.mp4');
    await renderFinalVideo(visualPath, audioPath, subtitlePath, finalPath);

    const thumbnailPath = join(tempDir, 'thumbnail.jpg');
    await createThumbnail(finalPath, thumbnailPath);

    const [audioUrl, subtitleUrl, videoUrl, thumbnailUrl] = await Promise.all([
      uploadGenerated(job, audioPath, audioOutputFileName, audioContentType),
      uploadGenerated(job, subtitlePath, 'subtitle.srt', 'application/x-subrip'),
      uploadGenerated(job, finalPath, 'final.mp4', 'video/mp4'),
      uploadGenerated(job, thumbnailPath, 'thumbnail.jpg', 'image/jpeg'),
    ]);

    const finalDuration = await getDuration(finalPath);
    await updateJob(job.id, {
      status: 'COMPLETED',
      progress: 100,
      audio_url: audioUrl,
      subtitle_url: subtitleUrl,
      subtitle_final: subtitleSource || null,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      duration_sec: finalDuration,
      error_message: null,
    });
  } catch (error) {
    await updateJob(job.id, {
      status: 'FAILED',
      progress: 100,
      error_message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    });
    throw error;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const mode = process.argv[2] || 'once';
  do {
    const job = await getNextJob();
    if (!job) {
      if (mode === 'once') {
        console.log('대기 중인 영상 작업이 없습니다.');
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
      continue;
    }

    console.log(`영상 작업 처리 시작: ${job.id}`);
    try {
      await processJob(job);
      console.log(`영상 작업 처리 완료: ${job.id}`);
    } catch (error) {
      console.error(`영상 작업 처리 실패: ${job.id}`, error);
      if (mode === 'once') process.exitCode = 1;
    }
  } while (mode === 'watch');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
