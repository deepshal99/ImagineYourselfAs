import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let creditDeducted = false;
  let userId = null;

  try {
    // 2. Setup Supabase Client (User Context)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 3. Verify User
    console.log("Verifying user...");
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth Error:", authError);
      throw new Error(`Unauthorized: ${authError?.message || 'Invalid Token'}`);
    }
    userId = user.id;
    console.log(`User verified: ${userId}`);
    // 4. Deduct Credit
    const { data: success, error: creditError } = await supabaseClient.rpc('consume_credit');
    if (creditError) throw new Error(`Credit check failed: ${creditError.message}`);
    if (!success) throw new Error("Insufficient credits");

    creditDeducted = true; // Mark as deducted for potential refund

    // 5. Parse Request
    const { base64Image, prompt, cachedFaceDescription, userName, personaId } = await req.json();
    if (!base64Image || !prompt) throw new Error("Missing required fields");

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("Server configuration error: Missing API Key");

    // 6. Generate Content (Linear Flow)

    // Step A: Face Description (if not cached)
    let faceDescription = cachedFaceDescription;
    if (!faceDescription) {
      const visionResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: base64Image.split(',')[1] || base64Image } },
              { text: "Describe the physical appearance of the person in this image in detail (gender, age, hair style/color, facial features, ethnicity). Be concise." }
            ]
          }]
        })
      });

      if (!visionResp.ok) throw new Error(`Vision API failed: ${await visionResp.text()}`);
      const visionData = await visionResp.json();
      faceDescription = visionData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!faceDescription) throw new Error("Failed to analyze face");
    }

    // Step B: Image Generation
    // const starringText = userName ? ` Starring ${userName}.` : '';
    const finalPrompt = `Movie poster style. ${prompt}. Use the attached reference image for the main character's face. The character should look exactly like the person in the image (Ethnicity: ${faceDescription}). High quality, cinematic lighting.`;

    // Try primary model, fallback to standard if needed
    let model = "gemini-3-pro-image-preview"; // Or "imagen-3.0-generate-001"
    let genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    console.log(`Generating with config:`, {
      model,
      imageSize: base64Image.length,
      hasPrompt: !!prompt
    });

    let genResp = await fetch(genUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: finalPrompt },
            { inline_data: { mime_type: 'image/jpeg', data: base64Image.split(',')[1] || base64Image } }
          ]
        }],
        generationConfig: {
          temperature: 1.0,
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: "1:1",
            // imageSize: "2K"
          }
        }
      })
    });



    if (!genResp.ok) throw new Error(`Generation failed: ${await genResp.text()}`);

    const genData = await genResp.json();
    let resultImage = null;
    const parts = genData.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inline_data) resultImage = `data:image/png;base64,${part.inline_data.data}`;
      else if (part.inlineData) resultImage = `data:image/png;base64,${part.inlineData.data}`;
    }

    if (!resultImage) throw new Error("No image generated");

    // 7. Auto-save to Storage and DB
    let savedImageUrl = null;
    try {
      // Create admin client for storage access
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Extract base64 data and convert to Uint8Array
      const base64Data = resultImage.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload to storage
      const fileName = `${userId}/${Date.now()}.png`;
      const { error: uploadError } = await adminClient.storage
        .from('creations')
        .upload(fileName, bytes, { contentType: 'image/png' });

      if (!uploadError) {
        const { data: { publicUrl } } = adminClient.storage
          .from('creations')
          .getPublicUrl(fileName);
        savedImageUrl = publicUrl;

        // Save to creations table
        await adminClient.from('creations').insert({
          user_id: userId,
          persona_id: personaId || 'unknown',
          image_url: savedImageUrl
        });
      } else {
        console.warn("Failed to upload image:", uploadError);
      }
    } catch (saveError) {
      // Don't fail the request if save fails - just log it
      console.warn("Failed to auto-save image:", saveError);
    }

    // 8. Success Response
    return new Response(JSON.stringify({
      image: resultImage,
      faceDescription,
      cached: !!cachedFaceDescription,
      savedUrl: savedImageUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error("❌ Edge Function Error:", error);
    console.error("Stack:", error.stack);

    // 8. Refund Logic
    if (creditDeducted && userId) {
      try {
        console.log("Attempting refund for user:", userId);
        const adminClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await adminClient.rpc('admin_refund_credit', { target_user_id: userId });
        console.log(`Refunded credit for user ${userId}`);
      } catch (refundError) {
        console.error("Failed to refund:", refundError);
      }
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
