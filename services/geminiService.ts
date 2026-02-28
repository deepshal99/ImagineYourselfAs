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
  cachedFaceDescription?: string | null,
  userName?: string | null,
  personaId?: string | null,
  referenceImage?: string | null,
  referenceDescription?: string | null
): Promise<GenerationResult> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User must be logged in");
  }

  const { data, error } = await supabase.functions.invoke('generate-poster', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: {
      base64Image,
      prompt,
      cachedFaceDescription: cachedFaceDescription || undefined,
      userName: userName || undefined,
      personaId: personaId || undefined,
      referenceImage: referenceImage || undefined,
      referenceDescription: referenceDescription || undefined,
    },
  });

  if (error) {
    console.error("Generation Error:", error);
    let message = error.message || "Failed to generate image";

    // Handle network/fetch errors (FunctionsFetchError)
    if (error.name === 'FunctionsFetchError' || message.includes('Failed to send a request')) {
      message = "Connection to the server failed. This could be due to network issues or high demand. Please try again.";
    }
    // Handle HTML response errors (auth redirect / function not found)
    else if (message.includes('<!DOCTYPE') || message.includes('Unexpected token')) {
      message = "Authentication session expired. Please sign out and sign in again.";
    }
    // Handle timeout errors
    else if (message.includes('timed out') || message.includes('timeout') || message.includes('AbortError')) {
      message = "Generation timed out. The AI model is experiencing high load. Please try again.";
    }
    // Attempt to extract the actual error message from the response body
    else if (error instanceof Error && 'context' in error) {
      try {
        // @ts-ignore - context exists on FunctionsHttpError
        const body = await error.context.json();
        if (body && body.error) {
          message = body.error;
        }
      } catch (e) {
        console.warn("Failed to parse error body:", e);
      }
    }

    throw new Error(message);
  }

  return {
    image: data.image,
    faceDescription: data.faceDescription || '',
    cached: data.cached || false
  };
};
