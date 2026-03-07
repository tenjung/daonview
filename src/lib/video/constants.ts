export const VIDEO_SOURCE_BUCKET = 'video-source-assets';
export const VIDEO_GENERATED_BUCKET = 'video-generated-assets';
export const VIDEO_DAILY_LIMIT = 2;
export const VIDEO_MAX_CHAPTER_COUNT = 4;
export const VIDEO_MAX_IMAGE_COUNT = 10;
export const VIDEO_MAX_VIDEO_COUNT = 5;
export const VIDEO_MAX_AUDIO_COUNT = 1;
export const VIDEO_MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const VIDEO_MAX_VIDEO_SIZE_BYTES = 150 * 1024 * 1024;
export const VIDEO_MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024;
export const VIDEO_ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const VIDEO_ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
export const VIDEO_ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
] as const;
export const VIDEO_OUTPUT_WIDTH = 1080;
export const VIDEO_OUTPUT_HEIGHT = 1920;
export const VIDEO_OUTPUT_FPS = 30;
export const VIDEO_CHAPTER_IMAGE_WIDTH = 1080;
export const VIDEO_CHAPTER_IMAGE_HEIGHT = 1920;
export const VIDEO_TEMPLATE_BACKGROUNDS = [
  '#101828',
  '#1D2939',
  '#182230',
  '#0B1020',
  '#1F2937',
] as const;

export const VIDEO_VOICE_OPTIONS = [
  { key: 'FEMALE_SOFT', label: '부드러운 여성', openAiVoice: 'nova' },
  { key: 'FEMALE_CLEAR', label: '선명한 여성', openAiVoice: 'shimmer' },
  { key: 'MALE_CALM', label: '차분한 남성', openAiVoice: 'echo' },
] as const;

export const VIDEO_DEFAULT_VOICE_KEY = 'FEMALE_SOFT';
