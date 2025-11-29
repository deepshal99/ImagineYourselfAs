import { GoogleGenAI } from "@google/genai";

export const generatePersonaImage = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  
  // Clean base64 string if it contains metadata prefix
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming JPEG/PNG upload, SDK handles this
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        imageConfig: {
          imageSize: '1K',
          aspectRatio: "1:1",
        }
      }
    });

    // Parse response for image data
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image generated in response");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};