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
const OPENAI_CHAT_MODEL = process.env.OPENAI_VIDEO_STORYBOARD_MODEL || 'gpt-4o-mini';
const COMFYUI_BASE_URL = String(process.env.COMFYUI_BASE_URL || 'http://127.0.0.1:8188').replace(/\/+$/, '');
const COMFYUI_WORKFLOW_PATH = process.env.COMFYUI_WORKFLOW_PATH || '';
const COMFYUI_TIMEOUT_MS = Number.parseInt(process.env.COMFYUI_TIMEOUT_MS || '180000', 10);
const COMFYUI_NEGATIVE_PROMPT = process.env.COMFYUI_NEGATIVE_PROMPT
  || 'text, caption, watermark, logo, low quality, blurry, distorted face, extra fingers, duplicated objects, deformed hands';
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const VIDEO_FPS = 30;
const MAX_CHAPTER_COUNT = 4;
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

async function getChapters(jobId) {
  const { data, error } = await supabase
    .from('ai_video_job_chapters')
    .select('*')
    .eq('job_id', jobId)
    .order('chapter_index', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

async function replaceChapters(jobId, chapters) {
  const { error: deleteError } = await supabase.from('ai_video_job_chapters').delete().eq('job_id', jobId);
  if (deleteError) throw new Error(deleteError.message);
  if (!chapters.length) return [];

  const { data, error } = await supabase
    .from('ai_video_job_chapters')
    .insert(chapters.map((chapter) => ({ job_id: jobId, ...chapter })))
    .select('*');
  if (error) throw new Error(error.message);
  return (data || []).sort((a, b) => a.chapter_index - b.chapter_index);
}

async function updateChapter(id, patch) {
  const { data, error } = await supabase
    .from('ai_video_job_chapters')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

function normalizeLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function tryParseHeadingSections(script) {
  const lines = String(script || '').replace(/\r/g, '').split('\n');
  const sections = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      if (current && (current.narration || current.visualSummary)) sections.push(current);
      current = {
        title: normalizeLine(line.replace(/^#+\s*/, '')),
        narration: '',
        visualSummary: '',
      };
      continue;
    }
    if (!current) {
      current = { title: '', narration: '', visualSummary: '' };
    }

    if (/^대사\s*:/i.test(line)) {
      current.narration = normalizeLine(line.replace(/^대사\s*:/i, ''));
      continue;
    }
    if (/^\(.*\)$/.test(line) || /^화면\s*:/i.test(line)) {
      current.visualSummary = normalizeLine(line.replace(/^\(|\)$/g, '').replace(/^화면\s*:/i, ''));
      continue;
    }
    current.narration = normalizeLine(`${current.narration} ${line}`);
  }

  if (current && (current.narration || current.visualSummary)) sections.push(current);
  return sections.slice(0, MAX_CHAPTER_COUNT);
}

function parseJsonPayload(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('JSON 응답을 파싱하지 못했습니다.');
    }
    return JSON.parse(match[0]);
  }
}

async function generateStoryboard(job) {
  const headingSections = tryParseHeadingSections(job.script);
  const seedSections = headingSections.length > 0 ? headingSections : null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_CHAT_MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            '너는 한국어 쇼츠 대본을 영상 제작용 챕터와 이미지 프롬프트로 바꾸는 편집 디렉터다.',
            `챕터는 최대 ${MAX_CHAPTER_COUNT}개다.`,
            '반드시 JSON만 반환한다.',
            '각 imagePrompt는 영어로 작성한다.',
            '프롬프트에는 cinematic still, commercial lighting, realistic photo, vertical 9:16, korean ad style, no text, no watermark 를 반영한다.',
            'chapterTitle과 narration은 한국어로 유지한다.',
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify({
            title: job.title || '',
            script: job.script,
            preferredChapterCount: seedSections?.length || MAX_CHAPTER_COUNT,
            sections: seedSections,
            outputShape: {
              chapters: [
                {
                  chapterIndex: 1,
                  chapterTitle: 'string',
                  narration: 'string',
                  visualSummary: 'string',
                  imagePrompt: 'string',
                },
              ],
            },
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`스토리보드 생성 실패: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('스토리보드 응답이 비어 있습니다.');
  }

  const payload = parseJsonPayload(content);
  const chapters = Array.isArray(payload?.chapters) ? payload.chapters : [];
  const normalized = chapters
    .slice(0, MAX_CHAPTER_COUNT)
    .map((chapter, index) => ({
      chapter_index: index + 1,
      chapter_title: normalizeLine(chapter.chapterTitle || chapter.chapter_title || `챕터 ${index + 1}`),
      narration: normalizeLine(chapter.narration || ''),
      visual_summary: normalizeLine(chapter.visualSummary || chapter.visual_summary || ''),
      image_prompt: normalizeLine(chapter.imagePrompt || chapter.image_prompt || ''),
      motion_prompt: null,
      status: 'QUEUED',
    }))
    .filter((chapter) => chapter.narration && chapter.image_prompt);

  if (normalized.length === 0) {
    throw new Error('스토리보드 챕터를 생성하지 못했습니다.');
  }

  return normalized;
}

let comfyWorkflowTemplateCache = null;

async function loadComfyWorkflowTemplate() {
  if (!COMFYUI_WORKFLOW_PATH) {
    throw new Error('COMFYUI_WORKFLOW_PATH가 설정되지 않았습니다.');
  }
  if (!comfyWorkflowTemplateCache) {
    comfyWorkflowTemplateCache = JSON.parse(await readFile(COMFYUI_WORKFLOW_PATH, 'utf8'));
  }
  return JSON.parse(JSON.stringify(comfyWorkflowTemplateCache));
}

function replaceTemplateTokens(value, tokens) {
  if (Array.isArray(value)) {
    return value.map((item) => replaceTemplateTokens(item, tokens));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, replaceTemplateTokens(entry, tokens)]));
  }
  if (typeof value !== 'string') {
    return value;
  }

  if (/^\{\{[A-Z0-9_]+\}\}$/.test(value)) {
    const tokenKey = value.slice(2, -2);
    return Object.prototype.hasOwnProperty.call(tokens, tokenKey) ? tokens[tokenKey] : value;
  }

  let next = value;
  for (const [tokenKey, tokenValue] of Object.entries(tokens)) {
    next = next.split(`{{${tokenKey}}}`).join(String(tokenValue));
  }
  return next;
}

async function queueComfyPrompt(workflow) {
  const response = await fetch(`${COMFYUI_BASE_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });

  if (!response.ok) {
    throw new Error(`ComfyUI 프롬프트 등록 실패: ${await response.text()}`);
  }

  const data = await response.json();
  if (!data?.prompt_id) {
    throw new Error('ComfyUI prompt_id를 받지 못했습니다.');
  }

  return data.prompt_id;
}

function extractComfyImageMeta(historyEntry) {
  const outputs = historyEntry?.outputs || {};
  for (const output of Object.values(outputs)) {
    if (Array.isArray(output?.images) && output.images.length > 0) {
      return output.images[0];
    }
  }
  return null;
}

async function waitForComfyImage(promptId) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < COMFYUI_TIMEOUT_MS) {
    const response = await fetch(`${COMFYUI_BASE_URL}/history/${promptId}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`ComfyUI history 조회 실패: ${await response.text()}`);
    }

    const data = await response.json();
    const historyEntry = data?.[promptId] || data;
    const imageMeta = extractComfyImageMeta(historyEntry);
    if (imageMeta) {
      return imageMeta;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error('ComfyUI 이미지 생성 대기 시간이 초과되었습니다.');
}

async function downloadComfyImage(imageMeta) {
  const params = new URLSearchParams({
    filename: imageMeta.filename,
    type: imageMeta.type || 'output',
  });
  if (imageMeta.subfolder) {
    params.set('subfolder', imageMeta.subfolder);
  }

  const response = await fetch(`${COMFYUI_BASE_URL}/view?${params.toString()}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`ComfyUI 이미지 다운로드 실패: ${await response.text()}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function generateChapterImage(job, chapter, chapterNumber) {
  const workflowTemplate = await loadComfyWorkflowTemplate();
  const workflow = replaceTemplateTokens(workflowTemplate, {
    PROMPT: chapter.image_prompt,
    NEGATIVE_PROMPT: COMFYUI_NEGATIVE_PROMPT,
    WIDTH: VIDEO_WIDTH,
    HEIGHT: VIDEO_HEIGHT,
    SEED: Math.floor(Math.random() * 2147483647),
    OUTPUT_PREFIX: `daonview_${job.id}_chapter_${String(chapterNumber).padStart(2, '0')}`,
  });

  const promptId = await queueComfyPrompt(workflow);
  const imageMeta = await waitForComfyImage(promptId);
  const buffer = await downloadComfyImage(imageMeta);

  return {
    buffer,
    contentType: 'image/png',
  };
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
    throw new Error(`생성 파일 다운로드 실패: ${response.status}`);
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
  return {
    path,
    publicUrl: data.publicUrl,
  };
}

async function resolvePlannedImageSource(asset, tempDir, segmentIndex) {
  if (asset.localPath) {
    return asset.localPath;
  }

  if (asset.image_url) {
    const targetPath = join(tempDir, `${segmentIndex}-chapter-${asset.chapter_index || segmentIndex}.png`);
    await writeFile(targetPath, await downloadPublicFile(asset.image_url));
    return targetPath;
  }

  const targetPath = join(tempDir, `${segmentIndex}-${asset.storage_path.split('/').pop()}`);
  await downloadAsset(asset.storage_path, targetPath);
  return targetPath;
}

async function processJob(job) {
  const tempDir = await mkdtemp(join(tmpdir(), `daon-video-${job.id}-`));
  try {
    const assets = await getAssets(job.id);
    let chapters = await getChapters(job.id);
    const generatedImageAssets = [];
    let audioPath = join(tempDir, 'narration.mp3');
    let audioBuffer;
    let audioOutputFileName = 'narration.mp3';
    let audioContentType = 'audio/mpeg';
    const subtitleSource = String(job.subtitle_final || '').trim();
    const isRerender = Boolean(subtitleSource && job.audio_url);

    if (!isRerender && job.input_mode === 'SCRIPT_ONLY' && assets.length === 0) {
      await updateJob(job.id, { status: 'PROCESSING_SCRIPT', progress: 8, error_message: null });
      const storyboard = await generateStoryboard(job);
      chapters = await replaceChapters(job.id, storyboard);
      await updateJob(job.id, { status: 'GENERATING_IMAGES', progress: 18, error_message: null });

      for (const [index, chapter] of chapters.entries()) {
        await updateChapter(chapter.id, { status: 'GENERATING', error_message: null });
        try {
          const generated = await generateChapterImage(job, chapter, index + 1);
          const fileName = `chapter-${String(index + 1).padStart(2, '0')}.png`;
          const localPath = join(tempDir, fileName);
          await writeFile(localPath, generated.buffer);
          const uploaded = await uploadGenerated(job, localPath, fileName, generated.contentType);
          await updateChapter(chapter.id, {
            status: 'COMPLETED',
            image_url: uploaded.publicUrl,
            storage_path: uploaded.path,
            error_message: null,
          });
          generatedImageAssets.push({
            chapter_index: chapter.chapter_index,
            image_url: uploaded.publicUrl,
            localPath,
          });
          await updateJob(job.id, {
            status: 'GENERATING_IMAGES',
            progress: 18 + Math.round(((index + 1) / chapters.length) * 22),
            error_message: null,
          });
        } catch (chapterError) {
          await updateChapter(chapter.id, {
            status: 'FAILED',
            error_message: chapterError instanceof Error ? chapterError.message : '챕터 이미지 생성 실패',
          });
          throw chapterError;
        }
      }
    }

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

    const imageAssets = [
      ...assets.filter((item) => item.asset_type === 'IMAGE'),
      ...generatedImageAssets,
      ...(!generatedImageAssets.length
        ? chapters.filter((chapter) => chapter.image_url).map((chapter) => ({
            chapter_index: chapter.chapter_index,
            image_url: chapter.image_url,
          }))
        : []),
    ];
    const imageSegmentPlan = buildImageSegmentPlan(imageAssets, Math.max(0, audioDuration - builtDuration));
    for (const plan of imageSegmentPlan) {
      if (builtDuration >= audioDuration) break;
      const asset = plan.asset;
      const segmentDuration = Math.min(plan.duration, Math.max(0.05, audioDuration - builtDuration));
      const sourcePath = await resolvePlannedImageSource(asset, tempDir, segmentIndex);
      const outputPath = join(tempDir, `${segmentIndex}-image.mp4`);
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

    const [audioUpload, subtitleUpload, videoUpload, thumbnailUpload] = await Promise.all([
      uploadGenerated(job, audioPath, audioOutputFileName, audioContentType),
      uploadGenerated(job, subtitlePath, 'subtitle.srt', 'application/x-subrip'),
      uploadGenerated(job, finalPath, 'final.mp4', 'video/mp4'),
      uploadGenerated(job, thumbnailPath, 'thumbnail.jpg', 'image/jpeg'),
    ]);

    const finalDuration = await getDuration(finalPath);
    await updateJob(job.id, {
      status: 'COMPLETED',
      progress: 100,
      audio_url: audioUpload.publicUrl,
      subtitle_url: subtitleUpload.publicUrl,
      subtitle_final: subtitleSource || null,
      video_url: videoUpload.publicUrl,
      thumbnail_url: thumbnailUpload.publicUrl,
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
