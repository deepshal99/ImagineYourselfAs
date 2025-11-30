
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    const API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in Edge Function secrets");
    }

    console.log(`Generating asset for: ${prompt.substring(0, 50)}...`);

    // Use Imagen 3 via Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [
          { prompt: prompt }
        ],
        parameters: {
          aspectRatio: "2:3",
          sampleCount: 1
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      throw new Error(`Gemini API Error: ${errText}`);
    }

    const data = await response.json();
    let base64Image = null;
    
    if (data.predictions && data.predictions[0]) {
       if (data.predictions[0].bytesBase64Encoded) {
          base64Image = data.predictions[0].bytesBase64Encoded;
       } else if (data.predictions[0].b64) {
          base64Image = data.predictions[0].b64;
       }
    }

    if (!base64Image) {
      console.error("No image data in response:", JSON.stringify(data));
      throw new Error("No image data found in response");
    }

    return new Response(
      JSON.stringify({ image: base64Image }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

