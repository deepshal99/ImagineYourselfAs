import { supabase } from '../lib/supabase';

export const generatePersonaImage = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-poster', {
      body: { base64Image, prompt },
    });

    if (error) {
      // CRITICAL: Try to parse the response body from the error context if available
      let serverError = "Unknown Edge Function Error";
      
      if (error && typeof error === 'object' && 'context' in error) {
         try {
            // @ts-ignore
            const errorContext = await error.context.json();
            if (errorContext.error) serverError = errorContext.error;
         } catch (e) {
            // ignore
         }
      }

      throw new Error(`Edge Function Failed: ${serverError}`);
    }

    if (!data || !data.image) {
      throw new Error(data?.error || "No image returned from generation service");
    }

    return data.image;

  } catch (error: any) {
    console.error("Generation Service Error:", error);
    throw new Error(error.message || "Failed to generate poster");
  }
};
