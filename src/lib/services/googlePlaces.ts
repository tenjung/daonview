import axios from "axios";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

/**
 * Google Places API를 사용하여 장소의 상세 정보를 가져옵니다.
 */
export async function fetchPlaceDetails(storeName: string) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API Key가 설정되지 않았습니다.");
    return null;
  }

  try {
    // 1. 장소 검색 (Place Search)
    const searchRes = await axios.get(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json`,
      {
        params: {
          input: storeName,
          inputtype: "textquery",
          fields: "place_id,name,formatted_address",
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    );

    const place = searchRes.data.candidates?.[0];
    if (!place) return null;

    // 2. 장소 상세 정보 (Place Details)
    const detailsRes = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: place.place_id,
          fields: "name,formatted_address,formatted_phone_number,opening_hours,rating,editorial_summary",
          language: "ko",
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    );

    const details = detailsRes.data.result;

    return {
      name: details.name,
      address: details.formatted_address,
      phone: details.formatted_phone_number,
      hours: details.opening_hours?.weekday_text?.join(", ") || "정보 없음",
      rating: details.rating,
      summary: details.editorial_summary?.overview,
      isVerified: true,
    };
  } catch (error) {
    console.error("Google Places API Error:", error);
    return null;
  }
}
