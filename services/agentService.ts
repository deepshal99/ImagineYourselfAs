import { GoogleGenAI } from "@google/genai";
import { Persona, PersonaCategory } from "../types";
import { buildPrompt, getFallbackCoverUrl } from "../constants";

// This service acts as the "Agent" that finds new characters/trends
export const fetchTrendingPersonas = async (currentCount: number): Promise<Persona[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `You are a creative AI Agent for a 'Face Swap' style app. 
            Generate 4 NEW, unique, and trending persona ideas that are NOT in the standard list.
            Focus on specific MOVIE POSTERS, POPULAR SERIES CHARACTERS, or ICONIC POP CULTURE SCENES.
            
            Return ONLY a JSON array of objects.
            Schema: 
            [
              {
                "name": "Short Name (e.g. Breaking Bad)",
                "category": "One of: Modern, Futuristic, Fantasy, Historical, Artistic, Aesthetic",
                "visualDescription": "A highly detailed visual description of the outfit, background, and lighting for an image generation prompt. Describe it like a movie poster prompt. Do NOT include 'Transform this person', just describe the target look."
              }
            ]
            
            Examples of ideas: Game of Thrones Jon Snow, Walter White in lab, Joker on stairs, Barbie in pink world, Matrix Neo, Spiderman swinging.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      
      // Transform into App-compatible Persona objects
      return data.map((item: any, index: number) => {
        const id = `agent_${Date.now()}_${index}`;
        const prompt = buildPrompt(item.name, item.visualDescription);
        
        return {
          id: id,
          name: item.name,
          category: item.category as PersonaCategory,
          prompt: prompt,
          // Generate a dynamic cover URL since we don't have a local file for AI-generated trends
          cover: getFallbackCoverUrl(item.name, item.visualDescription)
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Agent failed to fetch trends:", error);
    return [];
  }
};