import { analyzeKeywords } from './src/lib/analyzers/keywordAnalyzer';

async function runTest() {
  const sampleText = `안녕하세요! 오늘은 강남역 맛집 추천해드릴게요. 
최근에 다녀온 고기집이 정말 맛있었어요. 특히 삼겹살 구이가 육즙이 가득해서 아주 좋았답니다. 
강남역 근처 삼겹살 맛집 찾으신다면 꼭 한번 방문해 보세요. 위치도 강남역 11번 출구에서 가까워서 모임 장소로 딱입니다. 
다음번에도 회식이 있다면 이곳으로 가고 싶어요.`;
  
  console.log('--- Analyzing ---');
  try {
    const result = await analyzeKeywords(sampleText);
    console.log(JSON.stringify(result, null, 2));
  } catch(e) {
    console.error(e);
  }
}

runTest();
