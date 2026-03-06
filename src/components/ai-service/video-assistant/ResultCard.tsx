'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Download, FileAudio, FileText, Image as ImageIcon, Loader2, RotateCcw, Save, Video } from 'lucide-react';
import { toast } from 'sonner';
import { formatTimeRangeToSeconds, parseSrtToBlocks, serializeBlocksToSrt, type SrtBlock } from '@/lib/video/srt';
import type { VideoJob } from '@/types/video-assistant';

function ResultLink({ href, icon, label }: { href?: string | null; icon: ReactNode; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-text-main transition-colors hover:border-primary hover:text-primary"
    >
      <span className="inline-flex items-center gap-2">{icon}{label}</span>
      <Download size={16} />
    </a>
  );
}

interface ResultCardProps {
  job: VideoJob | null;
  onJobUpdated?: (job: VideoJob) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function ResultCard({ job, onJobUpdated, onDirtyChange }: ResultCardProps) {
  const [subtitleBlocks, setSubtitleBlocks] = useState<SrtBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRerendering, setIsRerendering] = useState(false);

  useEffect(() => {
    setSubtitleBlocks(parseSrtToBlocks(String(job?.subtitle_final || job?.subtitle_draft || '')));
  }, [job?.id, job?.subtitle_final, job?.subtitle_draft]);

  const subtitleText = useMemo(() => serializeBlocksToSrt(subtitleBlocks), [subtitleBlocks]);
  const subtitleChanged = useMemo(() => {
    const base = String(job?.subtitle_final || job?.subtitle_draft || '');
    return subtitleText !== base;
  }, [job?.subtitle_draft, job?.subtitle_final, subtitleText]);

  useEffect(() => {
    onDirtyChange?.(subtitleChanged);
  }, [onDirtyChange, subtitleChanged]);

  if (!job || job.status !== 'COMPLETED') return null;

  const audioLabel = job.input_mode === 'AUDIO_SUBTITLE' ? '원본 오디오' : 'MP3 음성';

  const updateBlockText = (targetIndex: number, nextText: string) => {
    setSubtitleBlocks((current) =>
      current.map((block) => (block.index === targetIndex ? { ...block, text: nextText } : block))
    );
  };

  const saveSubtitle = async () => {
    const nextText = subtitleText.trim();
    if (!nextText) {
      toast.error('저장할 자막 내용이 비어 있습니다.');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/ai-service/video/jobs/${job.id}/subtitle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitleFinal: nextText }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '자막 저장에 실패했습니다.');
      }
      onJobUpdated?.(data.job);
      toast.success('자막 수정본이 저장되었습니다.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '자막 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const rerenderVideo = async () => {
    const nextText = subtitleText.trim();
    if (!nextText) {
      toast.error('재렌더링할 자막 내용이 비어 있습니다.');
      return;
    }

    try {
      setIsRerendering(true);
      if (subtitleChanged) {
        const saveResponse = await fetch(`/api/ai-service/video/jobs/${job.id}/subtitle`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subtitleFinal: nextText }),
        });
        const saveData = await saveResponse.json();
        if (!saveResponse.ok) {
          throw new Error(saveData.error || '자막 저장에 실패했습니다.');
        }
        onJobUpdated?.(saveData.job);
      }

      const response = await fetch(`/api/ai-service/video/jobs/${job.id}/rerender`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '재렌더링 요청에 실패했습니다.');
      }
      onJobUpdated?.(data.job);
      toast.success('수정한 자막으로 다시 렌더링을 시작했습니다.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '재렌더링 요청 중 오류가 발생했습니다.');
    } finally {
      setIsRerendering(false);
    }
  };

  return (
    <div className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_65px_rgba(15,23,42,0.08)] md:p-6">
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1.1fr)_340px] xl:items-start">
        <div className="order-2 xl:order-1">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">완성된 결과</p>
          <h3 className="mt-2 text-3xl font-black leading-tight text-text-main">방금 만든 쇼츠를 바로 확인하세요</h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
            미리보기 아래 자막 초안을 바로 수정할 수 있습니다. 오타를 잡은 뒤 저장하거나, 수정본 기준으로 영상을 다시 렌더링하면 됩니다.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ResultLink href={job.video_url} icon={<Video size={16} />} label="최종 MP4" />
            <ResultLink href={job.audio_url} icon={<FileAudio size={16} />} label={audioLabel} />
            <ResultLink href={job.subtitle_url} icon={<FileText size={16} />} label="SRT 자막" />
            <ResultLink href={job.thumbnail_url} icon={<ImageIcon size={16} />} label="썸네일 JPG" />
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">자막 수정</p>
                <p className="mt-1 text-sm font-semibold text-text-secondary">왼쪽 시간은 고정되고, 오른쪽 자막만 수정할 수 있습니다.</p>
              </div>
              {job.subtitle_final && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">수정본 저장됨</span>
              )}
            </div>
            <div className="mt-4 max-h-[34rem] space-y-2 overflow-y-auto rounded-[1.2rem] border border-slate-200 bg-white p-3">
              {subtitleBlocks.map((block) => (
                <div
                  key={`${block.index}-${block.timeRange}`}
                  className="grid gap-2 rounded-[0.9rem] border border-slate-200 bg-slate-50 p-2 md:grid-cols-[190px_minmax(0,1fr)] md:items-center"
                >
                  <div className="rounded-[0.8rem] border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500">
                    구간 {block.index} · {formatTimeRangeToSeconds(block.timeRange)}
                  </div>
                  <textarea
                    value={block.text}
                    onChange={(event) => updateBlockText(block.index, event.target.value)}
                    rows={1}
                    className="min-h-[46px] w-full resize-y rounded-[0.8rem] border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-text-main outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              ))}
              {subtitleBlocks.length === 0 && (
                <div className="rounded-[1rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-semibold text-text-secondary">
                  수정할 자막 블록이 없습니다.
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={saveSubtitle}
                disabled={isSaving || isRerendering || !subtitleChanged}
                className="inline-flex items-center justify-center rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-text-main transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                자막 수정 저장
              </button>
              <button
                type="button"
                onClick={rerenderVideo}
                disabled={isSaving || isRerendering}
                className="inline-flex items-center justify-center rounded-[1rem] bg-primary px-4 py-3 text-sm font-black text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isRerendering ? <Loader2 size={16} className="mr-2 animate-spin" /> : <RotateCcw size={16} className="mr-2" />}
                수정본으로 다시 렌더링
              </button>
            </div>
          </div>
        </div>
        {job.video_url && (
          <div className="order-1 xl:order-2 w-full">
            <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[2rem] border border-slate-900/90 bg-[#04132d] p-3 shadow-[0_28px_70px_rgba(3,7,18,0.26)]">
              <div className="mb-2 flex items-center justify-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                <span className="h-1.5 w-12 rounded-full bg-white/15" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
              </div>
              <video src={job.video_url} controls playsInline className="aspect-[9/16] w-full rounded-[1.5rem] object-contain bg-black" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
