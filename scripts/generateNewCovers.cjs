
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

// --- CONFIGURATION ---
const OUTPUT_DIR = path.join(__dirname, '../public/personas');
const API_KEY = process.env.GEMINI_API_KEY;

// Use Supabase Edge Function to generate assets (securely using server-side keys)
const SUPABASE_URL = "https://syemomuztccylkgjpjsy.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-asset`;

// --- DATA ---
const NEW_VIBE_PROMPTS = [
  { 
    id: "movie_fast", 
    prompt: "Fast & Furious movie poster, Vin Diesel style character, muscle cars, street racing, intense family vibe, cinematic action, hyper-realistic, 8k" 
  },
  { 
    id: "movie_dictator", 
    prompt: "The Dictator movie poster, Admiral General Aladeen style character, military uniform with many medals, big beard, sunglasses, extravagant palace background, comedy movie vibe, hyper-realistic" 
  },
  { 
    id: "movie_jurassic", 
    prompt: "Jurassic Park movie poster, character facing a T-Rex in the rain, jungle environment, survival gear, epic dinosaur adventure, cinematic lighting, hyper-realistic" 
  },
  { 
    id: "series_money", 
    prompt: "Money Heist (La Casa de Papel) series poster, character in red jumpsuit with Dali mask (holding it or wearing), Bank of Spain background, floating money, intense heist vibe, hyper-realistic" 
  },
  { 
    id: "series_alice", 
    prompt: "Alice in Borderland series poster, dystopian Tokyo deserted streets, playing cards floating, character with intense expression, survival game vibe, cinematic lighting, hyper-realistic" 
  },
  { 
    id: "series_mirzapur", 
    prompt: "Mirzapur series poster, Kaleen Bhaiya style character, rugged look, traditional Indian kurta with shawl, guns, dark intense throne room atmosphere, crime thriller vibe, hyper-realistic" 
  },
  { 
    id: "series_panchayat", 
    prompt: "Panchayat web series poster, Abhishek Tripathi style character standing with a bag, Indian village office background (Phulera), rustic and simple comedy-drama vibe, bright day, hyper-realistic" 
  },
  { 
    id: "series_familyman", 
    prompt: "The Family Man series poster, Manoj Bajpayee style character, middle-class man attire but holding a gun behind back, dual life vibe, Mumbai city backdrop, intense spy thriller, hyper-realistic" 
  }
];

// --- EXECUTION ---

if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const generateImage = async (item) => {
    const filename = `${item.id}.webp`;
    const filepath = path.join(OUTPUT_DIR, filename);

    if (fs.existsSync(filepath)) {
        console.log(`Skipping ${filename} (Exists)`);
        return;
    }

    console.log(`Generating ${filename}...`);

    try {
        // Call our own Edge Function which has the keys
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}` // If needed, but we made it open for now or use anon key
            },
            body: JSON.stringify({
                prompt: item.prompt
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Edge Function Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        const base64Image = data.image;

        if (!base64Image) {
            throw new Error("No image data found in response");
        }

        // Save to file
        const buffer = Buffer.from(base64Image, 'base64');
        fs.writeFileSync(filepath, buffer);
        console.log(`✅ Saved ${filename}`);

    } catch (error) {
        console.error(`❌ Failed to generate ${filename}:`, error.message);
        // Fallback to Pollinations if Google fails (e.g. model not available or quota)
        console.log("   Attempting fallback to Pollinations...");
        await generateFallback(item, filepath);
    }
};

const generateFallback = async (item, filepath) => {
    return new Promise((resolve, reject) => {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(item.prompt)}?width=300&height=450&nologo=true&model=flux`;
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                console.error(`Fallback failed: ${res.statusCode}`);
                resolve(); // Don't crash, just skip
                return;
            }
            const fileStream = fs.createWriteStream(filepath);
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`✅ Saved ${path.basename(filepath)} (Fallback)`);
                resolve();
            });
        }).on('error', (err) => {
            console.error("Fallback error:", err.message);
            resolve();
        });
    });
}

const main = async () => {
    if (!API_KEY) {
        console.warn("⚠️ GEMINI_API_KEY not found in .env. Using fallback for all.");
    }
    
    for (const item of NEW_VIBE_PROMPTS) {
        await generateImage(item);
    }
};

main();

