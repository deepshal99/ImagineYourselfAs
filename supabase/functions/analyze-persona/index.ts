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
    const { name, imageUrl } = await req.json();

    if (!name && !imageUrl) {
      throw new Error("Name or Image URL is required");
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    // Use Gemini to analyze the character/movie
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    let systemPrompt = `
    You are an expert creative director for a movie poster AI app.
    Your task is to analyze the input (name or reference image) and generate a persona profile.
    
    Return ONLY a JSON object with this structure:
    {
      "name": "Corrected Official Name",
      "category": "Movie" | "Series" | "YouTube" | "Other",
      "prompt": "The detailed image generation prompt",
      "reference_description": "A highly detailed visual description of the reference image (composition, lighting, style, key elements) - ONLY if image provided",
      "color": "Hex color code matching the vibe"
    }

    PROMPT RULES:
    The prompt must follow this strict format:
    "[Universe/Style Name]. Signature elements: [Comma separated visual elements, costume details, background elements]. Lighting: [Lighting style]. Atmosphere: [Mood/Vibe]."
    
    If an image is provided, focus the "prompt" on the core character elements and the "reference_description" EXCLUSIVELY on the visual style/direction (composition, lighting, color palette).
    
    The "reference_description" will be used to SUPPLEMENT the main prompt, not replace it.
    
    Input Name: "${name || 'See attached image'}"
    `;

    const parts: any[] = [{ text: systemPrompt }];

    if (imageUrl) {
      try {
        const resp = await fetch(imageUrl);
        const blob = await resp.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        parts.push({ inline_data: { mime_type: blob.type || 'image/jpeg', data: base64 } });
      } catch (e) {
        console.error("Failed to fetch image for analysis:", e);
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }]
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
