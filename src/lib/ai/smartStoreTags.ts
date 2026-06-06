import crypto from 'crypto';

export type SmartStoreTagGrade = 'GENERAL' | 'VALID_CANDIDATE' | 'HIGH_POTENTIAL';

export interface SmartStoreTagResult {
  tag: string;
  wordCount: number;
  monthlySearchVolume: number | null;
  categoryScore: number;
  expansionScore: number;
  sourceScore: number;
  frequencyScore: number;
  selectionScore: number;
  potentialVolume: number | null;
  grade: SmartStoreTagGrade;
  recommendedCombinations: string[];
}

export interface SmartStoreTagAnalysis {
  seedKeyword: string;
  categoryPath: string;
  tags: SmartStoreTagResult[];
  apiAvailable: boolean;
  apiMessage: string | null;
  totalTags: number;
  highPotentialCount: number;
  sourceItemCount: number;
}

export interface SmartStoreCategorySuggestion {
  categoryPath: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
  matchedItemCount: number;
  confidence: number;
}

interface NaverKeywordStat {
  relKeyword?: string;
  monthlyPcQcCnt?: number | string;
  monthlyMobileQcCnt?: number | string;
}

interface NaverKeywordToolResponse {
  keywordList?: NaverKeywordStat[];
}

interface NaverShoppingItem {
  title?: string;
  mallName?: string;
  brand?: string;
  maker?: string;
  category1?: string;
  category2?: string;
  category3?: string;
  category4?: string;
}

interface NaverShoppingResponse {
  items?: NaverShoppingItem[];
}

const NAVER_SEARCH_AD_BASE_URL = 'https://api.searchad.naver.com';
const NAVER_SHOPPING_SEARCH_URL = 'https://openapi.naver.com/v1/search/shop.json';
const MAX_TAGS = 100;
const MAX_VOLUME_LOOKUPS = 25;
const MAX_COMBINATION_LOOKUPS = 15;
const SHOPPING_TAG_SOURCE_COUNT = 40;
const SHOPPING_CATEGORY_SOURCE_COUNT = 40;
const TAG_STOP_WORDS = new Set([
  '무료배송',
  '당일배송',
  '오늘출발',
  '공식',
  '정품',
  '특가',
  '할인',
  '세일',
  '추천',
  '인기',
  '상품',
  '네이버',
  '스마트스토어',
  '스토어',
  '브랜드',
  '옵션',
  '개입',
  '세트',
  '리필',
  '대용량',
  '국내',
  '해외',
  '생활용품',
  '생활건강',
  '해충퇴치용품',
  '전체',
  '기획',
  '행사',
]);
const QUANTITY_PATTERN = /(^|\s)\d+(\s?)(개|개입|매|장|팩|입|p|P|세트|박스|통|g|G|kg|KG|ml|ML|l|L)($|\s)/;

