import type { AIQuota } from '@/types/aiQuota';

export const VIDEO_JOB_STATUSES = [
  'UPLOADING',
  'QUEUED',
  'PROCESSING_SCRIPT',
  'GENERATING_IMAGES',
  'PROCESSING_TTS',
  'PROCESSING_SUBTITLE',
  'RENDERING_VIDEO',
  'COMPLETED',
  'FAILED',
] as const;

export const VIDEO_INPUT_MODES = ['SCRIPT_ONLY', 'MEDIA_AND_SCRIPT', 'AUDIO_SUBTITLE'] as const;
export const VIDEO_ASSET_TYPES = ['IMAGE', 'VIDEO', 'AUDIO'] as const;
export const VIDEO_SERVICE_TYPES = ['SHORTS_AUTO'] as const;
export const VIDEO_ASPECT_RATIOS = ['VERTICAL_9_16'] as const;
export const VIDEO_VOICE_KEYS = ['FEMALE_SOFT', 'FEMALE_CLEAR', 'MALE_CALM'] as const;

export type VideoJobStatus = (typeof VIDEO_JOB_STATUSES)[number];
export type VideoInputMode = (typeof VIDEO_INPUT_MODES)[number];
export type VideoAssetType = (typeof VIDEO_ASSET_TYPES)[number];
export type VideoServiceType = (typeof VIDEO_SERVICE_TYPES)[number];
export type VideoAspectRatio = (typeof VIDEO_ASPECT_RATIOS)[number];
export type VideoVoiceKey = (typeof VIDEO_VOICE_KEYS)[number];
export type VideoChapterStatus = 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface PexelsSelectedAsset {
  id: string;
  kind: Extract<VideoAssetType, 'IMAGE' | 'VIDEO'>;
  title: string;
  previewUrl: string;
  sourceUrl: string;
  width?: number | null;
  height?: number | null;
  durationSec?: number | null;
}

export interface VideoJobAsset {
  id: string;
  job_id: string;
  asset_type: VideoAssetType;
  storage_path: string;
  sort_order: number;
  duration_sec?: number | null;
  created_at?: string;
}

export interface VideoJobChapter {
  id: string;
  job_id: string;
  chapter_index: number;
  chapter_title?: string | null;
  narration: string;
  visual_summary?: string | null;
  image_prompt: string;
  motion_prompt?: string | null;
  status: VideoChapterStatus;
  image_url?: string | null;
  storage_path?: string | null;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VideoJob {
  id: string;
  user_id: string;
  service_type: VideoServiceType;
  input_mode: VideoInputMode;
  title?: string | null;
  script: string;
  voice: VideoVoiceKey;
  status: VideoJobStatus;
  progress: number;
  error_message?: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  subtitle_url?: string | null;
  subtitle_draft?: string | null;
  subtitle_final?: string | null;
  thumbnail_url?: string | null;
  duration_sec?: number | null;
  aspect_ratio: VideoAspectRatio;
  created_at?: string;
  updated_at?: string;
  assets?: VideoJobAsset[];
  chapters?: VideoJobChapter[];
}

export interface CreateVideoJobResponse {
  job: VideoJob;
  quota: AIQuota;
}

export interface VideoQuotaResponse {
  video: AIQuota;
}
