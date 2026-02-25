/**
 * 라이브러리 및 특수 설정을 전혀 사용하지 않는 
 * 가장 순수한 REST API 호출 방식입니다.
 */
export async function generateWithGemini(
  prompt: string, 
  isJson: boolean = true,
  imagesB64: string[] = []
) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY가 설정되지 않았습니다.");

  // 근본적인 해결: 현재 지원 목록에 있는 gemini-2.0-flash 사용
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const parts: any[] = [{ text: prompt }];

    // 이미지 처리
    for (const b64 of imagesB64) {
      if (!b64.includes(',')) continue;
      const [header, data] = b64.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: data
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        // 모든 충돌 가능성이 있는 generationConfig를 비우거나 최소화합니다.
        generationConfig: {
          temperature: 0.7,
        }
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error Response:", result);
      throw new Error(result.error?.message || "API 호출에 실패했습니다.");
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("AI 응답 본문이 비어 있습니다.");

    if (!isJson) return text;

    // AI가 응답에 섞어놓은 마크다운(```json ... ```)을 강제로 제거하고 순수 JSON만 추출
    try {
      let cleanJson = text;
      if (cleanJson.includes("```")) {
        cleanJson = cleanJson.split(/```(?:json)?/)[1].split("```")[0].trim();
      }
      return JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON Parsing failed. Raw text:", text);
      // 만약 파싱에 실패하면 텍스트 내에서 { } 구간만이라도 찾아보려고 시도
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error("AI 응답을 데이터로 변환하는 데 실패했습니다.");
    }

  } catch (error: any) {
    console.error("Gemini Final Error:", error);
    throw new Error(`AI 서비스 연결 실패: ${error.message}`);
  }
}
