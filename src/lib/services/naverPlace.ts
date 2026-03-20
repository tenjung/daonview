import axios from "axios";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

/**
 * 네이버 검색 API를 사용하여 장소 정보를 가져옵니다.
 * 검색된 결과 리스트 전체를 반환하며, 결과가 없을 시 지능형 재검색을 시도합니다.
 */
export async function fetchNaverPlaceDetails(storeName: string) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.warn("Naver API Key가 설정되지 않았습니다.");
    return [];
  }

  const search = async (query: string) => {
    try {
      const res = await axios.get(
        "https://openapi.naver.com/v1/search/local.json",
        {
          params: { query, display: 5, start: 1, sort: "sim" },
          headers: {
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
          },
        }
      );
      return res.data.items || [];
    } catch (e) {
      return [];
    }
  };

  try {
    // 1단계: 원본 키워드로 검색
    let items = await search(storeName);

    // 2단계: 결과가 없고 입력값에 공백이 없는 경우, 지능형 띄어쓰기 보정 재검색
    if (items.length === 0 && !storeName.includes(" ")) {
      const attempt1 = storeName.slice(0, 2) + " " + storeName.slice(2);
      items = await search(attempt1);

      if (items.length === 0 && storeName.length > 3) {
        const attempt2 = storeName.slice(0, 3) + " " + storeName.slice(3);
        items = await search(attempt2);
      }
    }

    if (items.length === 0) return [];

    // 검색 결과 가공
    return items.map((place: any) => ({
      name: place.title.replace(/<[^>]*>?/gm, ""),
      address: place.address.replace(/<[^>]*>?/gm, ""),
      roadAddress: place.roadAddress,
      phone: place.telephone || "정보 없음",
      category: place.category,
      link: place.link,
      isVerified: true,
      source: "NAVER",
      hours: "정보 없음",
      images: []
    }));
  } catch (error) {
    console.error("Naver Place API Error:", error);
    return [];
  }
}
