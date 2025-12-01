import { supabase } from '../lib/supabase';

// Types for generation result
export interface GenerationResult {
  image: string;
  faceDescription: string;
  cached: boolean;
}

// Generate a simple hash for the image (for cache keying)
export const generateImageHash = async (base64Image: string): Promise<string> => {
  // Use first 10KB of image data for hashing (sufficient for uniqueness, fast to compute)
  const imageData = base64Image.substring(0, 10000);
  const encoder = new TextEncoder();
  const data = encoder.encode(imageData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
};

export const generatePersonaImage = async (
  base64Image: string,
  prompt: string,
  cachedFaceDescription?: string | null
): Promise<GenerationResult> => {
  try {
    // Generate a unique request ID to help with deduplication
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const { data, error } = await supabase.functions.invoke('generate-poster', {
      body: { 
        base64Image, 
        prompt,
        cachedFaceDescription: cachedFaceDescription || undefined,
        requestId
      },
    });

    if (error) {
      // CRITICAL: Try to parse the response body from the error context if available
      let serverError = "Unknown Edge Function Error";
      let isDuplicate = false;
      
      if (error && typeof error === 'object' && 'context' in error) {
         try {
            // @ts-ignore
            const errorContext = await error.context.json();
            if (errorContext.error) serverError = errorContext.error;
            if (errorContext.isDuplicate) isDuplicate = true;
         } catch (e) {
            // ignore
         }
      }

      // Handle duplicate request gracefully
      if (isDuplicate) {
        throw new Error("Request already in progress. Please wait...");
      }

      throw new Error(`Edge Function Failed: ${serverError}`);
    }

    if (!data || !data.image) {
      throw new Error(data?.error || "No image returned from generation service");
    }

    return {
      image: data.image,
      faceDescription: data.faceDescription || '',
      cached: data.cached || false
    };

  } catch (error: any) {
    console.error("Generation Service Error:", error);
    throw new Error(error.message || "Failed to generate poster");
  }
};
