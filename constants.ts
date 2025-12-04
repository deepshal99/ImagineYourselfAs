import { Persona } from "./types.ts";

// STRICT PROMPT TEMPLATE
export const buildPrompt = (universe: string, style: string) =>
  `Create a high-quality movie poster featuring the person in the uploaded image as a main character in the ${universe} universe.
   
   CRITICAL INSTRUCTION: Analyze the uploaded person's gender and features. Generate a character design (costume, hair, styling) that fits them perfectly into this world. Do NOT force a specific existing character's identity if it conflicts with the user's appearance. The character should look like an original cast member.

   Visual Style & Vibe: ${style}.
   
   Maintain the face identity from the photo exactly, blending it seamlessly with the cinematic lighting and texture of the poster. High detail, 8k resolution, official key art style.`;


export const PERSONAS: Persona[] = [];
