/**
 * SNS 플랫폼 감지 및 아이콘 표시 유틸리티
 */

export interface SocialPlatform {
    name: string;
    icon: string;
    color: string;
    url: string;
}

/**
 * URL에서 SNS 플랫폼 감지
 * @param url SNS URL
 * @returns 감지된 플랫폼 정보 배열
 */
export function detectSocialPlatforms(url: string): SocialPlatform[] {
    if (!url) return [];

    const urlLower = url.toLowerCase();
    const platforms: SocialPlatform[] = [];

    // 네이버 블로그
    if (urlLower.includes('blog.naver.com') || urlLower.includes('naver.com/blog')) {
        platforms.push({
            name: '네이버 블로그',
            icon: '📗',
            color: 'bg-emerald-500',
            url: url
        });
    }

    // 인스타그램
    if (urlLower.includes('instagram.com')) {
        platforms.push({
            name: '인스타그램',
            icon: '📸',
            color: 'bg-gradient-to-br from-purple-500 to-pink-500',
            url: url
        });
    }

    // 유튜브
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
        platforms.push({
            name: '유튜브',
            icon: '▶️',
            color: 'bg-red-500',
            url: url
        });
    }

    // 틱톡
    if (urlLower.includes('tiktok.com')) {
        platforms.push({
            name: '틱톡',
            icon: '🎵',
            color: 'bg-slate-900',
            url: url
        });
    }

    // 감지된 플랫폼이 없으면 기본 SNS로 표시
    if (platforms.length === 0) {
        platforms.push({
            name: 'SNS',
            icon: '🔗',
            color: 'bg-gray-500',
            url: url
        });
    }

    return platforms;
}

/**
 * 여러 SNS URL을 파싱하여 플랫폼 정보 반환
 * @param snsUrls SNS URL 배열 또는 단일 URL
 * @returns 감지된 플랫폼 정보 배열
 */
export function parseSocialLinks(snsUrls: string | string[]): SocialPlatform[] {
    if (!snsUrls) return [];

    const urls = Array.isArray(snsUrls) ? snsUrls : [snsUrls];
    const allPlatforms: SocialPlatform[] = [];

    urls.forEach(url => {
        const platforms = detectSocialPlatforms(url);
        allPlatforms.push(...platforms);
    });

    return allPlatforms;
}
