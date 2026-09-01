/**
 * 이미지 파일을 특정 해상도로 리사이징하여 Base64로 변환합니다.
 * AI 분석용이므로 고해상도가 필요하지 않으며, 전송 용량을 최적화합니다.
 */
export async function resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 800): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // 품질을 0.7 정도로 조절하여 용량을 대폭 줄임
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

interface OptimizeImageOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputType?: 'image/webp' | 'image/jpeg';
    enforceDimensions?: boolean;
}

interface OptimizedImageResult {
    file: File;
    extension: string;
    mimeType: string;
}

const GIF_MIME_TYPE = 'image/gif';

export async function optimizeImageForUpload(
    file: File,
    {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.78,
        outputType = 'image/webp',
        enforceDimensions = false,
    }: OptimizeImageOptions = {}
): Promise<OptimizedImageResult> {
    if (file.type === GIF_MIME_TYPE) {
        return {
            file,
            extension: 'gif',
            mimeType: GIF_MIME_TYPE,
        };
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const resizeRatio = Math.min(maxWidth / width, maxHeight / height, 1);
                const wasResized = resizeRatio < 1;

                if (wasResized) {
                    width *= resizeRatio;
                    height *= resizeRatio;
                }

                canvas.width = Math.max(1, Math.round(width));
                canvas.height = Math.max(1, Math.round(height));

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('이미지 캔버스를 초기화할 수 없습니다.'));
                    return;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const preferredType = outputType;
                const fallbackType = 'image/jpeg';
                const extensionByType = preferredType === 'image/webp' ? 'webp' : 'jpg';

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('이미지 최적화에 실패했습니다.'));
                        return;
                    }

                    const optimizedType = blob.type || preferredType;
                    const optimizedExtension =
                        optimizedType === 'image/webp'
                            ? 'webp'
                            : optimizedType === 'image/jpeg'
                                ? 'jpg'
                                : extensionByType;

                    const optimizedFile = new File(
                        [blob],
                        file.name.replace(/\.[^.]+$/, `.${optimizedExtension}`),
                        { type: optimizedType }
                    );

                    const finalFile =
                        optimizedFile.size > 0 && (optimizedFile.size < file.size || (enforceDimensions && wasResized))
                            ? optimizedFile
                            : file;

                    resolve({
                        file: finalFile,
                        extension:
                            finalFile === file
                                ? (file.name.split('.').pop()?.toLowerCase() || 'jpg')
                                : optimizedExtension,
                        mimeType: finalFile.type || optimizedType || fallbackType,
                    });
                }, preferredType, quality);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}
