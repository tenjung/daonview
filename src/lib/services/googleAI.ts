import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Google Gemini를 사용하여 콘텐츠를 생성합니다. (텍스트 + 이미지 지원)
 */
export async function generateWithGemini(
  prompt: string, 
  isJson: boolean = true,
  imagesB64: string[] = []
) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: isJson ? "application/json" : "text/plain",
      }
    });

    const promptParts: any[] = [prompt];
    
    // 이미지 추가 (Gemini 멀티모달 형식)
    for (const b64 of imagesB64) {
      const parts = b64.split(",");
      const mimeType = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const data = parts[1];
      
      promptParts.push({
        inlineData: {
          data,
          mimeType
        }
      });
    }

    const result = await model.generateContent(promptParts);
    const response = await result.response;
    const text = response.text();
    
    return isJson ? JSON.parse(text) : text;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("AI 생성 중 오류가 발생했습니다.");
  }
}

