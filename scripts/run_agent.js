/**
 * ADMIN SCRIPT: Run the AI Agent to discover new personas and add them to Supabase.
 * Usage: node scripts/run_agent.js
 * Requires: .env file with GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

// --- CONFIG ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // MUST use Service Key for bypass

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Missing environment variables. Please check .env for GEMINI_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_KEY.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- HELPERS ---

const buildPrompt = (universe, style) => 
  `Create a high-quality movie poster featuring the person in the uploaded image as a main character in the ${universe} universe.
   
   CRITICAL INSTRUCTION: Analyze the uploaded person's gender and features. Generate a character design (costume, hair, styling) that fits them perfectly into this world. Do NOT force a specific existing character's identity if it conflicts with the user's appearance. The character should look like an original cast member.

   Visual Style & Vibe: ${style}.
   
   Maintain the face identity from the photo exactly, blending it seamlessly with the cinematic lighting and texture of the poster. High detail, 8k resolution, official key art style.`;

const getFallbackCoverUrl = (prompt) => {
    const vibePrompt = `${prompt}. Atmospheric background, high quality, 8k, wallpaper, no people, photorealistic`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(vibePrompt)}?width=300&height=450&nologo=true&seed=${Math.floor(Math.random()*1000)}&model=flux`;
};

// --- MAIN LOGIC ---

const fetchTrendingPersonas = async () => {
    console.log("🕵️‍♂️  Agent is hunting for new trends...");
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              text: `You are a creative AI Agent for a 'Face Swap' style app. 
              Generate 4 NEW, unique, and trending persona ideas that are NOT in the standard list.
              Focus on specific MOVIE POSTERS, POPULAR SERIES CHARACTERS, or ICONIC POP CULTURE SCENES.
              
              Return ONLY a JSON array of objects.
              Schema: 
              [
                {
                  "name": "Short Name (e.g. Breaking Bad)",
                  "category": "One of: Movie, Series, YouTube, Other",
                  "visualDescription": "A highly detailed visual description of the outfit, background, and lighting for an image generation prompt. Describe it like a movie poster prompt. Do NOT include 'Transform this person', just describe the target look."
                }
              ]
              
              Examples of ideas: Game of Thrones Jon Snow, Walter White in lab, Joker on stairs, Barbie in pink world, Matrix Neo, Spiderman swinging.
              `
            }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });
  
      if (response.data && response.data.candidates && response.data.candidates[0].content.parts[0].text) {
        const text = response.data.candidates[0].content.parts[0].text;
        const data = JSON.parse(text);
        return data;
      }
      return [];
    } catch (error) {
      console.error("❌ Agent failed to fetch trends:", error);
      return [];
    }
};

const run = async () => {
    const newItems = await fetchTrendingPersonas();
    
    if (newItems.length === 0) {
        console.log("⚠️  No new trends found.");
        return;
    }

    console.log(`✨ Found ${newItems.length} potential personas. Processing...`);

    let addedCount = 0;

    for (const item of newItems) {
        const id = `agent_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        const prompt = buildPrompt(item.name, item.visualDescription);
        const cover = getFallbackCoverUrl(item.name + " " + item.visualDescription);

        const persona = {
            id,
            name: item.name,
            category: item.category,
            cover,
            prompt
        };

        try {
            const { error } = await supabase.from('discovered_personas').insert(persona);
            if (error) {
                console.error(`❌ Failed to add ${item.name}:`, error.message);
            } else {
                console.log(`✅ Added: ${item.name}`);
                addedCount++;
            }
        } catch (e) {
            console.error(`❌ Error adding ${item.name}:`, e.message);
        }
    }

    console.log(`\n🎉 Job Complete. Added ${addedCount} new personas.`);
};

run();

