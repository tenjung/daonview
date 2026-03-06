'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileAudio, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { MediaUploader } from '@/components/ai-service/video-assistant/MediaUploader';
import { PexelsAssetPicker } from '@/components/ai-service/video-assistant/PexelsAssetPicker';
import type { AIQuota } from '@/types/aiQuota';
import type { PexelsSelectedAsset, VideoVoiceKey } from '@/types/video-assistant';

interface AudioSubtitleFormProps {
  quota: AIQuota | null;
  isSubmitting: boolean;
  resetToken?: number;
  onDirtyChange?: (isDirty: boolean) => void;
  onSubmit: (payload: {
    title: string;
    script: string;
    inputMode: 'AUDIO_SUBTITLE';
    voice: VideoVoiceKey;
    audioFile: File | null;
    imageFiles: File[];
    videoFiles: File[];
    pexelsAssets: PexelsSelectedAsset[];
  }) => Promise<void>;
}

export function AudioSubtitleForm({ quota, isSubmitting, resetToken = 0, onDirtyChange, onSubmit }: AudioSubtitleFormProps) {
  const [title, setTitle] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [selectedPexelsAssets, setSelectedPexelsAssets] = useState<PexelsSelectedAsset[]>([]);
  const isLimitReached = useMemo(() => Boolean(quota && !quota.unlimited && quota.count >= quota.limit), [quota]);
  const totalBackgroundCount = imageFiles.length + videoFiles.length + selectedPexelsAssets.length;
  const isDirty = useMemo(
    () =>
      Boolean(
        title.trim()
        || audioFile
        || imageFiles.length > 0
        || videoFiles.length > 0
        || selectedPexelsAssets.length > 0
      ),
    [audioFile, imageFiles.length, selectedPexelsAssets.length, title, videoFiles.length]
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    setTitle('');
    setAudioFile(null);
    setImageFiles([]);
    setVideoFiles([]);
    setSelectedPexelsAssets([]);
  }, [resetToken]);

  const submit = async () => {
    if (!audioFile) {
      toast.error('오디오 파일을 업로드해야 합니다.');
      return;
    }
    if (isLimitReached) {
      toast.error('일일 영상 제작 제한 횟수를 모두 소모했습니다.');
      return;
    }

    await onSubmit({
      title,
      script: '',
      inputMode: 'AUDIO_SUBTITLE',
      voice: 'FEMALE_SOFT',
      audioFile,
      imageFiles,
      videoFiles,
      pexelsAssets: selectedPexelsAssets,
    });
  };

  return (
    <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary/55">오디오 자막 스튜디오</p>
          <h3 className="mt-2 text-3xl font-black leading-tight text-text-main">기존 음성 파일을 바로 자막 영상으로 바꾸세요</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
            이미 만든 MP3, WAV, M4A, AAC가 있다면 다시 대본을 쓰지 마세요. 음성을 기준으로 자막을 추출하고 세로 영상으로 바로 변환합니다.
          </p>
        </div>
        {quota && (
          <span className={`inline-flex rounded-full px-4 py-2 text-xs font-black ${quota.unlimited ? 'bg-emerald-50 text-emerald-700' : isLimitReached ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'}`}>
            {quota.unlimited ? '관리자 무제한 이용' : `금일 잔여 ${Math.max(0, quota.limit - quota.count)} / ${quota.limit}`}
          </span>
        )}
      </div>

      <div className="mt-8 space-y-6">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <label className="mb-2 block text-sm font-bold text-text-main">작업명 (선택)</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 인터뷰 음성 자막본"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">작동 방식</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-text-secondary">
              업로드한 오디오를 기준으로 자막을 만들고, 배경 영상이나 이미지가 있으면 먼저 반영합니다. 없으면 기본 세로 배경으로 마감합니다.
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold leading-relaxed text-text-secondary">
            이 서비스는 음성 파일 후처리 전용입니다. 배경음이 있어도 음성이 분명하면 자막을 뽑을 수 있고, 결과로 MP4와 SRT를 함께 제공합니다. 배경 소스는 직접 올리거나 Pexels 추천에서 골라 붙일 수 있습니다.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-5">
          {!audioFile ? (
            <div className="rounded-[1.3rem] border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                    <FileAudio size={24} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500">
                        오디오 파일 필요
                      </span>
                    </div>
                    <p className="mt-2 text-base font-black text-text-main">오디오 파일을 업로드하세요</p>
                    <p className="mt-1 text-sm font-semibold text-text-secondary">
                      MP3, WAV, M4A, AAC 업로드 가능. 음악보다 음성이 또렷할수록 자막 정확도가 올라갑니다.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-text-main transition-colors hover:border-primary hover:text-primary">
                    파일 선택
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/aac"
                      className="hidden"
                      onChange={(event) => setAudioFile(event.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.3rem] border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                    <FileAudio size={24} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                        오디오 업로드 완료
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500">
                        {audioFile.name.split('.').pop()?.toUpperCase() || 'AUDIO'}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-black text-text-main">{audioFile.name}</p>
                    <p className="mt-1 text-sm font-semibold text-text-secondary">
                      이 파일을 기준으로 자막을 추출하고 세로 영상으로 변환합니다.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-text-main transition-colors hover:border-primary hover:text-primary">
                    파일 교체
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/aac"
                      className="hidden"
                      onChange={(event) => setAudioFile(event.target.files?.[0] || null)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setAudioFile(null)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-500 transition-colors hover:border-primary hover:text-primary"
                  >
                    파일 제거
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <MediaUploader
            files={videoFiles}
            onChange={setVideoFiles}
            accept="video/mp4,video/quicktime,video/webm"
            label="배경 영상 업로드 (선택)"
            helperText="세로 영상이 가장 안정적입니다. 길이가 부족하면 다른 영상·이미지와 이어붙이고, 그래도 부족하면 기본 배경으로 보강합니다."
            maxFiles={5}
            kind="VIDEO"
          />
          <MediaUploader
            files={imageFiles}
            onChange={setImageFiles}
            accept="image/*"
            label="배경 이미지 업로드 (선택)"
            helperText="영상이 부족할 때 이미지가 슬라이드처럼 들어갑니다. 최대 10개까지 올릴 수 있습니다."
            maxFiles={10}
            kind="IMAGE"
          />
        </div>

        <PexelsAssetPicker
          selectedAssets={selectedPexelsAssets}
          onSelectedAssetsChange={setSelectedPexelsAssets}
          totalBackgroundCount={totalBackgroundCount}
        />

        <button
          type="button"
          onClick={submit}
          disabled={isSubmitting || isLimitReached}
          className="inline-flex w-full items-center justify-center rounded-[1.6rem] bg-primary px-5 py-4 text-base font-black text-white shadow-[0_16px_36px_rgba(235,2,112,0.22)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Sparkles size={18} className="mr-2" />}
          오디오 자막 영상 생성 요청
        </button>
      </div>

    </div>
  );
}
