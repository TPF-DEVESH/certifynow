
import { GoogleGenAI, Type } from "@google/genai";

export const generateEmailCopy = async (projectName: string, context: string) => {
  // Always initialize with named parameter and process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Write a professional email for a certificate delivery platform. 
  Project Name: ${projectName}. 
  Additional Context: ${context}.
  Requirements: 
  1. Include placeholders like {Name} and {CertID}.
  2. Tone: Professional and celebratory.
  3. Respond in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING }
          },
          required: ["subject", "body"]
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("AI Generation failed:", error);
    return null;
  }
};
