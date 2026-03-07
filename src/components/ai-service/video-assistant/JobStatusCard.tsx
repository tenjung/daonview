import type { VideoJob } from '@/types/video-assistant';

const STATUS_LABEL: Record<string, string> = {
  UPLOADING: '원본 업로드 중',
  QUEUED: '대기 중',
  PROCESSING_SCRIPT: '대본 분석 중',
  GENERATING_IMAGES: '챕터 이미지 생성 중',
  PROCESSING_TTS: '음성 생성 중',
  PROCESSING_SUBTITLE: '자막 생성 중',
  RENDERING_VIDEO: '영상 렌더링 중',
  COMPLETED: '완료',
  FAILED: '실패',
};

export function JobStatusCard({ job, statusError }: { job: VideoJob | null; statusError?: string | null }) {
  if (!job) return null;
  const inputModeLabel =
    job.input_mode === 'MEDIA_AND_SCRIPT'
      ? '미디어+대본 모드'
      : job.input_mode === 'AUDIO_SUBTITLE'
        ? '오디오 자막 모드'
        : '대본만 모드';

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary/50">현재 작업</p>
          <h3 className="mt-2 text-xl font-black leading-tight text-text-main">{job.title || '제목 없는 쇼츠'}</h3>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-black ${job.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : job.status === 'FAILED' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'}`}>
          {STATUS_LABEL[job.status] || job.status}
        </span>
      </div>
      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-pink-500 transition-all" style={{ width: `${Math.max(4, job.progress || 0)}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm font-semibold text-text-secondary">
        <span>진행률 {job.progress}%</span>
        <span>{inputModeLabel}</span>
      </div>
      {statusError && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          상태 조회 실패: {statusError}
        </p>
      )}
      {job.error_message && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{job.error_message}</p>}
    </div>
  );
}
