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
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const VIDEO_FPS = 30;
const IMAGE_TARGET_SEGMENT_DURATION = 3;
const SEGMENT_TRANSITION_DURATION = 0.35;
const SUBTITLE_FONTS_DIR = process.env.SUBTITLE_FONTS_DIR || `${process.env.HOME || ''}/Library/Fonts`;
const ASS_FONT_NAME = 'Dovemayo_gothic';
const ASS_FONT_SIZE = 112;
const ASS_MARGIN_V = 110;
const ASS_OUTLINE = 5;
const ASS_BACK_COLOUR = '&H55000000';
const ASS_PRIMARY_COLOUR = '&H00FFFFFF';
const ASS_OUTLINE_COLOUR = '&H00111111';
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
    '-vf', `scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=increase,crop=${VIDEO_WIDTH}:${VIDEO_HEIGHT},fps=${VIDEO_FPS},format=yuv420p`,
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    outputPath,
  ]);
  return getDuration(outputPath);
}

async function createImageSegment(inputPath, outputPath, duration) {
  const frameCount = Math.max(1, Math.round(duration * VIDEO_FPS));
  const maxZoom = 1.08;
  const zoomStep = Math.max(0.00015, (maxZoom - 1) / frameCount);
  await run(ffmpegPath, [
    '-y',
    '-i', inputPath,
    '-frames:v', String(frameCount),
    '-vf', [
      `scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=increase`,
      `crop=${VIDEO_WIDTH}:${VIDEO_HEIGHT}`,
      `zoompan=z='min(1+on*${zoomStep.toFixed(6)},${maxZoom})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frameCount}:s=${VIDEO_WIDTH}x${VIDEO_HEIGHT}:fps=${VIDEO_FPS}`,
      `trim=duration=${duration},setpts=PTS-STARTPTS`,
      'format=yuv420p',
    ].join(','),
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    outputPath,
  ]);
  return getDuration(outputPath);
}

async function createTemplateSegment(outputPath, duration, color) {
  await run(ffmpegPath, [
    '-y',
    '-f', 'lavfi',
    '-i', `color=${color}:s=${VIDEO_WIDTH}x${VIDEO_HEIGHT}:d=${duration}`,
    '-vf', `fps=${VIDEO_FPS},format=yuv420p`,
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    outputPath,
  ]);
  return duration;
}

async function combineSegments(segmentPaths, segmentDurations, outputPath) {
  if (segmentPaths.length === 0) {
    throw new Error('합칠 영상 세그먼트가 없습니다.');
  }

  if (segmentPaths.length === 1) {
    await run(ffmpegPath, ['-y', '-i', segmentPaths[0], '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', outputPath]);
    return;
  }

  const transitionDuration = Math.min(
    SEGMENT_TRANSITION_DURATION,
    ...segmentDurations.map((duration) => Math.max(0.05, duration / 4))
  );
  const inputArgs = segmentPaths.flatMap((path) => ['-i', path]);
  let cumulativeDuration = segmentDurations[0];
  let filter = `[0:v][1:v]xfade=transition=fade:duration=${transitionDuration}:offset=${Math.max(0, cumulativeDuration - transitionDuration)}[v1]`;

  for (let index = 2; index < segmentPaths.length; index += 1) {
    cumulativeDuration += segmentDurations[index - 1] - transitionDuration;
    filter += `;[v${index - 1}][${index}:v]xfade=transition=fade:duration=${transitionDuration}:offset=${Math.max(0, cumulativeDuration - transitionDuration)}[v${index}]`;
  }

  const finalLabel = `v${segmentPaths.length - 1}`;
  await run(ffmpegPath, [
    '-y',
    ...inputArgs,
    '-filter_complex', `${filter};[${finalLabel}]format=yuv420p[video]`,
    '-map', '[video]',
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
    outputPath,
  ]);
}

function buildImageSegmentPlan(imageAssets, remainingDuration) {
  if (!imageAssets.length || remainingDuration <= 0) return [];

  const totalSegments = Math.max(
    imageAssets.length,
    Math.ceil(remainingDuration / IMAGE_TARGET_SEGMENT_DURATION)
  );
  const segmentDuration = remainingDuration / totalSegments;

  return Array.from({ length: totalSegments }, (_, index) => ({
    asset: imageAssets[index % imageAssets.length],
    duration: index === totalSegments - 1
      ? Math.max(0.05, remainingDuration - segmentDuration * (totalSegments - 1))
      : segmentDuration,
  }));
}

function escapeFilterPath(value) {
  return value
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/'/g, "\\'");
}

function srtTimeToAss(value) {
  const [timePart, msPart = '000'] = value.trim().split(',');
  const [hours = '00', minutes = '00', seconds = '00'] = timePart.split(':');
  const centiseconds = Math.round(Number(msPart) / 10)
    .toString()
    .padStart(2, '0');
  return `${Number(hours)}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}.${centiseconds}`;
}

