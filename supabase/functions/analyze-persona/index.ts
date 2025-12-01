import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name } = await req.json();

    if (!name) {
      throw new Error("Name is required");
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    // Use Gemini to analyze the character/movie
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const systemPrompt = `
    You are an expert creative director for a movie poster AI app.
    Your task is to analyze the input name (which could be a movie, series, character, or game) and generate a persona profile.
    
    Return ONLY a JSON object with this structure:
    {
      "name": "Corrected Official Name",
      "category": "Movie" | "Series" | "YouTube" | "Other",
      "prompt": "The detailed image generation prompt",
      "color": "Hex color code matching the vibe (e.g. #FF0000 for Iron Man)"
    }

    PROMPT RULES:
    The prompt must follow this strict format:
    "[Universe/Style Name]. Signature elements: [Comma separated visual elements, costume details, background elements]. Lighting: [Lighting style]. Atmosphere: [Mood/Vibe]."
    
    Example Prompts:
    - "Breaking Bad. Gritty crime drama. Signature elements: Yellow hazmat suits, gas masks, desert landscapes, RVs. Lighting: Harsh desert sun, yellow color grading. Atmosphere: Intense, dangerous, raw."
    - "Dune. Cinematic sci-fi desert aesthetic. Signature elements: Stillsuits, desert robes, vast sand dunes, spice particles. Lighting: Golden hour sun or cool blue shadows. Atmosphere: Epic, serious, mysterious."

    Input Name: "${name}"
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Robustly clean the response to find the JSON object
    // We strictly look for the first '{' and the last '}'
    let cleanJson = text;
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');
    
    if (firstOpen !== -1 && lastClose !== -1) {
        cleanJson = text.substring(firstOpen, lastClose + 1);
    } else {
        // Fallback: simple cleanup if braces aren't found (unlikely for JSON)
        console.warn("No braces found in response, attempting regex cleanup");
        cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    }

    let result;
    try {
        result = JSON.parse(cleanJson);
    } catch (e: any) {
        console.error("JSON Parse Error. Raw text:", text);
        console.error("Attempted Cleaned text:", cleanJson);
        
        // Final attempt: sometimes there are hidden characters or newlines messed up
        try {
             // aggressive regex to keep only json characters? No that breaks strings.
             // Just return a friendly error.
             throw new Error(`Failed to parse AI response: ${e.message}`);
        } catch (_e2) {
             throw new Error("Failed to parse AI response. Please try again.");
        }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
