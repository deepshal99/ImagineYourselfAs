import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { base64Image, prompt } = await req.json();

    if (!base64Image || !prompt) {
      throw new Error("Missing 'base64Image' or 'prompt' in request body");
    }

    // Retrieve API Key
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    // ---------------------------------------------------------
    // STEP 1: Describe the Face (Using Gemini 1.5 Flash)
    // ---------------------------------------------------------
    // 0. DIAGNOSTIC: List Models
    // This will help us see what models are actually available if we get 404s.
    /*
    try {
        const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listResp = await fetch(listModelsUrl);
        const listData = await listResp.json();
        console.log("Available Models:", listData.models?.map((m:any) => m.name).join(", "));
    } catch (e) {
        console.error("Failed to list models", e);
    }
    */

    // 1. First, describe the user's face using a Vision model
    // We are using 'gemini-2.5-flash' as per the 2025 updates.
    // If this fails, check the logs for the ListModels output (uncomment above if needed).
    const visionUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    console.log("Step 1: Analyzing Face...");
    const visionResponse = await fetch(visionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: 'image/jpeg', data: cleanBase64 } },
            { text: "Describe the physical appearance of the person in this image in detail (gender, age, hair style/color, facial features, ethnicity). Be concise." }
          ]
        }]
      })
    });

    if (!visionResponse.ok) {
        const errText = await visionResponse.text();
        console.error("Vision API Error:", errText);
        throw new Error(`Vision Step Failed: ${errText}`);
    }

    const visionData = await visionResponse.json();
    const faceDescription = visionData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!faceDescription) {
        throw new Error("Failed to generate face description");
    }

    console.log("Face Description:", faceDescription);


    // ---------------------------------------------------------
    // STEP 2: Generate Poster (Using Imagen 3 / Gemini Image Model)
    // ---------------------------------------------------------
    // We use the model you requested: gemini-3-pro-image-preview or a known working fallback.
    // Note: "gemini-3-pro-image-preview" might be restricted or named differently.
    // We will try the standard Imagen 3 endpoint if available, or fallback to a known working one.
    
    // Use the exact model name requested.
    // We wrap this in a try/catch to support fallback if the experimental model is missing.
    let modelName = "gemini-3-pro-image-preview"; 
    let genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // 2. Generate the Poster using the requested model (Strictly)
    // We combine the original prompt with the face description AND the reference image
    // because gemini-3-pro-image-preview supports multimodal input.
    const finalPrompt = `Movie poster style. ${prompt}. Use the attached reference image for the main character's face. The character should look exactly like the person in the image (Ethnicity: ${faceDescription}). High quality, cinematic lighting.`;
    
    console.log("Step 2: Generating Image with prompt:", finalPrompt);

    let genResponse = await fetch(genUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
            parts: [
                { text: finalPrompt },
                // Pass the original image to the generation model for reference
                { inline_data: { mime_type: 'image/jpeg', data: cleanBase64 } }
            ] 
        }],
        generationConfig: {
            imageConfig: {
                aspectRatio: "1:1"
            }
        }
      })
    });

    // FALLBACK LOGIC
    if (!genResponse.ok && genResponse.status === 404) {
         console.warn(`${modelName} not found, falling back to imagen-3.0-generate-001`);
         modelName = "imagen-3.0-generate-001";
         genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
         
         genResponse = await fetch(genUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: finalPrompt }] }],
                 generationConfig: {
                    imageConfig: {
                        aspectRatio: "1:1"
                    }
                }
            })
         });
    }

    if (!genResponse.ok) {
        const errText = await genResponse.text();
        console.error("Generation API Error:", errText);
        throw new Error(`Generation Step Failed (${modelName}): ${errText}`);
    }

    const genData = await genResponse.json();
    
    let resultImage = null;
    const parts = genData.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
        // Check for snake_case
        if (part.inline_data) {
            resultImage = `data:image/png;base64,${part.inline_data.data}`;
            break;
        }
        // Check for camelCase (sometimes returned by certain endpoints)
        if (part.inlineData) {
            resultImage = `data:image/png;base64,${part.inlineData.data}`;
            break;
        }
    }

    if (!resultImage) {
        console.error("No image found. Full Response:", JSON.stringify(genData));
        // Return the JSON so the client can see the refusal text if any
        throw new Error(`No image data found. Model response: ${JSON.stringify(genData).substring(0, 200)}...`);
    }

    return new Response(JSON.stringify({ image: resultImage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function Error:", error);
    // Return the ACTUAL error message to the client for debugging
    return new Response(JSON.stringify({ 
        error: error.message,
        details: error.stack 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
