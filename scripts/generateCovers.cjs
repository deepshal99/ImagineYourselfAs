/**
 * UTILITY SCRIPT: Auto-Generate Persona Vibe Covers
 * Usage: node scripts/generateCovers.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// --- CONFIGURATION ---
const OUTPUT_DIR = path.join(__dirname, '../public/personas');
const WIDTH = 300;
const HEIGHT = 450;
const BASE_DELAY_MS = 5000;
const MAX_RETRIES = 5;

// --- DATA ---
// Updated Prompts: Now includes Character/Human elements for covers
const VIBE_PROMPTS = [
  // --- MOVIES ---
  { 
    id: "movie_dune", 
    prompt: "Paul Atreides from Dune standing on a sand dune, wearing stillsuit armor, blue glowing eyes, epic sci-fi desert background, floating spice, cinematic lighting, movie poster style" 
  },
  { 
    id: "movie_batman", 
    prompt: "Batman standing on a Gotham City gargoyle in the rain, dark brooding atmosphere, cape flowing, city lights in background, The Dark Knight movie poster style, cinematic" 
  },
  { 
    id: "movie_oppenheimer", 
    prompt: "Silhouette of J. Robert Oppenheimer wearing a fedora and suit, standing in front of a nuclear test explosion, vintage film grain, dramatic lighting, 1940s aesthetic, movie poster" 
  },
  { 
    id: "movie_barbie", 
    prompt: "Margot Robbie as Barbie in the 2023 movie, wearing pink gingham dress, pink corvette in background, sunny Barbieland dreamhouse setting, pastel pink and blue colors, cinematic lighting, movie poster style" 
  },
  {
    id: "movie_f1",
    prompt: "Formula 1 racing poster background, blurred race cars on track, checkered flag motion, asphalt texture, stadium lights, adrenaline speed vibe, no people"
  },
  {
    id: "movie_harrypotter",
    prompt: "Hogwarts castle at night, floating candles, magical sparks, old parchment texture, wizarding world atmosphere, mysterious blue and gold lighting, no people"
  },

  // --- SERIES ---
  { 
    id: "series_stranger", 
    prompt: "Stranger Things cinematic poster, Eleven standing in front of a red glowing rift, dark blue foggy forest, retro 80s atmosphere, dramatic rim lighting, high detail, photorealistic style, full bleed, no borders" 
  },
  { 
    id: "series_thrones", 
    prompt: "Jon Snow sitting on the Iron Throne, wearing heavy fur cloak, holding Longclaw sword, dark medieval castle hall, dramatic lighting, Game of Thrones poster style" 
  },
  { 
    id: "series_squid", 
    prompt: "A group of Squid Game guards in red jumpsuits and masks standing on the colorful staircase maze, eerie atmosphere, survival drama poster style, high contrast" 
  },
  { 
    id: "series_breaking", 
    prompt: "Walter White in yellow hazmat suit holding a beaker, blue smoke rising, RV in the desert background, gritty yellow filter, Breaking Bad poster style, intense" 
  },
  {
    id: "series_friends",
    prompt: "Group of 6 friends sitting on an orange velvet couch in a coffee shop, laughing and drinking coffee, 90s fashion denim and sweaters, cozy warm lighting, Central Perk vibe, view from behind or silhouette, no specific faces"
  },
  {
    id: "series_office",
    prompt: "Office worker in a white shirt and tie looking at the camera with a deadpan expression, blurred busy office background with coworkers, fluorescent lighting, mockumentary style, slight motion blur, no specific faces"
  },
  {
    id: "series_twd",
    prompt: "Silhouette of a survivor holding a crossbow walking down an abandoned highway, sunrise, overgrown grass, zombies in the distance in shadows, gritty texture, atmospheric survival horror"
  },
  {
    id: "series_bcs",
    prompt: "Better Call Saul poster background, scales of justice, colorful tie, desert road, yellow tint, legal drama vibe, cinematic shadow, no people"      
  },
  {
    id: "series_tmkoc",
    prompt: "Group of neighbors in colorful Indian traditional clothes standing in a society courtyard, celebrating a festival, bright sunny day, joyful atmosphere, vibrant colors, view from a distance or back, no specific faces"
  },

  // --- YOUTUBE ---
  { 
    id: "yt_mrbeast", 
    prompt: "MrBeast style character pointing at the camera with a shocked expression, piles of cash money flying around, bright blue lightning background, youtube thumbnail style, high saturation" 
  },
  { 
    id: "yt_tech", 
    prompt: "Tech reviewer holding a glowing smartphone, studio background with RGB lighting strips, blurred bokeh, clean modern aesthetic, professional youtube thumbnail style" 
  }
];

// --- EXECUTION ---

if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 429) {
                 reject(new Error(`Rate Limited (429)`));
                 return;
            }
            if (res.statusCode === 503 || res.statusCode === 502) {
                reject(new Error(`Server Error (${res.statusCode})`));
                return;
           }
            if (res.statusCode !== 200) {
                reject(new Error(`Status Code: ${res.statusCode}`));
                return;
            }
            const fileStream = fs.createWriteStream(filepath);
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
            fileStream.on('error', (err) => {
                fs.unlink(filepath, () => {}); 
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

const generateWithRetry = async (item, retryCount = 0) => {
    const filename = `${item.id}.webp`;
    const filepath = path.join(OUTPUT_DIR, filename);

    // Prompt for Cover Art with Character
    const finalPrompt = `${item.prompt}, high quality, 8k, official art, detailed character`;
    const seed = Math.floor(Math.random() * 100000) + retryCount; 
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${WIDTH}&height=${HEIGHT}&nologo=true&seed=${seed}&model=flux`;

    try {
        process.stdout.write(`Generating ${filename} (Attempt ${retryCount + 1})... `);
        await downloadImage(url, filepath);
        console.log(`✅ Done`);
        return true;
    } catch (error) {
        console.log(`❌ ${error.message}`);
        
        if (retryCount < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * (retryCount + 1); // Linear backoff
            console.log(`   Waiting ${delay/1000}s before retry...`);
            await sleep(delay);
            return generateWithRetry(item, retryCount + 1);
        } else {
            console.log(`   Giving up on ${filename}`);
            return false;
        }
    }
};

const generate = async () => {
    console.log(`\n🎨 Starting Character Cover Generation`);
    console.log(`Target Directory: ${OUTPUT_DIR}\n`);

    // Force regeneration of existing files to apply new style
    // We do this by checking if they exist, and if so, deleting them first OR just overwriting.
    // The script below overwrites if I remove the existence check.
    
    // Generate specific IDs (New + Missing)
    const targetIds = [
        "series_friends", 
        "series_office", 
        "series_twd", 
        "series_tmkoc"
    ];
    
    for (const id of targetIds) {
        const item = VIBE_PROMPTS.find(p => p.id === id);
        if (item) {
             const filename = `${item.id}.webp`;
             const filepath = path.join(OUTPUT_DIR, filename);
             
             if (fs.existsSync(filepath)) {
                 try {
                    fs.unlinkSync(filepath);
                 } catch(e) {}
             }
             await generateWithRetry(item);
        }
    }
    
    console.log(`\n✨ Generation process completed.`);
};

generate();
