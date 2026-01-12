import axios from "axios";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

/**
 * 네이버 검색 API를 사용하여 장소 정보를 가져옵니다.
 */
export async function fetchNaverPlaceDetails(storeName: string) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.warn("Naver API Key가 설정되지 않았습니다.");
    return null;
  }

  try {
    const response = await axios.get(
      "https://openapi.naver.com/v1/search/local.json",
      {
        params: {
          query: storeName,
          display: 1,
          start: 1,
          sort: "random",
        },
        headers: {
          "X-Naver-Client-Id": NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
        },
      }
    );

    const place = response.data.items?.[0];
    if (!place) return null;

    // HTML 태그 제거 (네이버 검색 결과에는 <b> 등 태그가 포함됨)
    const cleanTitle = place.title.replace(/<[^>]*>?/gm, "");
    const cleanAddress = place.address.replace(/<[^>]*>?/gm, "");

    return {
      name: cleanTitle,
      address: cleanAddress,
      roadAddress: place.roadAddress,
      phone: place.telephone || "정보 없음",
      category: place.category,
      link: place.link,
      isVerified: true,
      source: "NAVER"
    };
  } catch (error) {
    console.error("Naver Place API Error:", error);
    return null;
  }
}
