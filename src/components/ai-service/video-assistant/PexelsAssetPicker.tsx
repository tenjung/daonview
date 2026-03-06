'use client';

import { useState } from 'react';
import { Image as ImageIcon, Loader2, Search, Video as VideoIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PexelsSelectedAsset } from '@/types/video-assistant';

interface PexelsAssetPickerProps {
  selectedAssets: PexelsSelectedAsset[];
  onSelectedAssetsChange: (assets: PexelsSelectedAsset[]) => void;
  totalBackgroundCount: number;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
}

export function PexelsAssetPicker({
  selectedAssets,
  onSelectedAssetsChange,
  totalBackgroundCount,
  title = '배경이 없으면 검색해서 바로 고르세요',
  description = '검색어로 세로 사진·영상 후보를 불러온 뒤 최대 5개까지 선택할 수 있습니다.',
  searchPlaceholder = '예: office desk, creator workspace, planning meeting',
}: PexelsAssetPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pexelsResults, setPexelsResults] = useState<PexelsSelectedAsset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchPexels = async (shouldOpenModal = false) => {
    const keyword = searchTerm.trim();
    if (!keyword) {
      toast.error('Pexels 검색어를 입력해야 합니다.');
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(`/api/pexels/search?q=${encodeURIComponent(keyword)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Pexels 검색에 실패했습니다.');
      }
      setPexelsResults(data.items || []);
      if (shouldOpenModal) {
        setIsModalOpen(true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Pexels 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleAsset = (asset: PexelsSelectedAsset) => {
    const exists = selectedAssets.some((item) => item.id === asset.id);

    if (exists) {
      onSelectedAssetsChange(selectedAssets.filter((item) => item.id !== asset.id));
      return;
    }

    if (selectedAssets.length >= 5) {
      toast.error('Pexels 추천 배경은 최대 5개까지 선택할 수 있습니다.');
      return;
    }

    onSelectedAssetsChange([...selectedAssets, asset]);
  };

  return (
    <>
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Pexels 배경 추천</p>
            <h4 className="mt-2 text-lg font-black text-text-main">{title}</h4>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-text-secondary">{description}</p>
          </div>
          <div className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500">
            현재 배경 소스 {totalBackgroundCount}개
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void searchPexels(true);
              }
            }}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-5 py-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <button
            type="button"
            onClick={() => void searchPexels(true)}
            disabled={isSearching}
            className="inline-flex min-w-[172px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-black text-text-main transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isSearching ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Search size={16} className="mr-2" />}
            추천 불러오기
          </button>
        </div>

        {selectedAssets.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedAssets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => toggleAsset(asset)}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-black text-primary"
              >
                {asset.kind === 'VIDEO' ? <VideoIcon size={14} /> : <ImageIcon size={14} />}
                {asset.title}
                <X size={14} />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl rounded-[2rem] border-none bg-white p-0 shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
          <div className="p-6 md:p-7">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-text-main">Pexels 배경 추천</DialogTitle>
              <DialogDescription className="text-sm font-semibold leading-relaxed text-text-secondary">
                원하는 사진·영상을 선택하고 닫으면 현재 작업의 배경 소스로 바로 반영됩니다. 썸네일은 작게 압축해서 한 번에 비교할 수 있게 구성했습니다.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void searchPexels(false);
                  }
                }}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-5 py-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={() => void searchPexels(false)}
                disabled={isSearching}
                className="inline-flex min-w-[160px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-text-main transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {isSearching ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Search size={16} className="mr-2" />}
                다시 검색
              </button>
            </div>

            <div className="mt-5 max-h-[62vh] overflow-y-auto pr-1">
              {pexelsResults.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {pexelsResults.map((asset) => {
                    const isSelected = selectedAssets.some((item) => item.id === asset.id);
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => toggleAsset(asset)}
                        className={`overflow-hidden rounded-[1.15rem] border text-left transition-all ${isSelected ? 'border-primary bg-primary/[0.03] shadow-[0_10px_24px_rgba(235,2,112,0.08)]' : 'border-slate-200 bg-slate-50 hover:border-primary/40'}`}
                      >
                        <div className="relative aspect-[9/12] w-full overflow-hidden bg-slate-100">
                          <img src={asset.previewUrl} alt={asset.title} className="h-full w-full object-cover" />
                          <div className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-black text-white">
                            {asset.kind === 'VIDEO' ? '영상' : '이미지'}
                          </div>
                          {isSelected && (
                            <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-black text-white">
                              선택됨
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-2 text-sm font-black text-text-main">{asset.title}</p>
                          <p className="mt-1.5 text-[11px] font-semibold text-text-secondary">
                            {asset.durationSec ? `${asset.durationSec}초 · ` : ''}{asset.width || '-'} x {asset.height || '-'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-text-secondary">
                  아직 불러온 추천 결과가 없습니다. 검색어를 입력하고 추천을 불러오면 여기서 바로 고를 수 있습니다.
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-text-secondary">
                현재 선택 {selectedAssets.length}개 / 최대 5개
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-text-main transition-colors hover:border-primary hover:text-primary"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white transition-colors hover:bg-primary/90"
                >
                  선택하고 닫기
                </button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
