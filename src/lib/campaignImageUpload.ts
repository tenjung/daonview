import { supabase } from '@/lib/supabase/client';
import { optimizeImageForUpload } from '@/lib/utils/imageUtils';
import { CampaignImageVariant } from '@/types/database';

const CAMPAIGN_IMAGE_MAX_WIDTH = 1200;
const CAMPAIGN_IMAGE_MAX_HEIGHT = 1200;
const CAMPAIGN_IMAGE_QUALITY = 0.78;
const MAX_UPLOAD_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [750, 2000];

type StorageUploadError = {
    message?: string;
    status?: number | string;
    statusCode?: number | string;
};

const wait = (milliseconds: number) => new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
});

const getStatusCode = (error: StorageUploadError) => {
    const rawStatus = error.statusCode ?? error.status;
    const parsedStatus = Number(rawStatus);
    return Number.isFinite(parsedStatus) ? parsedStatus : null;
};

const isDuplicateUpload = (error: StorageUploadError) => {
    const status = getStatusCode(error);
    const message = String(error.message || '').toLowerCase();
    return status === 409 || message.includes('already exists') || message.includes('resource already exists');
};

const isTransientUploadError = (error: StorageUploadError) => {
    const status = getStatusCode(error);
    const message = String(error.message || '').toLowerCase();

    return status === 408
        || status === 429
        || (status !== null && status >= 500)
        || message.includes('timeout')
        || message.includes('timed out')
        || message.includes('failed to fetch')
        || message.includes('network');
};

const storageObjectExists = async (filePath: string) => {
    const separatorIndex = filePath.lastIndexOf('/');
    const folder = separatorIndex >= 0 ? filePath.slice(0, separatorIndex) : '';
    const fileName = separatorIndex >= 0 ? filePath.slice(separatorIndex + 1) : filePath;
    const { data, error } = await supabase.storage
        .from('files')
        .list(folder, { limit: 1, search: fileName });

    if (error) return false;
    return data.some((object) => object.name === fileName);
};

const uploadWithRetry = async (filePath: string, file: File) => {
    let lastError: StorageUploadError | null = null;

    for (let attempt = 0; attempt < MAX_UPLOAD_ATTEMPTS; attempt += 1) {
        const { error } = await supabase.storage
            .from('files')
            .upload(filePath, file, {
                cacheControl: '31536000',
                upsert: false,
            });

        if (!error) return;

        const uploadError = error as StorageUploadError;
        lastError = uploadError;

        // 5xx 응답이어도 Storage 내부에서 저장이 완료됐을 수 있으므로
        // 재시도 전에 동일 객체가 존재하는지 확인해 중복 파일을 만들지 않는다.
        if (isDuplicateUpload(uploadError) || await storageObjectExists(filePath)) return;

        const hasNextAttempt = attempt < MAX_UPLOAD_ATTEMPTS - 1;
        if (!hasNextAttempt || !isTransientUploadError(uploadError)) throw uploadError;

        await wait(RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]);
    }

    throw lastError || new Error('이미지 업로드에 실패했습니다.');
};

export async function uploadCampaignImage(file: File): Promise<CampaignImageVariant> {
    const optimizedImage = await optimizeImageForUpload(file, {
        maxWidth: CAMPAIGN_IMAGE_MAX_WIDTH,
        maxHeight: CAMPAIGN_IMAGE_MAX_HEIGHT,
        quality: CAMPAIGN_IMAGE_QUALITY,
        outputType: 'image/webp',
        enforceDimensions: true,
    });
    const fileBase = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const filePath = `campaigns/medium/${fileBase}.${optimizedImage.extension}`;

    await uploadWithRetry(filePath, optimizedImage.file);

    const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

    return {
        originalPath: null,
        thumbnailUrl: publicUrl,
        mediumUrl: publicUrl,
        width: null,
        height: null,
        originalSize: file.size,
        thumbnailSize: optimizedImage.file.size,
        mediumSize: optimizedImage.file.size,
    };
}
