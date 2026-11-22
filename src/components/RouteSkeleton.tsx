import type { ReactNode } from 'react';

function Placeholder({ className }: { className: string }) {
  return <div className={`rounded-lg bg-slate-100 ${className}`} />;
}

function LoadingRegion({ children }: { children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">페이지를 불러오는 중입니다.</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">{children}</div>
    </div>
  );
}

export function ContentSkeleton({ embedded = false }: { embedded?: boolean }) {
  return (
    <LoadingRegion>
      <div className={embedded ? 'min-w-0 space-y-6 py-4' : 'mx-auto min-h-[60vh] w-full max-w-[1240px] space-y-6 px-6 py-8 md:py-12'}>
        <Placeholder className="h-8 w-48 max-w-full" />
        <Placeholder className="h-4 w-72 max-w-full" />
        <div className="space-y-4 rounded-2xl border border-slate-100 p-5 md:p-8">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-3 border-b border-slate-50 pb-4 last:border-0">
              <Placeholder className="h-5 w-3/4" />
              <Placeholder className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

export function CampaignListSkeleton() {
  return (
    <LoadingRegion>
      <div className="min-h-screen bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-3 md:flex-row md:px-10">
            <Placeholder className="h-10 w-full md:w-96" />
            <Placeholder className="h-10 flex-1" />
          </div>
        </div>
        <div className="mx-auto max-w-[1600px] space-y-8 px-3 py-12 md:px-10">
          <Placeholder className="h-6 w-40" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:gap-6 2xl:grid-cols-5">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-slate-100">
                <Placeholder className="aspect-[1.58/1] w-full !rounded-none lg:aspect-[4/3]" />
                <div className="space-y-3 p-2 lg:p-5">
                  <Placeholder className="h-4 w-1/3" />
                  <Placeholder className="h-5 w-full" />
                  <Placeholder className="h-4 w-2/3" />
                  <Placeholder className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

export function CampaignDetailSkeleton() {
  return (
    <LoadingRegion>
      <div className="mx-auto min-h-screen w-full max-w-[1240px] space-y-6 px-6 py-4 md:py-8">
        <Placeholder className="h-4 w-28" />
        <Placeholder className="h-9 w-3/4" />
        <div className="grid grid-cols-1 gap-8 border-t border-slate-100 pt-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Placeholder className="mx-auto aspect-square w-full max-w-xl" />
            <Placeholder className="h-10 w-full" />
            <Placeholder className="h-40 w-full" />
          </div>
          <div className="space-y-5 lg:col-span-4">
            <Placeholder className="h-6 w-1/3" />
            <Placeholder className="h-8 w-full" />
            <Placeholder className="h-5 w-2/3" />
            <Placeholder className="h-44 w-full" />
            <Placeholder className="h-12 w-full" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
