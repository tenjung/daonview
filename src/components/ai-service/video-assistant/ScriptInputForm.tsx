'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { MediaUploader } from '@/components/ai-service/video-assistant/MediaUploader';
import { PexelsAssetPicker } from '@/components/ai-service/video-assistant/PexelsAssetPicker';
import { VIDEO_VOICE_OPTIONS } from '@/lib/video/constants';
import type { AIQuota } from '@/types/aiQuota';
import type { PexelsSelectedAsset, VideoInputMode, VideoVoiceKey } from '@/types/video-assistant';

interface ScriptInputFormProps {
  quota: AIQuota | null;
  isSubmitting: boolean;
  resetToken?: number;
  onDirtyChange?: (isDirty: boolean) => void;
  onSubmit: (payload: { title: string; script: string; inputMode: VideoInputMode; voice: VideoVoiceKey; audioFile: File | null; imageFiles: File[]; videoFiles: File[]; pexelsAssets: PexelsSelectedAsset[] }) => Promise<void>;
}

export function ScriptInputForm({ quota, isSubmitting, resetToken = 0, onDirtyChange, onSubmit }: ScriptInputFormProps) {
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');
  const [tab, setTab] = useState<Extract<VideoInputMode, 'MEDIA_AND_SCRIPT' | 'SCRIPT_ONLY'>>('MEDIA_AND_SCRIPT');
  const [voice, setVoice] = useState<VideoVoiceKey>('FEMALE_SOFT');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [selectedPexelsAssets, setSelectedPexelsAssets] = useState<PexelsSelectedAsset[]>([]);
  const handleTabChange = (value: string) => {
    setTab(value === 'SCRIPT_ONLY' ? 'SCRIPT_ONLY' : 'MEDIA_AND_SCRIPT');
  };

  const isLimitReached = useMemo(() => Boolean(quota && !quota.unlimited && quota.count >= quota.limit), [quota]);
  const isDirty = useMemo(
    () =>
      Boolean(
        title.trim()
        || script.trim()
        || tab !== 'MEDIA_AND_SCRIPT'
        || voice !== 'FEMALE_SOFT'
        || imageFiles.length > 0
        || videoFiles.length > 0
        || selectedPexelsAssets.length > 0
      ),
    [imageFiles.length, script, selectedPexelsAssets.length, tab, title, videoFiles.length, voice]
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    setTitle('');
    setScript('');
    setTab('MEDIA_AND_SCRIPT');
    setVoice('FEMALE_SOFT');
    setImageFiles([]);
    setVideoFiles([]);
    setSelectedPexelsAssets([]);
  }, [resetToken]);

  const submit = async () => {
    if (!script.trim()) {
      toast.error('대본을 입력해야 합니다.');
      return;
    }
    if (tab === 'MEDIA_AND_SCRIPT' && imageFiles.length === 0 && videoFiles.length === 0 && selectedPexelsAssets.length === 0) {
      toast.error('미디어+대본 모드에서는 사진, 영상 파편 또는 추천 배경을 하나 이상 넣어야 합니다.');
      return;
    }
    if (isLimitReached) {
      toast.error('일일 영상 제작 제한 횟수를 모두 소모했습니다.');
      return;
    }

    await onSubmit({ title, script, inputMode: tab, voice, audioFile: null, imageFiles, videoFiles, pexelsAssets: selectedPexelsAssets });
  };
  return (
    <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary/55">쇼츠 스튜디오</p>
          <h3 className="mt-2 text-3xl font-black leading-tight text-text-main">대본과 소스를 넣고 바로 다음 버전을 만드세요</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
            장황한 설정은 빼고, 결과가 잘 나오는 핵심만 남겼습니다. 대본만 넣거나 미디어를 함께 올리면 세로 쇼츠 제작을 바로 시작합니다.
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
            placeholder="예: 카페 후기 쇼츠 1차본"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">작동 방식</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-text-secondary">업로드한 순서를 기준으로 영상이 자동 구성됩니다. 영상 파편이 먼저 들어가고, 부족한 길이는 사진과 기본 배경으로 자연스럽게 이어집니다.</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div>
            <label className="mb-2 block text-sm font-bold text-text-main">대본</label>
            <textarea
              value={script}
              onChange={(event) => setScript(event.target.value)}
              rows={7}
              placeholder="예: 아직도 영상 편집 때문에 시간 버리고 있나요? 첫 줄은 강하게, 문장은 짧게, 마지막엔 CTA로 끝내세요."
              className="w-full rounded-[1.5rem] border border-slate-200 px-4 py-4 text-sm font-medium leading-relaxed outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">음성 선택</p>
            <div className="mt-3 space-y-2">
              {VIDEO_VOICE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setVoice(option.key)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${voice === option.key ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white text-text-main hover:border-primary/30'}`}
                >
                  <span>{option.label}</span>
                  <span className="text-[11px] font-black text-slate-400">{voice === option.key ? '선택됨' : '선택'}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs font-medium leading-relaxed text-text-secondary">지금은 결과가 안정적인 3개 음성만 제공합니다. 음성 선택은 이번 작업에만 적용됩니다.</p>
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-slate-200 bg-[linear-gradient(180deg,#fff_0%,#fcfcfd_100%)] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/55">대본 작성 공식</p>
          <h4 className="mt-2 text-lg font-black text-text-main">어떤 주제든 이 구조로 쓰면 됩니다</h4>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">긴 샘플 대본보다, 바로 적용 가능한 작성 규칙만 남겼습니다. 업종이 달라도 구조는 거의 같습니다.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              '첫 줄은 손해·문제 제기로 시작',
              '한 문장은 짧고 강하게',
              '문제 → 해결 순서로 전개',
              '마지막엔 행동 유도 한 줄',
            ].map((tip) => (
              <div key={tip} className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-4 text-sm font-black text-text-main shadow-sm">
                {tip}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[1.3rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-semibold leading-relaxed text-text-secondary">
              예시 구조: 첫 문장 훅 → 왜 문제인지 한 줄 → 더 쉬운 대안 제시 → 기대 효과 → 마지막 CTA
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid h-14 w-full grid-cols-2 rounded-[1.4rem] bg-slate-100 p-1">
            <TabsTrigger
              value="MEDIA_AND_SCRIPT"
              className="h-full w-full rounded-[1rem] border border-transparent text-base font-black text-slate-500 data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:text-text-main data-[state=active]:shadow-sm"
            >
              미디어+대본
            </TabsTrigger>
            <TabsTrigger
              value="SCRIPT_ONLY"
              className="h-full w-full rounded-[1rem] border border-transparent text-base font-black text-slate-500 data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:text-text-main data-[state=active]:shadow-sm"
            >
              대본만
            </TabsTrigger>
          </TabsList>
          <TabsContent value="MEDIA_AND_SCRIPT" className="mt-5 space-y-5">
            <MediaUploader
              files={imageFiles}
              onChange={setImageFiles}
              accept="image/*"
              label="사진 파편 업로드"
              helperText="JPEG, PNG, WEBP만 허용합니다. 부족한 길이는 이미지 슬라이드와 기본 템플릿 배경으로 보강합니다."
              maxFiles={10}
              kind="IMAGE"
            />
            <MediaUploader
              files={videoFiles}
              onChange={setVideoFiles}
              accept="video/mp4,video/quicktime,video/webm"
              label="영상 파편 업로드"
              helperText="MP4, MOV, WEBM만 허용합니다. 업로드된 영상이 우선적으로 시퀀스에 반영됩니다."
              maxFiles={5}
              kind="VIDEO"
            />
            <PexelsAssetPicker
              selectedAssets={selectedPexelsAssets}
              onSelectedAssetsChange={setSelectedPexelsAssets}
              totalBackgroundCount={imageFiles.length + videoFiles.length + selectedPexelsAssets.length}
              title="직접 올릴 소스가 부족하면 검색해서 채우세요"
              description="사진·영상 파편이 부족할 때 Pexels 배경을 바로 골라 붙일 수 있습니다. 직접 업로드한 소스와 함께 섞어서 사용됩니다."
            />
          </TabsContent>
          <TabsContent value="SCRIPT_ONLY" className="mt-5 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold leading-relaxed text-text-secondary">
              대본만 입력되면 기본 템플릿 배경으로 세로 쇼츠를 제작합니다. 빠르게 훅 검증용 버전을 뽑을 때 가장 적합합니다.
            </p>
          </TabsContent>
        </Tabs>

        <button
          type="button"
          onClick={submit}
          disabled={isSubmitting || isLimitReached}
          className="inline-flex w-full items-center justify-center rounded-[1.6rem] bg-primary px-5 py-4 text-base font-black text-white shadow-[0_16px_36px_rgba(235,2,112,0.22)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Sparkles size={18} className="mr-2" />}
          쇼츠 자동 생성 요청
        </button>
      </div>
    </div>
  );
}
