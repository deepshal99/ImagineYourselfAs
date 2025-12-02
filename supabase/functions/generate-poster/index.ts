import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory deduplication cache (per instance)
// Stores request hashes with timestamps to prevent duplicate rapid requests
const recentRequests = new Map<string, number>();
const DEDUP_WINDOW_MS = 5000; // 5 second window

// Clean old entries periodically
const cleanupDedup = () => {
  const now = Date.now();
  for (const [key, timestamp] of recentRequests.entries()) {
    if (now - timestamp > DEDUP_WINDOW_MS) {
      recentRequests.delete(key);
    }
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let creditDeducted = false;
  let userForRefund = null;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        throw new Error('Missing Authorization header');
    }

    // Initialize Supabase Client acting AS THE USER
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Initialize Admin Client for Refunds (Service Role)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the token is valid
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
        throw new Error('Invalid user token');
    }
    userForRefund = user;

    // 3. Deduct Credit (Atomic Operation)
    // The RPC 'consume_credit' returns true if successful (or unlimited), false if insufficient
    const { data: creditSuccess, error: creditError } = await supabaseClient.rpc('consume_credit');

    if (creditError) {
        throw new Error(`Credit check failed: ${creditError.message}`);
    }

    if (!creditSuccess) {
        throw new Error("Insufficient credits. Please purchase more.");
    }
    
    // Check if user is unlimited to know if we need to refund
    // Wait, consume_credit returns TRUE for unlimited too.
    // If we refund blindly, unlimited users gain credits!
    // We need to know if we ACTUALLY deducted.
    // The current 'consume_credit' returns boolean success, not "deducted count".
    // However, checking 'is_unlimited' first is safer.
    
    // Let's check if user is unlimited first using admin client (or user client)
    const { data: creditData } = await supabaseClient
        .from('user_credits')
        .select('is_unlimited')
        .eq('user_id', user.id)
        .single();
        
    const isUnlimited = creditData?.is_unlimited;
    if (!isUnlimited) {
        creditDeducted = true;
    }

    // 4. Parse Request
    const { base64Image, prompt, cachedFaceDescription, requestId } = await req.json();

    if (!base64Image || !prompt) {
      throw new Error("Missing 'base64Image' or 'prompt' in request body");
    }

    // ---------------------------------------------------------
    // REQUEST DEDUPLICATION
    // ---------------------------------------------------------
    // Create a hash of the request to detect duplicates
    const encoder = new TextEncoder();
    const data = encoder.encode(`${base64Image.substring(0, 100)}:${prompt.substring(0, 50)}:${requestId || ''}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const requestHash = hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Check for duplicate request within window
    cleanupDedup();
    const lastRequestTime = recentRequests.get(requestHash);
    if (lastRequestTime && Date.now() - lastRequestTime < DEDUP_WINDOW_MS) {
      console.log(`Duplicate request detected (hash: ${requestHash}), rejecting`);
      return new Response(JSON.stringify({ 
        error: "Duplicate request detected. Please wait a moment before retrying.",
        isDuplicate: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      });
    }
    
    // Mark this request as in-progress
    recentRequests.set(requestHash, Date.now());

    // Retrieve API Key
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    // ---------------------------------------------------------
    // STEP 1: Describe the Face (Using Gemini 2.5 Flash)
    // OPTIMIZATION: Skip if cachedFaceDescription is provided
    // ---------------------------------------------------------
    let faceDescription: string;
    
    if (cachedFaceDescription && typeof cachedFaceDescription === 'string' && cachedFaceDescription.length > 20) {
      // Use cached description - saves one API call!
      console.log("Step 1: Using CACHED face description (saving API call)");
      faceDescription = cachedFaceDescription;
    } else {
      // Generate new face description
      const visionUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      console.log("Step 1: Analyzing Face (new request)...");
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
      faceDescription = visionData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!faceDescription) {
          throw new Error("Failed to generate face description");
      }
    }

    console.log("Face Description:", faceDescription.substring(0, 100) + "...");


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
    const finalPrompt = `Movie poster style. ${prompt}. Use the attached reference image for the main character's face. The character should look exactly like the person in the image (Ethnicity: ${faceDescription}). High quality, cinematic lighting. IMPORTANT: Do not include specific names in the credits (like '[Person's Name]') or large titles unless strictly necessary. If text is needed, use generic or illegible text for credits.`;
    
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

    // Return the image AND the face description (for client-side caching)
    // This allows subsequent generations with the same photo to skip the vision API call
    return new Response(JSON.stringify({ 
      image: resultImage,
      faceDescription: faceDescription, // Client should cache this!
      cached: !!cachedFaceDescription // Indicates if we used cached description
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Function Error:", error);

    // Attempt Refund if credit was deducted
    if (creditDeducted && userForRefund) {
        try {
            console.log(`Refunding credit for user ${userForRefund.id} due to failure...`);
            // Re-init Admin Client for refund
            const refundClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );
            
            const { data: curr } = await refundClient
                .from('user_credits')
                .select('credits')
                .eq('user_id', userForRefund.id)
                .single();
            
            if (curr) {
                await refundClient
                    .from('user_credits')
                    .update({ credits: curr.credits + 1 })
                    .eq('user_id', userForRefund.id);
                console.log("Refund successful.");
            }
        } catch (refundError) {
            console.error("CRITICAL: Failed to refund credit!", refundError);
        }
    }

    // Return the ACTUAL error message to the client for debugging
    return new Response(JSON.stringify({ 
        error: error.message || "Unknown error",
        details: error.stack 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