export function parseTagInput(input: string): string[] {
  const seen = new Set<string>();

  return input
    .split(/[\s,\n\r\t]+/)
    .map((tag) => tag.replace(/[^0-9a-zA-Z가-힣]/g, '').trim())
    .filter((tag) => tag.length >= 2)
    .filter((tag) => {
      const key = tag.toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_TAGS);
}

export function tokenizeKeyword(value: string): string[] {
  const normalized = stripHtml(value).replace(/[^0-9a-zA-Z가-힣\s>/]/g, ' ');
  const tokens = normalized
    .split(/[\s>]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  return Array.from(new Set(tokens.map((token) => token.toUpperCase())))
    .map((upperToken) => tokens.find((token) => token.toUpperCase() === upperToken) || upperToken);
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ');
}

function normalizeKeyword(value: string) {
  return value.replace(/\s/g, '').toUpperCase();
}

function countTagWords(value: string) {
  return Math.max(1, tokenizeKeyword(value).length);
}

function parseVolumeValue(value: number | string | undefined) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (value.includes('<')) return 10;
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function buildSignature(timestamp: string, method: string, path: string, secret: string) {
  const message = `${timestamp}.${method}.${path}`;
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

function getNaverSearchAdConfig() {
  const apiKey = process.env.NAVER_AD_CLIENT_ID || process.env.NAVER_SEARCH_AD_API_KEY || '';
  const secret = process.env.NAVER_AD_CLIENT_SECRET || process.env.NAVER_SEARCH_AD_SECRET_KEY || '';
  const customerId = process.env.NAVER_AD_CUSTOMER_ID || process.env.NAVER_SEARCH_AD_CUSTOMER_ID || '';

  if (!apiKey || !secret || !customerId) {
    return null;
  }

  return { apiKey, secret, customerId };
}

function getNaverShoppingConfig() {
  const clientId = process.env.NAVER_CLIENT_ID || '';
  const clientSecret = process.env.NAVER_CLIENT_SECRET || '';

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

async function fetchNaverShoppingItems(seedKeyword: string, display: number) {
  const keyword = seedKeyword.trim();
  const config = getNaverShoppingConfig();

  if (!config) {
    return {
      items: [] as NaverShoppingItem[],
      apiAvailable: false,
      apiMessage: '네이버 쇼핑 검색 API 환경변수가 없어 쇼핑 검색 데이터를 불러올 수 없습니다.',
    };
  }

  const params = new URLSearchParams({
    query: keyword,
    display: String(display),
    start: '1',
    sort: 'sim',
  });

  try {
    const response = await fetch(`${NAVER_SHOPPING_SEARCH_URL}?${params.toString()}`, {
      headers: {
        'X-Naver-Client-Id': config.clientId,
        'X-Naver-Client-Secret': config.clientSecret,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`Naver Shopping API ${response.status}`);
    }

    const data = (await response.json()) as NaverShoppingResponse;

    return {
      items: data.items || [],
      apiAvailable: true,
      apiMessage: null,
    };
  } catch (error) {
    console.warn('[smart-store-tags] Naver Shopping API failed:', error);
    return {
      items: [] as NaverShoppingItem[],
      apiAvailable: false,
      apiMessage: '네이버 쇼핑 검색 데이터 호출에 실패했습니다.',
    };
  }
}

function buildCategoryPath(item: NaverShoppingItem) {
  return [item.category1, item.category2, item.category3, item.category4]
    .map((category) => String(category || '').trim())
    .filter(Boolean)
    .join(' > ');
}

export async function recommendSmartStoreCategories(seedKeyword: string): Promise<{
  suggestions: SmartStoreCategorySuggestion[];
  apiAvailable: boolean;
  apiMessage: string | null;
}> {
  const shoppingResult = await fetchNaverShoppingItems(seedKeyword, SHOPPING_CATEGORY_SOURCE_COUNT);
  const items = shoppingResult.items;

  if (!shoppingResult.apiAvailable) {
    return {
      suggestions: [],
      apiAvailable: false,
      apiMessage: shoppingResult.apiMessage,
    };
  }

  try {
    const categoryMap = new Map<string, {
      item: NaverShoppingItem;
      count: number;
    }>();

    for (const item of items) {
      const categoryPath = buildCategoryPath(item);
      if (!categoryPath) continue;

      const current = categoryMap.get(categoryPath);
      if (current) {
        current.count += 1;
      } else {
        categoryMap.set(categoryPath, { item, count: 1 });
      }
    }

    const totalCount = Math.max(1, items.length);
    const suggestions = Array.from(categoryMap.entries())
      .map(([categoryPath, entry]) => ({
        categoryPath,
        category1: entry.item.category1 || '',
        category2: entry.item.category2 || '',
        category3: entry.item.category3 || '',
        category4: entry.item.category4 || '',
        matchedItemCount: entry.count,
        confidence: Math.round((entry.count / totalCount) * 100),
      }))
      .sort((a, b) => b.matchedItemCount - a.matchedItemCount || b.confidence - a.confidence)
      .slice(0, 5);

    return {
      suggestions,
      apiAvailable: true,
      apiMessage: suggestions.length > 0 ? null : '검색어에 매칭되는 네이버 쇼핑 카테고리를 찾지 못했습니다.',
    };
  } catch (error) {
    console.warn('[smart-store-tags] Naver Shopping category recommendation failed:', error);
    return {
      suggestions: [],
      apiAvailable: false,
      apiMessage: '네이버 쇼핑 카테고리 추천 호출에 실패했습니다.',
    };
  }
}

function addCandidate(
  candidateMap: Map<string, { tag: string; score: number }>,
  rawTag: string,
  score: number,
  excludedTokens: Set<string>
) {
  const tag = rawTag.replace(/[^0-9a-zA-Z가-힣\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const normalized = normalizeKeyword(tag);

  if (tag.length < 2) return;
  if (tag.length > 20) return;
  if (/^\d+$/.test(tag)) return;
  if (TAG_STOP_WORDS.has(tag.replace(/\s/g, ''))) return;
  if (QUANTITY_PATTERN.test(tag)) return;
  if (excludedTokens.has(normalized)) return;

  const current = candidateMap.get(normalized);
  if (current) {
    current.score += score;
  } else {
    candidateMap.set(normalized, { tag, score });
  }
}

function buildAdjacentPhrases(tokens: string[]) {
  const phrases: string[] = [];

  for (let size = 2; size <= 3; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      phrases.push(tokens.slice(index, index + size).join(' '));
    }
  }

  return phrases;
}

function extractCandidateTagsFromShoppingItems(params: {
  seedKeyword: string;
  categoryPath: string;
  items: NaverShoppingItem[];
}) {
  const candidateMap = new Map<string, { tag: string; score: number }>();
  const seedTokens = new Set(tokenizeKeyword(params.seedKeyword).map((token) => token.toUpperCase()));
  const categoryTokens = new Set(tokenizeKeyword(params.categoryPath).map((token) => token.toUpperCase()));
  const excludedTokens = new Set([...seedTokens]);

  params.items.slice(0, SHOPPING_TAG_SOURCE_COUNT).forEach((item, index) => {
    const rankScore = Math.max(1, SHOPPING_TAG_SOURCE_COUNT - index);
    const titleTokens = tokenizeKeyword(stripHtml(item.title || ''));
    const categoryItemTokens = tokenizeKeyword(buildCategoryPath(item));
    const brandTokens = tokenizeKeyword([item.brand, item.maker, item.mallName].filter(Boolean).join(' '));

    titleTokens.forEach((token) => addCandidate(candidateMap, token, rankScore * 3, excludedTokens));
    buildAdjacentPhrases(titleTokens).forEach((phrase) => {
      const phraseWordCount = countTagWords(phrase);
      addCandidate(candidateMap, phrase, rankScore * (phraseWordCount + 2), excludedTokens);
    });
    brandTokens.forEach((token) => addCandidate(candidateMap, token, rankScore, excludedTokens));
    categoryItemTokens.forEach((token) => {
      const score = categoryTokens.has(token.toUpperCase()) ? rankScore * 2 : rankScore;
      addCandidate(candidateMap, token, score, excludedTokens);
    });
  });

  return Array.from(candidateMap.values())
    .sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag, 'ko'))
    .map((candidate) => candidate.tag)
    .slice(0, MAX_TAGS);
}

async function fetchKeywordVolumes(keywords: string[]) {
  const config = getNaverSearchAdConfig();
  const volumes = new Map<string, number>();

  if (!config) {
    return {
      volumes,
      apiAvailable: false,
      apiMessage: '네이버 검색광고 API 환경변수가 설정되지 않아 검색량은 확인 불가로 표시됩니다.',
    };
  }

  const uniqueKeywords = Array.from(new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean)))
    .slice(0, MAX_VOLUME_LOOKUPS + MAX_COMBINATION_LOOKUPS);

  try {
    await Promise.all(
      uniqueKeywords.map(async (keyword) => {
        const method = 'GET';
        const path = '/keywordstool';
        const timestamp = Date.now().toString();
        const signature = buildSignature(timestamp, method, path, config.secret);
        const params = new URLSearchParams({
          hintKeywords: keyword,
          showDetail: '1',
        });

        const response = await fetch(`${NAVER_SEARCH_AD_BASE_URL}${path}?${params.toString()}`, {
          headers: {
            'X-Timestamp': timestamp,
            'X-API-KEY': config.apiKey,
            'X-Customer': config.customerId,
            'X-Signature': signature,
          },
          signal: AbortSignal.timeout(6000),
        });

        if (!response.ok) {
          throw new Error(`Naver SearchAd API ${response.status}`);
        }

        const data = (await response.json()) as NaverKeywordToolResponse;
        const normalizedTarget = normalizeKeyword(keyword);
        const matched = data.keywordList?.find((item) => normalizeKeyword(item.relKeyword || '') === normalizedTarget)
          || data.keywordList?.[0];

        if (!matched) {
          volumes.set(keyword, 0);
          return;
        }

        const total = parseVolumeValue(matched.monthlyPcQcCnt) + parseVolumeValue(matched.monthlyMobileQcCnt);
        volumes.set(keyword, total);
      })
    );

    return {
      volumes,
      apiAvailable: true,
      apiMessage: null,
    };
  } catch (error) {
    console.warn('[smart-store-tags] Naver SearchAd API failed:', error);
    return {
      volumes: new Map<string, number>(),
      apiAvailable: false,
      apiMessage: '네이버 검색광고 API 호출에 실패해 검색량은 확인 불가로 표시됩니다.',
    };
  }
}

function calculateCategoryScore(tag: string, seedKeyword: string, categoryPath: string) {
  const categoryTokens = tokenizeKeyword(categoryPath);
  const seedTokens = tokenizeKeyword(seedKeyword);
  const tagTokens = tokenizeKeyword(tag);
  const sourceTokens = new Set([...categoryTokens, ...seedTokens].map((token) => token.toUpperCase()));
  const matchedCount = tagTokens.filter((token) => sourceTokens.has(token.toUpperCase())).length;

  if (tagTokens.length === 0) return 0;

  const directMatchBonus = sourceTokens.has(tag.toUpperCase()) ? 30 : 0;
  const ratioScore = Math.round((matchedCount / tagTokens.length) * 70);

  return Math.min(100, ratioScore + directMatchBonus);
}

function buildCombinations(seedKeyword: string, tag: string) {
  const seedTokens = tokenizeKeyword(seedKeyword);
  const tagTokens = tokenizeKeyword(tag);
  const combinations = new Set<string>();
  const normalizedSeed = normalizeKeyword(seedKeyword);

  for (const tagToken of tagTokens) {
    const normalizedTagToken = normalizeKeyword(tagToken);

    if (normalizedTagToken !== normalizedSeed) {
      combinations.add(`${tagToken} ${seedKeyword}`);
    }

    for (const seedToken of seedTokens) {
      const normalizedSeedToken = normalizeKeyword(seedToken);
      if (normalizedTagToken === normalizedSeedToken) continue;

      combinations.add(`${tagToken} ${seedToken}`);
      combinations.add(`${seedToken} ${tagToken}`);
    }
  }

  const seen = new Set<string>();

  return Array.from(combinations)
    .map((combination) => combination.replace(/\s+/g, ' ').trim())
    .filter((combination) => {
      const normalized = normalizeKeyword(combination);
      if (normalized === normalizedSeed) return false;
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return combination.replace(/\s/g, '').length >= 3;
    })
    .slice(0, 5);
}

function calculateSourceScore(tag: string, items: NaverShoppingItem[]) {
  if (items.length === 0) return 0;

  const normalizedTag = normalizeKeyword(tag);
  const sourceLimit = Math.min(items.length, SHOPPING_TAG_SOURCE_COUNT);
  let rankWeightSum = 0;

  items.slice(0, SHOPPING_TAG_SOURCE_COUNT).forEach((item, index) => {
    const rankWeight = Math.max(1, SHOPPING_TAG_SOURCE_COUNT - index);
    const sourceText = [
      stripHtml(item.title || ''),
      item.brand,
      item.maker,
      item.mallName,
      buildCategoryPath(item),
    ].filter(Boolean).join(' ');
    const normalizedSource = normalizeKeyword(sourceText);

    if (normalizedSource.includes(normalizedTag)) {
      rankWeightSum += rankWeight;
    }
  });

  const topTenWeightSum = Array.from({ length: Math.min(sourceLimit, 10) })
    .reduce<number>((sum, _, index) => sum + Math.max(1, SHOPPING_TAG_SOURCE_COUNT - index), 0);

  return Math.min(100, Math.round((rankWeightSum / Math.max(1, topTenWeightSum)) * 100));
}

function calculateFrequencyScore(tag: string, items: NaverShoppingItem[]) {
  if (items.length === 0) return 0;

  const normalizedTag = normalizeKeyword(tag);
  const matchedCount = items.slice(0, SHOPPING_TAG_SOURCE_COUNT).filter((item) => {
    const sourceText = [
      stripHtml(item.title || ''),
      item.brand,
      item.maker,
      item.mallName,
      buildCategoryPath(item),
    ].filter(Boolean).join(' ');

    return normalizeKeyword(sourceText).includes(normalizedTag);
  }).length;

  return Math.min(100, Math.round((matchedCount / Math.min(items.length, SHOPPING_TAG_SOURCE_COUNT)) * 100));
}

function calculateGrade(params: {
  monthlySearchVolume: number | null;
  categoryScore: number;
  expansionScore: number;
  sourceScore: number;
  frequencyScore: number;
  selectionScore: number;
}): SmartStoreTagGrade {
  const hasVolume = params.monthlySearchVolume !== null && params.monthlySearchVolume > 0;

  if (params.selectionScore >= 60 && (params.categoryScore >= 35 || params.frequencyScore >= 25) && (hasVolume || params.sourceScore >= 35)) {
    return 'HIGH_POTENTIAL';
  }

  if (hasVolume || params.categoryScore >= 35 || params.expansionScore >= 40 || params.sourceScore >= 20 || params.frequencyScore >= 10 || params.selectionScore >= 35) {
    return 'VALID_CANDIDATE';
  }

  return 'GENERAL';
}

export async function analyzeSmartStoreTags(params: {
  seedKeyword: string;
  categoryPath: string;
  rawTags?: string;
}): Promise<SmartStoreTagAnalysis> {
  const seedKeyword = params.seedKeyword.trim();
  const categoryPath = params.categoryPath.trim();
  const manualTags = parseTagInput(params.rawTags || '');
  const shoppingTagSource = manualTags.length > 0
    ? { items: [] as NaverShoppingItem[], apiAvailable: true, apiMessage: null }
    : await fetchNaverShoppingItems(seedKeyword, SHOPPING_TAG_SOURCE_COUNT);
  const tags = manualTags.length > 0
    ? manualTags
    : extractCandidateTagsFromShoppingItems({
      seedKeyword,
      categoryPath,
      items: shoppingTagSource.items,
    });
  const allCombinations = tags.flatMap((tag) => buildCombinations(seedKeyword, tag));
  const lookupKeywords = [
    ...tags.slice(0, MAX_VOLUME_LOOKUPS),
    ...allCombinations.slice(0, MAX_COMBINATION_LOOKUPS),
  ];
  const { volumes, apiAvailable, apiMessage } = await fetchKeywordVolumes(lookupKeywords);
  const mergedApiMessage = [shoppingTagSource.apiMessage, apiMessage].filter(Boolean).join(' ');

  const results = tags.map((tag) => {
    const combinations = buildCombinations(seedKeyword, tag);
    const monthlySearchVolume = volumes.has(tag) ? volumes.get(tag) || 0 : null;
    const categoryScore = calculateCategoryScore(tag, seedKeyword, categoryPath);
    const sourceScore = calculateSourceScore(tag, shoppingTagSource.items);
    const frequencyScore = calculateFrequencyScore(tag, shoppingTagSource.items);
    const wordCount = countTagWords(tag);
    const combinationVolumes = combinations
      .map((combination) => volumes.get(combination))
      .filter((volume): volume is number => typeof volume === 'number');
    const potentialVolume = combinationVolumes.length > 0
      ? combinationVolumes.reduce((sum, volume) => sum + volume, 0)
      : null;
    const expansionScore = potentialVolume === null ? 0 : Math.min(100, Math.round(potentialVolume / 200));
    const volumeScore = monthlySearchVolume === null ? 0 : Math.min(100, Math.round(monthlySearchVolume / 100));
    const wordCountScore = Math.min(30, (wordCount - 1) * 10);
    const selectionScore = Math.min(
      100,
      Math.round((sourceScore * 0.28) + (frequencyScore * 0.22) + (categoryScore * 0.2) + (expansionScore * 0.16) + (volumeScore * 0.08) + wordCountScore)
    );
    const grade = calculateGrade({ monthlySearchVolume, categoryScore, expansionScore, sourceScore, frequencyScore, selectionScore });

    return {
      tag,
      wordCount,
      monthlySearchVolume,
      categoryScore,
      expansionScore,
      sourceScore,
      frequencyScore,
      selectionScore,
      potentialVolume,
      grade,
      recommendedCombinations: combinations.slice(0, 3),
    };
  }).sort((a, b) => {
    const gradeWeight: Record<SmartStoreTagGrade, number> = {
      HIGH_POTENTIAL: 3,
      VALID_CANDIDATE: 2,
      GENERAL: 1,
    };

    return (
      gradeWeight[b.grade] - gradeWeight[a.grade]
      || (b.monthlySearchVolume || 0) - (a.monthlySearchVolume || 0)
      || b.selectionScore - a.selectionScore
      || (b.potentialVolume || 0) - (a.potentialVolume || 0)
      || b.frequencyScore - a.frequencyScore
      || b.wordCount - a.wordCount
      || b.categoryScore - a.categoryScore
      || b.expansionScore - a.expansionScore
    );
  });

  return {
    seedKeyword,
    categoryPath,
    tags: results,
    apiAvailable: shoppingTagSource.apiAvailable && apiAvailable,
    apiMessage: mergedApiMessage || null,
    totalTags: results.length,
    highPotentialCount: results.filter((result) => result.grade === 'HIGH_POTENTIAL').length,
    sourceItemCount: manualTags.length > 0 ? 0 : shoppingTagSource.items.slice(0, SHOPPING_TAG_SOURCE_COUNT).length,
  };
}
