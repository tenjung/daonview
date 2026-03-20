import {
  VIDEO_ALLOWED_AUDIO_TYPES,
  VIDEO_ALLOWED_IMAGE_TYPES,
  VIDEO_ALLOWED_VIDEO_TYPES,
  VIDEO_MAX_AUDIO_COUNT,
  VIDEO_MAX_AUDIO_SIZE_BYTES,
  VIDEO_MAX_IMAGE_COUNT,
  VIDEO_MAX_IMAGE_SIZE_BYTES,
  VIDEO_MAX_VIDEO_COUNT,
  VIDEO_MAX_VIDEO_SIZE_BYTES,
} from '@/lib/video/constants';
import type { PexelsSelectedAsset, VideoInputMode, VideoVoiceKey } from '@/types/video-assistant';

export interface ParsedVideoJobInput {
  title: string;
  script: string;
  inputMode: VideoInputMode;
  voice: VideoVoiceKey;
  audioFile: File | null;
  imageFiles: File[];
  videoFiles: File[];
  pexelsAssets: PexelsSelectedAsset[];
}

function coerceFiles(value: FormDataEntryValue[]): File[] {
  return value.filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function parsePexelsAssets(value: FormDataEntryValue[]): PexelsSelectedAsset[] {
  return value.flatMap((entry) => {
    if (typeof entry !== 'string') return [];

    try {
      const parsed = JSON.parse(entry) as PexelsSelectedAsset;
      if (!parsed?.id || !parsed?.sourceUrl || !parsed?.previewUrl || (parsed.kind !== 'IMAGE' && parsed.kind !== 'VIDEO')) {
        return [];
      }
      return [parsed];
    } catch {
      return [];
    }
  });
}

export function parseVideoJobFormData(formData: FormData): ParsedVideoJobInput {
  const title = String(formData.get('title') || '').trim();
  const script = String(formData.get('script') || '').trim();
  const inputModeRaw = String(formData.get('inputMode') || 'SCRIPT_ONLY').trim().toUpperCase();
  const inputMode: VideoInputMode =
    inputModeRaw === 'MEDIA_AND_SCRIPT'
      ? 'MEDIA_AND_SCRIPT'
      : inputModeRaw === 'AUDIO_SUBTITLE'
        ? 'AUDIO_SUBTITLE'
        : 'SCRIPT_ONLY';
  const voiceRaw = String(formData.get('voice') || 'FEMALE_SOFT').trim().toUpperCase();
  const voice: VideoVoiceKey = voiceRaw === 'FEMALE_CLEAR' || voiceRaw === 'MALE_CALM' ? voiceRaw : 'FEMALE_SOFT';
  const audioFiles = coerceFiles(formData.getAll('audioFile'));
  const audioFile = audioFiles[0] || null;
  const imageFiles = coerceFiles(formData.getAll('imageFiles'));
  const videoFiles = coerceFiles(formData.getAll('videoFiles'));
  const pexelsAssets = parsePexelsAssets(formData.getAll('pexelsAssets'));

  if (inputMode !== 'AUDIO_SUBTITLE' && !script) {
    throw new Error('대본은 필수입니다.');
  }

  if (audioFiles.length > VIDEO_MAX_AUDIO_COUNT) {
    throw new Error(`오디오는 최대 ${VIDEO_MAX_AUDIO_COUNT}개까지 업로드할 수 있습니다.`);
  }

  if (imageFiles.length > VIDEO_MAX_IMAGE_COUNT) {
    throw new Error(`이미지는 최대 ${VIDEO_MAX_IMAGE_COUNT}개까지 업로드할 수 있습니다.`);
  }

  if (videoFiles.length > VIDEO_MAX_VIDEO_COUNT) {
    throw new Error(`영상은 최대 ${VIDEO_MAX_VIDEO_COUNT}개까지 업로드할 수 있습니다.`);
  }

  if (pexelsAssets.length > 5) {
    throw new Error('Pexels 추천 배경은 최대 5개까지 선택할 수 있습니다.');
  }

  for (const file of imageFiles) {
    if (!VIDEO_ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(`허용되지 않는 이미지 형식입니다: ${file.name}`);
    }
    if (file.size > VIDEO_MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`이미지 용량 제한을 초과했습니다: ${file.name}`);
    }
  }

  for (const file of videoFiles) {
    if (!VIDEO_ALLOWED_VIDEO_TYPES.includes(file.type)) {
      throw new Error(`허용되지 않는 영상 형식입니다: ${file.name}`);
    }
    if (file.size > VIDEO_MAX_VIDEO_SIZE_BYTES) {
      throw new Error(`영상 용량 제한을 초과했습니다: ${file.name}`);
    }
  }

  for (const file of audioFiles) {
    if (!VIDEO_ALLOWED_AUDIO_TYPES.includes(file.type as (typeof VIDEO_ALLOWED_AUDIO_TYPES)[number])) {
      throw new Error(`허용되지 않는 오디오 형식입니다: ${file.name}`);
    }
    if (file.size > VIDEO_MAX_AUDIO_SIZE_BYTES) {
      throw new Error(`오디오 용량 제한을 초과했습니다: ${file.name}`);
    }
  }

  if (inputMode === 'MEDIA_AND_SCRIPT' && imageFiles.length === 0 && videoFiles.length === 0 && pexelsAssets.length === 0) {
    throw new Error('미디어+대본 모드에서는 사진, 영상 파편 또는 추천 배경을 최소 1개 넣어야 합니다.');
  }

  if (inputMode === 'AUDIO_SUBTITLE' && !audioFile) {
    throw new Error('오디오 파일 자막 씌우기 모드에서는 음성 파일을 업로드해야 합니다.');
  }

  return {
    title,
    script,
    inputMode,
    voice,
    audioFile,
    imageFiles,
    videoFiles,
    pexelsAssets,
  };
}
