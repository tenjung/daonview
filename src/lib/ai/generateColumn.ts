import { generateWithGemini } from '@/lib/services/googleAI';

/**
 * 인플루언서 칼럼 주제 풀
 * 🎯 다온뷰 플랫폼 특화 주제
 */
const INFLUENCER_TOPICS = [
    '다온뷰 체험단 선정 확률 200% 높이는 5가지 비법',
    '협찬 리뷰 조회수 폭발시키는 글쓰기 공식',
    '인플루언서 체험단 신청서 합격 템플릿 대공개',
    '블로그 리뷰 상위노출 시키는 SEO 최적화 전략',
    '인스타그램 협찬 제안 받는 프로필 만들기',
    '체험단 리뷰 작성 시 절대 하면 안 되는 5가지',
    '다온뷰에서 인기 많은 인플루언서의 비밀',
    '협찬 제품 사진 촬영 꿀팁 (스마트폰으로 프로처럼)',
    '리뷰 댓글 관리로 브랜드 신뢰도 높이는 법',
    '체험단 선정 후 배송 전 준비사항 체크리스트',
];

/**
 * 광고주 칼럼 주제 풀
 * 🎯 다온뷰 플랫폼 특화 주제
 */
const ADVERTISER_TOPICS = [
    '다온뷰 체험단 모집으로 매출 300% 올린 비결',
    '인플루언서 마케팅 성공하는 캠페인 기획법',
    '체험단 모집 시 꼭 알아야 할 5가지 체크리스트',
    '우리 매장에 딱 맞는 인플루언서 찾는 법',
    '체험단 리뷰로 네이버 검색 상위 노출 전략',
    '소상공인을 위한 저예산 인플루언서 마케팅',
    '다온뷰 캠페인 등록 후 24시간 안에 신청자 모으는 법',
    '체험단 제품 선정 가이드 (무엇을 제공할까?)',
    '인플루언서 리뷰 품질 높이는 가이드라인 작성법',
    '체험단 모집 공고 작성 꿀팁 (클릭률 2배)',
];

/**
 * 타입별 칼럼 생성 함수
 */
