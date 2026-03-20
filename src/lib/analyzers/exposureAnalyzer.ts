// 검색 노출도 분석 유틸리티 (Naver DataLab API)
import axios from 'axios';
import { ExposureData } from '@/types/analysis';

interface NaverDataLabRequest {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  timeUnit: 'date' | 'week' | 'month';
  keywordGroups: Array<{
    groupName: string;
    keywords: string[];
  }>;
}

interface NaverDataLabResponse {
  results: Array<{
    title: string;
    keywords: string[];
    data: Array<{
      period: string;
      ratio: number;
    }>;
  }>;
}

/**
 * Naver DataLab API를 통한 검색량 조회
 */
async function fetchSearchVolume(keywords: string[]): Promise<Map<string, number>> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('Naver API 키가 설정되지 않았습니다. 기본값을 사용합니다.');
    // API 키가 없을 경우 더미 데이터 반환
    return new Map(keywords.map(k => [k, Math.floor(Math.random() * 10000)]));
  }

  try {
    // 최근 1개월 데이터 조회
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const requestBody: NaverDataLabRequest = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      timeUnit: 'month',
      keywordGroups: keywords.slice(0, 5).map(keyword => ({
        groupName: keyword,
        keywords: [keyword],
      })),
    };

    const response = await axios.post<NaverDataLabResponse>(
      'https://openapi.naver.com/v1/datalab/search',
      requestBody,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    const volumeMap = new Map<string, number>();
    
    response.data.results.forEach(result => {
      const keyword = result.title;
      // ratio를 월간 검색량으로 변환 (ratio * 100을 기준 검색량으로 가정)
      const avgRatio = result.data.reduce((sum, d) => sum + d.ratio, 0) / result.data.length;
      const estimatedVolume = Math.round(avgRatio * 100);
      volumeMap.set(keyword, estimatedVolume);
    });

    return volumeMap;
  } catch (error) {
    console.error('Naver DataLab API 호출 실패:', error);
    // 실패 시 더미 데이터 반환
    return new Map(keywords.map(k => [k, Math.floor(Math.random() * 10000)]));
  }
}

/**
 * 경쟁도 분석 (간단한 추정)
 * 검색량 기반으로 경쟁도 추정
 */
function estimateCompetition(searchVolume: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (searchVolume > 5000) return 'HIGH';
  if (searchVolume > 1000) return 'MEDIUM';
  return 'LOW';
}

/**
 * 트렌드 분석 (간단한 추정)
 * 실제로는 시계열 데이터 필요, 여기서는 검색량 기반 추정
 */
function estimateTrend(searchVolume: number): 'RISING' | 'STABLE' | 'FALLING' {
  // 간단한 휴리스틱: 검색량이 높으면 상승 중으로 가정
  if (searchVolume > 3000) return 'RISING';
  if (searchVolume > 500) return 'STABLE';
  return 'FALLING';
}

/**
 * 검색 노출도 분석 메인 함수
 */
export async function analyzeExposure(keywords: string[]): Promise<ExposureData[]> {
  // 상위 10개 키워드만 분석
  const topKeywords = keywords.slice(0, 10);
  
  // Naver DataLab API로 검색량 조회
  const volumeMap = await fetchSearchVolume(topKeywords);
  
  // 노출도 데이터 생성
  const exposureData: ExposureData[] = topKeywords.map(keyword => {
    const monthlySearchVolume = volumeMap.get(keyword) || 0;
    
    return {
      keyword,
      monthlySearchVolume,
      competition: estimateCompetition(monthlySearchVolume),
      trend: estimateTrend(monthlySearchVolume),
    };
  });
  
  // 검색량 기준 내림차순 정렬
  return exposureData.sort((a, b) => b.monthlySearchVolume - a.monthlySearchVolume);
}
