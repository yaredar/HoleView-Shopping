
import { GoogleGenAI } from "@google/genai";

export const generateMarketReport = async (data: any) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this marketplace data: ${JSON.stringify(data)}. Provide a professional 3-sentence summary.`,
    });
    return response.text || "Report unavailable.";
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Error generating AI insight.";
  }
};