export async function generateColumn(type: 'ACADEMY_INFLUENCER' | 'ACADEMY_ADVERTISER'): Promise<{
    title: string;
    content: string;
    topic: string;
}> {
    const topics = type === 'ACADEMY_INFLUENCER' ? INFLUENCER_TOPICS : ADVERTISER_TOPICS;
    const topic = topics[Math.floor(Math.random() * topics.length)];

    const role = type === 'ACADEMY_INFLUENCER' ? '인플루언서' : '광고주';
    const targetAudience = type === 'ACADEMY_INFLUENCER'
        ? '블로그/인스타그램 운영자, 체험단 활동에 관심 있는 일반인'
        : '소상공인, 마케팅 담당자, 스타트업 대표';

    // 프롬프트 구성
    const promptLines = [
        '당신은 10년 경력의 마케팅 전문가이자 블로거입니다.',
        `다온뷰 플랫폼에서 ${role}들을 위한 실용적인 가이드를 작성해주세요.`,
        '',
        `주제: "${topic}"`,
        `독자: ${targetAudience}`,
        '',
        '글쓰기 원칙:',
        '1. 자연스러운 대화체: 친구에게 조언하듯 편안하게 작성',
        '2. 구체적인 예시: 실제 사례와 경험 포함',
        '3. 개인적 경험: 제 경험상, 했을 때 등의 표현 활용',
        '4. 키워드 자연스럽게: 다온뷰는 1-2회만 자연스럽게 언급',
        '5. 다양한 표현: 같은 단어 반복 금지',
        '6. 분량: 1200-1500자',
        '',
        '구조 (순수 HTML):',
        '<h2>이런 고민 해보셨나요?</h2>',
        '<p>독자가 공감할 만한 실제 상황 묘사</p>',
        '',
        '<h2>핵심 전략</h2>',
        '<p>실용적인 해결 방법 3-4가지</p>',
        '<ul>',
        '  <li><strong>팁 1</strong>: 구체적 실행 방법</li>',
        '  <li><strong>팁 2</strong>: 실제 사례 포함</li>',
        '</ul>',
        '',
        '중요: 반드시 아래 형식으로 이미지 플레이스홀더 1개를 포함하세요:',
        '[IMAGE:관련 이미지 설명]',
        '',
        '<h2>실전 적용법</h2>',
        '<p>바로 실천할 수 있는 단계별 가이드</p>',
        '',
        '<h2>마무리</h2>',
        '<p>격려와 함께 다온뷰 플랫폼 자연스럽게 언급</p>',
        '<blockquote>더 많은 팁과 기회는 다온뷰에서 만나보세요</blockquote>',
        '',
        '금지사항:',
        '- 마크다운 코드 블록 사용 금지',
        '- 키워드 반복 (다온뷰, 체험단, 협찬 등 과도한 반복)',
        '- 광고성 문구 (지금 바로, 최고의, 완벽한 등)',
        '- AI 티나는 표현 (것입니다, 하시기 바랍니다 등)',
        '',
        '권장사항:',
        '- 반말 또는 존댓말 일관성 유지',
        '- 이모지 적절히 활용',
        '- 실제 경험담처럼 작성',
        '- 숫자와 데이터 활용',
        '',
        '순수 HTML만 반환하세요.'
    ];

    const prompt = promptLines.join('\n');

    try {
        let content = await generateWithGemini(prompt, false);

        // HTML 코드 블록 제거
        content = content
            .replace(/```html\s*/gi, '')
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        return { title: topic, content, topic };
    } catch (error: any) {
        throw new Error(`칼럼 생성 실패: ${error.message}`);
    }
}

/**
 * Pexels API를 사용하여 관련 이미지 가져오기
 * @param description 이미지 설명 (한글)
 * @returns 이미지 URL
 */
export async function generateColumnThumbnail(description: string): Promise<string> {
    try {
        const apiKey = process.env.PEXELS_API_KEY;

        if (!apiKey) {
            console.error('[Pexels Error]: PEXELS_API_KEY 환경 변수가 설정되지 않았습니다.');
            return '';
        }

        console.log('[Pexels] API Key 확인:', apiKey.substring(0, 10) + '...');

        // 한글 키워드 → 영어 키워드 매핑
        const keywordMap: Record<string, string> = {
            '체험단': 'product review',
            '리뷰': 'review writing',
            '협찬': 'collaboration business',
            '캠페인': 'marketing campaign',
            '마케팅': 'digital marketing',
            '인플루언서': 'social media influencer',
            '광고주': 'business advertising',
            '신청서': 'application form',
            '작성': 'writing desk',
            '예시': 'example presentation',
            '분석': 'data analytics',
            '전략': 'strategy planning',
            '소통': 'communication team',
            '혜택': 'benefits rewards',
            '매장': 'retail store',
            '상품': 'product display',
            '블로그': 'blogging laptop',
            '사진': 'photography camera',
            '촬영': 'photoshoot studio',
            '고객': 'customer service',
        };

        // 설명에서 키워드 추출
        let query = 'business marketing';
        for (const [korean, english] of Object.entries(keywordMap)) {
            if (description.includes(korean)) {
                query = english;
                break;
            }
        }

        console.log(`[Pexels] 이미지 검색: "${description}" → "${query}"`);

        // Pexels API 호출
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

        const response = await fetch(url, {
            headers: {
                'Authorization': apiKey,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Pexels API Error]:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`Pexels API 오류: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.photos || data.photos.length === 0) {
            console.warn(`[Pexels] "${query}" 검색 결과 없음, 기본 검색어 사용`);
            // 검색 결과 없으면 기본 이미지 검색
            const fallbackResponse = await fetch(
                `https://api.pexels.com/v1/search?query=business&per_page=1&orientation=landscape`,
                { headers: { 'Authorization': apiKey } }
            );
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.photos && fallbackData.photos.length > 0) {
                return fallbackData.photos[0].src.large;
            }
            throw new Error('이미지를 찾을 수 없습니다.');
        }

        const imageUrl = data.photos[0].src.large;
        console.log(`[Pexels] ✅ 이미지 가져오기 성공`);

        return imageUrl;
    } catch (error: any) {
        console.error('[Pexels Error]:', error.message);
        return ''; // 실패 시 빈 문자열 반환
    }
}
