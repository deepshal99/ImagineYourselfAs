/**
 * UTILITY SCRIPT: Auto-Generate Persona Vibe Covers
 * Usage: node scripts/generateCovers.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// --- CONFIGURATION ---
const OUTPUT_DIR = path.join(__dirname, '../public/personas');
const WIDTH = 300;
const HEIGHT = 450;

// --- DATA ---
// We want "Vibe" images. No people. Just atmosphere/objects representing the theme.
const VIBE_PROMPTS = [
  // --- CINEMATIC ---
  { 
    id: "cinematic_retro_horror", 
    prompt: "80s retro horror movie poster background, neon red glowing fog, shadowy monster silhouette, synthwave color palette, atmospheric, no text, no people" 
  },
  { 
    id: "cinematic_dreamscape", 
    prompt: "Mind-bending cityscape folding onto itself, dramatic blue and orange color grading, dream-like atmosphere, abstract surrealism, high quality, no people" 
  },
  { 
    id: "cinematic_dystopia", 
    prompt: "Dystopian sci-fi city background, cracked glass screen effect, cold sterile lighting, technological horror vibe, glitch effects, cyberpunk aesthetic, no people" 
  },
  { 
    id: "cinematic_noir", 
    prompt: "Film noir detective office desk, shadows, trench coat hanging on rack, fedora on desk, moody sepia and blue lighting, mysterious atmosphere, no people" 
  },
  { 
    id: "cinematic_epic", 
    prompt: "Cosmic galaxy background with space debris, epic quantum realm energy, heroic rim lighting, intense cinematic atmosphere, no people" 
  },
  { 
    id: "cinematic_desert", 
    prompt: "Vast sand dunes of Arrakis, floating spice particles, cinematic gold and orange desert lighting, sci-fi planet landscape, no people" 
  },
  { 
    id: "cinematic_heist", 
    prompt: "Bank vault door open, piles of money, dramatic heist movie lighting, rebellious vibe, smoke, high contrast, no people" 
  },

  // --- EDITORIAL ---
  { 
    id: "editorial_vogue", 
    prompt: "Abstract high fashion studio background, bold artistic lighting, luxury fabric textures, minimal elegant aesthetic, magazine cover vibe, no people" 
  },
  { 
    id: "editorial_street", 
    prompt: "Urban graffiti wall, trendy city street background, wet asphalt, neon city lights, streetwear vibe, no people" 
  },
   { 
    id: "editorial_luxury", 
    prompt: "Interior of an italian villa, vintage luxury furniture, soft golden hour lighting, expensive aesthetic, old money vibe, no people" 
  },

  // --- FANTASY ---
  { 
    id: "fantasy_pirate", 
    prompt: "Caribbean beach at sunset, pirate ship in distance, treasure chest on sand, tropical vibe, cinematic lighting, no people" 
  },
  { 
    id: "fantasy_hero", 
    prompt: "Blue sky with white clouds, bright heroic sun flare, red cape fabric flowing in wind abstractly, symbol of hope, no people" 
  },
  
  // --- PERIOD ---
  { 
    id: "period_royal", 
    prompt: "Elaborate 18th century palace interior, golden chandelier, velvet curtains, oil painting style lighting, royal atmosphere, no people" 
  },
  { 
    id: "period_viking", 
    prompt: "Snowy fjord landscape, viking shield and axe leaning on rock, intense rugged atmosphere, cold blue lighting, no people" 
  },

  // --- PROFESSIONAL ---
  { 
    id: "prof_ceo", 
    prompt: "Modern silicon valley office, glass walls, blurry tech background, bokeh, professional success vibe, minimalist, no people" 
  },
  { 
    id: "prof_corporate", 
    prompt: "Skyscraper boardroom view, city skyline at night, luxury watch on table, corporate power atmosphere, elegant, no people" 
  },
  { 
    id: "prof_chef", 
    prompt: "Professional kitchen counter, stainless steel, flames in background, fresh ingredients, high end culinary atmosphere, no people" 
  }
];

// --- EXECUTION ---

if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const generate = async () => {
    console.log(`\n🎨 Starting Vibe Cover Generation`);
    console.log(`Target Directory: ${OUTPUT_DIR}\n`);

    for (const item of VIBE_PROMPTS) {
        const filename = `${item.id}.webp`; // Using WebP
        const filepath = path.join(OUTPUT_DIR, filename);
        
        // Using Pollinations for generation
        // prompt: enhance with "high quality, 8k, wallpaper"
        const finalPrompt = `${item.prompt}, high quality, 8k, wallpaper`;
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${WIDTH}&height=${HEIGHT}&nologo=true&seed=123&model=flux`;

        process.stdout.write(`Generating ${filename}... `);
        
        try {
            await downloadImage(url, filepath);
            console.log(`✅ Done`);
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }
    console.log(`\n✨ All vibe covers generated successfully.`);
};

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
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
                fs.unlink(filepath, () => {}); // Delete failed file
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

generate();
