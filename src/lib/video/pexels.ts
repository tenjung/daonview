import type { PexelsSelectedAsset } from '@/types/video-assistant';

const PEXELS_API_BASE = 'https://api.pexels.com';

function getPexelsApiKey() {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('PEXELS_API_KEY가 설정되지 않았습니다.');
  }
  return apiKey;
}

async function pexelsFetch(path: string) {
  const response = await fetch(`${PEXELS_API_BASE}${path}`, {
    headers: {
      Authorization: getPexelsApiKey(),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Pexels 요청 실패: ${response.status}`);
  }

  return response.json();
}

function pickBestVideoFile(videoFiles: Array<{ link: string; width: number; height: number; quality?: string }>) {
  const sorted = [...videoFiles].sort((a, b) => {
    const aScore = Math.abs((a.height || 0) - 1920) + Math.abs((a.width || 0) - 1080);
    const bScore = Math.abs((b.height || 0) - 1920) + Math.abs((b.width || 0) - 1080);
    return aScore - bScore;
  });

  return sorted[0] || null;
}

export async function searchPexelsAssets(query: string) {
  const keyword = query.trim();
  if (!keyword) return [];

  const [photoData, videoData] = await Promise.all([
    pexelsFetch(`/v1/search?query=${encodeURIComponent(keyword)}&per_page=6&page=1&orientation=portrait`),
    pexelsFetch(`/videos/search?query=${encodeURIComponent(keyword)}&per_page=6&page=1&orientation=portrait`),
  ]);

  const photoResults: PexelsSelectedAsset[] = Array.isArray(photoData.photos)
    ? photoData.photos.map((photo: {
        id: number;
        alt?: string;
        width?: number;
        height?: number;
        src?: { medium?: string; large2x?: string; original?: string };
      }) => ({
        id: `photo-${photo.id}`,
        kind: 'IMAGE',
        title: photo.alt || `Pexels Photo ${photo.id}`,
        previewUrl: photo.src?.medium || photo.src?.large2x || '',
        sourceUrl: photo.src?.large2x || photo.src?.original || photo.src?.medium || '',
        width: photo.width || null,
        height: photo.height || null,
        durationSec: null,
      }))
    : [];

  const videoResults: PexelsSelectedAsset[] = Array.isArray(videoData.videos)
    ? videoData.videos
        .map((video: {
          id: number;
          width?: number;
          height?: number;
          duration?: number;
          image?: string;
          user?: { name?: string };
          video_files?: Array<{ link: string; width: number; height: number; quality?: string }>;
        }) => {
          const pickedFile = pickBestVideoFile(video.video_files || []);
          if (!pickedFile) return null;

          return {
            id: `video-${video.id}`,
            kind: 'VIDEO' as const,
            title: video.user?.name ? `${video.user.name} 영상` : `Pexels Video ${video.id}`,
            previewUrl: video.image || '',
            sourceUrl: pickedFile.link,
            width: video.width || pickedFile.width || null,
            height: video.height || pickedFile.height || null,
            durationSec: video.duration || null,
          };
        })
        .filter((asset: PexelsSelectedAsset | null): asset is PexelsSelectedAsset => Boolean(asset))
    : [];

  return [...videoResults, ...photoResults].filter((asset) => asset.previewUrl && asset.sourceUrl);
}