function normalizeAssText(text) {
  const source = text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
  const wrappedLines = [];
  let remaining = source;

  while (remaining.length > 22) {
    wrappedLines.push(remaining.slice(0, 22).trim());
    remaining = remaining.slice(22).trim();
  }
  if (remaining) {
    wrappedLines.push(remaining);
  }

  return wrappedLines.join('\n');
}

function serializeAssText(text) {
  return normalizeAssText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\\N')
    .replace(/[{}]/g, '')
    .replace(/\\/g, '\\\\');
}

function convertSrtToAss(subtitleText) {
  const blocks = subtitleText
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const events = blocks.flatMap((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const timeLine = lines[1].includes('-->') ? lines[1] : lines[0];
    const textLines = lines[1].includes('-->') ? lines.slice(2) : lines.slice(1);
    const [startRaw, endRaw] = timeLine.split('-->').map((part) => part.trim());
    if (!startRaw || !endRaw || textLines.length === 0) return [];

    return [
      `Dialogue: 0,${srtTimeToAss(startRaw)},${srtTimeToAss(endRaw)},Default,,0,0,0,,${serializeAssText(textLines.join('\n'))}`,
    ];
  });

  return [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${VIDEO_WIDTH}`,
    `PlayResY: ${VIDEO_HEIGHT}`,
    '',
    '[V4+ Styles]',
    'Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding',
    `Style: Default,${ASS_FONT_NAME},${ASS_FONT_SIZE},${ASS_PRIMARY_COLOUR},${ASS_PRIMARY_COLOUR},${ASS_OUTLINE_COLOUR},${ASS_BACK_COLOUR},0,0,0,0,100,100,0,0,1,${ASS_OUTLINE},0,2,60,60,${ASS_MARGIN_V},1`,
    '',
    '[Events]',
    'Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text',
    ...events,
    '',
  ].join('\n');
}

async function renderFinalVideo(visualPath, audioPath, subtitlePath, outputPath) {
  const assPath = subtitlePath.replace(/\.srt$/i, '.ass');
  await writeFile(assPath, Buffer.from(convertSrtToAss(await readFile(subtitlePath, 'utf8')), 'utf8'));
  const safeSubtitlePath = escapeFilterPath(assPath);
  const safeFontsDir = SUBTITLE_FONTS_DIR ? escapeFilterPath(SUBTITLE_FONTS_DIR) : '';
  const subtitleFilter = [
    `filename=${safeSubtitlePath}`,
    safeFontsDir ? `fontsdir=${safeFontsDir}` : '',
  ].filter(Boolean).join(':');
  await run(ffmpegPath, [
    '-y',
    '-i', visualPath,
    '-i', audioPath,
    '-vf', `subtitles=${subtitleFilter},format=yuv420p`,
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
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
    const segmentDurations = [];
    let builtDuration = 0;
    let segmentIndex = 0;

    for (const asset of assets.filter((item) => item.asset_type === 'VIDEO')) {
      if (builtDuration >= audioDuration) break;
      const sourcePath = join(tempDir, `${segmentIndex}-${asset.storage_path.split('/').pop()}`);
      const outputPath = join(tempDir, `${segmentIndex}-video.mp4`);
      await downloadAsset(asset.storage_path, sourcePath);
      const duration = await createVideoSegment(sourcePath, outputPath);
      segmentPaths.push(outputPath);
      segmentDurations.push(duration);
      builtDuration += duration;
      segmentIndex += 1;
    }

    const imageAssets = assets.filter((item) => item.asset_type === 'IMAGE');
    const imageSegmentPlan = buildImageSegmentPlan(imageAssets, Math.max(0, audioDuration - builtDuration));
    for (const plan of imageSegmentPlan) {
      if (builtDuration >= audioDuration) break;
      const asset = plan.asset;
      const segmentDuration = Math.min(plan.duration, Math.max(0.05, audioDuration - builtDuration));
      const sourcePath = join(tempDir, `${segmentIndex}-${asset.storage_path.split('/').pop()}`);
      const outputPath = join(tempDir, `${segmentIndex}-image.mp4`);
      await downloadAsset(asset.storage_path, sourcePath);
      const duration = await createImageSegment(sourcePath, outputPath, segmentDuration);
      segmentPaths.push(outputPath);
      segmentDurations.push(duration);
      builtDuration += duration;
      segmentIndex += 1;
    }

    if (builtDuration < audioDuration) {
      const fallbackDuration = Math.max(0.5, audioDuration - builtDuration);
      const outputPath = join(tempDir, `${segmentIndex}-template.mp4`);
      await createTemplateSegment(outputPath, fallbackDuration, '#101828');
      segmentPaths.push(outputPath);
      segmentDurations.push(fallbackDuration);
      builtDuration += fallbackDuration;
    }

    if (segmentPaths.length === 0) {
      const outputPath = join(tempDir, `${segmentIndex}-template.mp4`);
      await createTemplateSegment(outputPath, audioDuration, '#101828');
      segmentPaths.push(outputPath);
      segmentDurations.push(audioDuration);
    }

    const visualPath = join(tempDir, 'visual.mp4');
    await combineSegments(segmentPaths, segmentDurations, visualPath);

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
