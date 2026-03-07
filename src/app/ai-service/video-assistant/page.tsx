'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Film, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AuthGuardDialog } from '@/components/auth/AuthGuardDialog';
import { ServiceCard } from '@/components/ai-service/video-assistant/ServiceCard';
import { ScriptInputForm } from '@/components/ai-service/video-assistant/ScriptInputForm';
import { AudioSubtitleForm } from '@/components/ai-service/video-assistant/AudioSubtitleForm';
import { JobStatusCard } from '@/components/ai-service/video-assistant/JobStatusCard';
import { ResultCard } from '@/components/ai-service/video-assistant/ResultCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import type { AIQuota } from '@/types/aiQuota';
import type { PexelsSelectedAsset, VideoJob, VideoInputMode, VideoVoiceKey } from '@/types/video-assistant';

export default function VideoAssistantPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [quota, setQuota] = useState<AIQuota | null>(null);
  const [selectedService, setSelectedService] = useState<'SHORTS_AUTO' | 'AUDIO_SUBTITLE'>('SHORTS_AUTO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<VideoJob | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [scriptFormDirty, setScriptFormDirty] = useState(false);
  const [audioFormDirty, setAudioFormDirty] = useState(false);
  const [subtitleDirty, setSubtitleDirty] = useState(false);
  const [jobStatusError, setJobStatusError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const resultSectionRef = useRef<HTMLElement | null>(null);
  const previousStatusRef = useRef<string | null>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const allowBrowserBackRef = useRef(false);
  const pushedStateRef = useRef(false);

  const isWorking = useMemo(() => Boolean(job && job.status !== 'COMPLETED' && job.status !== 'FAILED'), [job]);
  const hasUnsavedChanges = scriptFormDirty || audioFormDirty || subtitleDirty;

  const fetchQuota = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-service/video/quota');
      if (!response.ok) throw new Error('영상 서비스 사용량을 불러오지 못했습니다.');
      const data = await response.json();
      setQuota(data.video);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchJob = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/ai-service/video/jobs/${jobId}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '영상 작업 조회 실패');
      }
      setJobStatusError(null);
      setJob(data.job);
      if (data.job.status === 'COMPLETED') {
        toast.success(data.job.input_mode === 'AUDIO_SUBTITLE' ? '오디오 자막 영상 생성이 완료되었습니다.' : '쇼츠 생성이 완료되었습니다.');
        void fetchQuota();
      }
      if (data.job.status === 'FAILED') {
        toast.error(data.job.error_message || (data.job.input_mode === 'AUDIO_SUBTITLE' ? '오디오 자막 영상 생성에 실패했습니다.' : '영상 생성에 실패했습니다.'));
        void fetchQuota();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '영상 작업 상태를 불러오지 못했습니다.';
      console.error('[VideoAssistantPage] fetchJob failed:', error);
      setJobStatusError(message);
    }
  }, [fetchQuota]);

  useEffect(() => {
    if (!isLoading && !user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (user) {
      void fetchQuota();
    }
  }, [fetchQuota, user, isLoading]);

  useEffect(() => {
    if (!job || !isWorking) return;

    const timer = window.setInterval(() => {
      void fetchJob(job.id);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [fetchJob, job, isWorking]);

  const handleCreateJob = async (payload: {
    title: string;
    script: string;
    inputMode: VideoInputMode;
    voice: VideoVoiceKey;
    audioFile: File | null;
    imageFiles: File[];
    videoFiles: File[];
    pexelsAssets: PexelsSelectedAsset[];
  }) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('script', payload.script);
      formData.append('inputMode', payload.inputMode);
      formData.append('voice', payload.voice);
      if (payload.audioFile) {
        formData.append('audioFile', payload.audioFile);
      }
      payload.imageFiles.forEach((file) => formData.append('imageFiles', file));
      payload.videoFiles.forEach((file) => formData.append('videoFiles', file));
      payload.pexelsAssets.forEach((asset) => formData.append('pexelsAssets', JSON.stringify(asset)));

      const response = await fetch('/api/ai-service/video/jobs', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '영상 작업 생성에 실패했습니다.');
      }

      setJob(data.job);
      setQuota(data.quota);
      setResetToken((current) => current + 1);
      setScriptFormDirty(false);
      setAudioFormDirty(false);
      setJobStatusError(null);
      toast.success(payload.inputMode === 'AUDIO_SUBTITLE' ? '오디오 자막 영상 작업이 접수되었습니다. 워커가 순차 처리합니다.' : '영상 작업이 접수되었습니다. 워커가 순차 처리합니다.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '영상 작업 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
    router.push('/ai-service');
  };

  const handleJobUpdated = (nextJob: VideoJob) => {
    setJob(nextJob);
  };

  const requestNavigation = (action: () => void) => {
    if (!hasUnsavedChanges) {
      action();
      return;
    }

    pendingNavigationRef.current = action;
    setIsLeaveDialogOpen(true);
  };

  const handleConfirmLeave = () => {
    setIsLeaveDialogOpen(false);
    const pending = pendingNavigationRef.current;
    pendingNavigationRef.current = null;

    if (!pending) return;

    setScriptFormDirty(false);
    setAudioFormDirty(false);
    setSubtitleDirty(false);
    allowBrowserBackRef.current = true;
    pending();
  };

  const handleCancelLeave = () => {
    setIsLeaveDialogOpen(false);
    pendingNavigationRef.current = null;
  };

  const hasCompletedJob = Boolean(job && job.status === 'COMPLETED');
  const currentStep = !job ? 1 : job.status === 'COMPLETED' ? 3 : 2;
  const isShortsService = selectedService === 'SHORTS_AUTO';
  const heroLabel = isShortsService ? '1번 서비스 MVP' : '2번 서비스 MVP';
  const heroTitle = isShortsService ? '대본만 넣어도, 쇼츠 완성' : '오디오만 올리면, 자막 영상 완성';
  const heroDescription = isShortsService
    ? '사진·영상 파편을 올리거나 대본만 입력하세요. 흩어진 소스를 자막까지 입힌 세로 쇼츠로 빠르게 만들어드립니다.'
    : '이미 만들어 둔 음성 파일을 올리면 자막을 추출하고, 세로 배경 위에 입힌 MP4로 바로 변환합니다.';
  const stepItems = isShortsService
    ? [
        { step: 1, title: '대본·소스 입력', desc: '대본과 미디어를 넣고 생성 요청' },
        { step: 2, title: '쇼츠 생성 진행', desc: '음성·자막·렌더링 자동 처리' },
        { step: 3, title: '결과 확인', desc: '완성 영상 미리보기와 다운로드' },
      ]
    : [
        { step: 1, title: '오디오 업로드', desc: '기존 음성 파일과 작업명 입력' },
        { step: 2, title: '자막·영상 변환', desc: '자막 추출과 세로 MP4 렌더링 처리' },
        { step: 3, title: '결과 확인', desc: '완성 영상과 SRT 파일 다운로드' },
      ];

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    previousStatusRef.current = job?.status || null;

    if (job?.status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
      window.setTimeout(() => {
        resultSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }, [job?.status]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges || pushedStateRef.current) return;

    window.history.pushState({ videoAssistantGuard: true }, '', window.location.href);
    pushedStateRef.current = true;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (hasUnsavedChanges) return;
    pushedStateRef.current = false;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handlePopState = () => {
      if (allowBrowserBackRef.current) {
        allowBrowserBackRef.current = false;
        return;
      }
      if (!hasUnsavedChanges) return;

      pendingNavigationRef.current = () => window.history.back();
      setIsLeaveDialogOpen(true);
      window.history.pushState({ videoAssistantGuard: true }, '', window.location.href);
      pushedStateRef.current = true;
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasUnsavedChanges]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(235,2,112,0.08),_transparent_35%),linear-gradient(180deg,#fff_0%,#f8fafc_100%)]">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => requestNavigation(() => router.push('/ai-service'))} className="rounded-xl border border-slate-200 p-2 transition-colors hover:bg-slate-50">
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">AI Intelligence</p>
              <h1 className="text-xl font-black text-text-main md:text-2xl">영상 제작 도우미</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 md:inline-flex">
            <Sparkles size={16} className="text-primary" />
            <span className="text-sm font-bold text-primary">비동기 쇼츠 파이프라인</span>
          </div>
        </div>
      </div>

      <div className="container py-10 md:py-14">
        <section className="mx-auto max-w-6xl rounded-[2.5rem] border border-white/80 bg-white/85 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-bold text-primary">
              <Film size={16} />
              {heroLabel}
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-tight text-text-main md:text-5xl">{heroTitle}</h2>
            <p className="mt-5 text-base leading-relaxed text-text-secondary md:text-lg">
              {heroDescription}
            </p>
          </div>
        </section>

        <section className="mx-auto mt-8 grid max-w-6xl gap-4 md:grid-cols-3">
          <ServiceCard
            title="쇼츠 자동 생성"
            description="미디어+대본 또는 대본만 입력해 음성·자막·최종 MP4를 한 번에 생성합니다."
            isActive
            badgeLabel="1번 서비스"
            isSelected={selectedService === 'SHORTS_AUTO'}
            onClick={() => requestNavigation(() => setSelectedService('SHORTS_AUTO'))}
          />
          <ServiceCard
            title="오디오 자막 영상 변환"
            description="기존 음성 파일에서 자막을 추출하고, 세로 배경 위에 입힌 MP4와 SRT를 바로 생성합니다."
            isActive
            badgeLabel="2번 서비스"
            isSelected={selectedService === 'AUDIO_SUBTITLE'}
            onClick={() => requestNavigation(() => setSelectedService('AUDIO_SUBTITLE'))}
          />
          <ServiceCard title="썸네일 실험실" description="썸네일 후보 자동 생성과 CTR 비교 실험 기능은 후속 단계입니다." />
        </section>

        <section className="mx-auto mt-8 max-w-6xl rounded-[1.8rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="grid gap-3 md:grid-cols-3">
            {stepItems.map((item) => {
              const isActive = currentStep === item.step;
              const isDone = currentStep > item.step;

              return (
                <div
                  key={item.step}
                  className={`rounded-[1.3rem] border px-4 py-4 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : isDone
                        ? 'border-emerald-100 bg-emerald-50/60'
                        : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                      isActive ? 'bg-primary text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-200'
                    }`}>
                      {item.step}
                    </div>
                    <div>
                      <p className={`text-sm font-black ${isActive ? 'text-primary' : isDone ? 'text-emerald-700' : 'text-text-main'}`}>{item.title}</p>
                      <p className="mt-1 text-xs font-medium text-text-secondary">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {(selectedService === 'SHORTS_AUTO' || selectedService === 'AUDIO_SUBTITLE') && (
          <>
            {hasCompletedJob && (
              <section ref={resultSectionRef} className="mx-auto mt-8 max-w-6xl">
                <ResultCard job={job} onJobUpdated={handleJobUpdated} onDirtyChange={setSubtitleDirty} />
              </section>
            )}

            {currentStep === 1 && (
              <section className="mx-auto mt-8 grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1.08fr)_380px]">
                <div className="space-y-6">
                  {selectedService === 'SHORTS_AUTO' ? (
                    <ScriptInputForm
                      key={`script-${resetToken}`}
                      quota={quota}
                      isSubmitting={isSubmitting}
                      onDirtyChange={setScriptFormDirty}
                      onSubmit={handleCreateJob}
                    />
                  ) : (
                    <AudioSubtitleForm
                      key={`audio-${resetToken}`}
                      quota={quota}
                      isSubmitting={isSubmitting}
                      onDirtyChange={setAudioFormDirty}
                      onSubmit={handleCreateJob}
                    />
                  )}
                </div>
                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary/55">운영 메모</p>
                    <h3 className="mt-2 text-xl font-black text-text-main">{selectedService === 'SHORTS_AUTO' ? '제작 방식' : '자막 추출 방식'}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      {selectedService === 'SHORTS_AUTO'
                        ? '지금 버전은 장면을 의미 기반으로 정밀 매칭하는 편집기가 아닙니다. 업로드한 순서대로 자동 구성하고, 결과를 빠르게 테스트하는 데 초점을 둡니다.'
                        : '지금 버전은 업로드한 오디오를 그대로 기준으로 자막을 추출하는 후처리 도구입니다. 음성이 또렷할수록 자막 정확도가 올라갑니다.'}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {currentStep >= 2 && !hasCompletedJob && (
               <section className="mx-auto mt-8 max-w-4xl space-y-6">
                <JobStatusCard job={job} statusError={jobStatusError} />
                <ResultCard job={job} onJobUpdated={handleJobUpdated} onDirtyChange={setSubtitleDirty} />
              </section>
            )}
          </>
        )}
      </div>

      <Dialog
        open={isLeaveDialogOpen}
        onOpenChange={(open) => {
          setIsLeaveDialogOpen(open);
          if (!open) {
            pendingNavigationRef.current = null;
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-text-main">작성 중인 내용이 사라질 수 있습니다</DialogTitle>
            <DialogDescription className="text-sm font-medium leading-relaxed text-text-secondary">
              지금 나가면 입력 중인 대본, 오디오, 자막 수정 내용이 저장되지 않습니다. 정말 나가려면 확인을 누르세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCancelLeave} className="border-slate-200">
              계속 작성
            </Button>
            <Button type="button" onClick={handleConfirmLeave} className="bg-primary text-white hover:bg-primary/90">
              나가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthGuardDialog isOpen={isAuthModalOpen} onClose={handleAuthModalClose} />
    </div>
  );
}
