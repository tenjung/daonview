import { analyzeKeywords } from './src/lib/analyzers/keywordAnalyzer';

async function test() {
  const sampleText = `
    안녕하세 이번 주말에 다녀온 강남역 맛집 후기를 남겨봅니다.
    정말 너무 맛있었고 친구들과 좋은 시간을 보냈어요.
    여기 시그니처 메뉴인 한우 곱창 전골은 진짜 최고였습니다.
    다음에 또 방문할 의사가 100% 있습니다.
    강남역 근처에서 모임 장소 찾으시는 분들께 강력 추천합니다!
    가격도 합리적이고 직원분들도 무척 친절하셨어요.
    #강남역맛집 #한우곱창전골 #주말모임
  `;

  console.log('Testing AI keyword extraction...');
  try {
    const result = await analyzeKeywords(sampleText);
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
