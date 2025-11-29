import { GoogleGenAI } from "@google/genai";

export const generatePersonaImage = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  
  // Clean base64 string if it contains metadata prefix
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  // Use the defined process.env.API_KEY from vite config
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.includes('demo-key')) {
      throw new Error("Invalid API Key. Please check your .env file.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    console.log("Generating with model: gemini-3-pro-image-preview");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        imageConfig: {
            imageSize: '1K',
            aspectRatio: '1:1',
            imageCount: 1
        }
      }
    });

    console.log("Gemini Response Candidates:", response.candidates?.length);

    // Parse response for image data
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    
    // If we get here, no image was found in the parts
    console.warn("Full Response:", JSON.stringify(response, null, 2));
    throw new Error("Model returned no image data. Check if model supports image generation.");

  } catch (error: any) {
    // Log the full error details to help debugging
    console.error("Gemini Generation Error Details:", error);
    
    // Extract more specific error message if available
    let errorMessage = error.message || "Unknown error";
    if (error.response) {
        errorMessage += ` (Status: ${error.response.status})`;
    }
    
    throw new Error(`Gemini Error: ${errorMessage}`);
  }
};
