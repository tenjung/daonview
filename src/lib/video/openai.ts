import { VIDEO_DEFAULT_VOICE_KEY, VIDEO_VOICE_OPTIONS } from '@/lib/video/constants';
import type { VideoVoiceKey } from '@/types/video-assistant';

const OPENAI_API_URL = 'https://api.openai.com/v1';

function getApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  return apiKey;
}

function resolveOpenAiVoice(voice: VideoVoiceKey) {
  return VIDEO_VOICE_OPTIONS.find((option) => option.key === voice)?.openAiVoice
    || VIDEO_VOICE_OPTIONS.find((option) => option.key === VIDEO_DEFAULT_VOICE_KEY)?.openAiVoice
    || 'nova';
}

export async function synthesizeSpeech(script: string, voice: VideoVoiceKey = VIDEO_DEFAULT_VOICE_KEY) {
  const response = await fetch(`${OPENAI_API_URL}/audio/speech`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: resolveOpenAiVoice(voice),
      input: script,
      format: 'mp3',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TTS 생성 실패: ${text}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function createSrtFromAudio(audioBuffer: Buffer) {
  const formData = new FormData();
  formData.append('file', new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mpeg' }), 'narration.mp3');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'srt');
  formData.append('language', 'ko');

  const response = await fetch(`${OPENAI_API_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`자막 생성 실패: ${text}`);
  }

  return Buffer.from(await response.text(), 'utf8');
}
