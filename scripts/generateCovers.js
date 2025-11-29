/**
 * UTILITY SCRIPT: Auto-Generate Persona Covers
 * Usage: node scripts/generateCovers.js
 */

const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const BASE_MODEL = "a raw iphone photo of a handsome young Indian man, well groomed, short beard, neutral expression, looking at camera, realistic skin texture, no filter";
const OUTPUT_DIR = path.join(__dirname, '../public/personas');
const WIDTH = 300;
const HEIGHT = 450;

// --- DATA ---
const buildPrompt = (name, style) => 
  `Transform ${BASE_MODEL} into a ${name}. Maintain the face identity but completely change the clothing, background, and lighting to match this style: ${style}. Use centered portrait composition, 50mm lens look, shallow depth of field, photorealistic texture.`;

const PERSONAS = [
  // MOVIE POSTERS
  { id: "stranger_things_poster", name: "Stranger Things", style: "80s retro horror poster style, neon red glowing fog, shadowy monster silhouette in background, wearing 80s denim jacket, frightened but heroic expression, synthwave color palette" },
  { id: "inception_poster", name: "Inception", style: "mind-bending cityscape folding onto itself in background, wearing sharp grey suit, holding a spinning top, dramatic blue and orange color grading, dream-like atmosphere" },
  { id: "black_mirror_poster", name: "Black Mirror", style: "dystopian sci-fi aesthetic, cracked glass screen effect overlay, wearing futuristic minimal clothing, cold sterile lighting, technological horror vibe, glitch effects" },
  { id: "predestination_poster", name: "Time Traveler", style: "noir time travel mystery style, shadows covering half face, wearing trench coat and fedora, clock gears faint overlay, moody sepia and blue lighting, mysterious gaze" },
  { id: "avengers_endgame", name: "Avengers Hero", style: "epic superhero ensemble style, wearing quantum realm suit or high-tech armor, cosmic galaxy background with debris, heroic rim lighting, intense determination" },
  { id: "dune_poster", name: "Dune Warrior", style: "wearing stillsuit desert armor, blue glowing eyes (spice effect), vast sand dunes background, floating spice particles, cinematic gold and orange desert lighting" },
  { id: "money_heist", name: "The Professor", style: "wearing red jumpsuit and Dali mask (held in hand), bank vault background with floating money, dramatic heist movie lighting, rebellious vibe" },
  
  // OTHERS
  { id: "indian_pm", name: "The PM", style: "wearing signature half-sleeve kurta and jacket (Modi vest), well-groomed white beard style, standing at a podium, indian flag colors in background blur, charismatic leadership vibe" },
  { id: "us_president", name: "The President", style: "wearing a navy blue suit, red tie, american flag pin, white house background, blonde hair styling, confident presidential pose" },
  { id: "jack_sparrow", name: "Pirate Captain", style: "wearing pirate captain hat, dreadlocks with beads, heavy eyeliner, caribbean beach background, holding a compass, eccentric expression" },
  { id: "superman", name: "Man of Steel", style: "wearing blue kryptonian suit with red cape and S symbol, hovering in the sky, clouds background, heroic lighting, wind in hair" },
  { id: "avenger_iron", name: "Iron Hero", style: "wearing high-tech nanotechnology suit, glowing arc reactor on chest, hud display reflection on face, futuristic lab background, goatee beard" },
  { id: "bollywood_don", name: "Bollywood Don", style: "wearing cool sunglasses, leather jacket, slow motion walk away from explosion, intense swag, cinematic teal and orange lighting" },
  { id: "lando_norris", name: "F1 Star", style: "wearing mclaren orange racing suit, holding a helmet, race track paddock background, cap, sporty and youthful vibe" },
  { id: "football_legend", name: "Football Legend", style: "wearing striped football jersey (argentina or barcelona style), stadium lights background, sweat on face, victorious expression" },
  { id: "cricket_icon", name: "Cricket Icon", style: "wearing blue india cricket jersey, helmet off, holding bat on shoulder, stadium crowd background, intense sports lighting" },
  { id: "beach_vacation", name: "Beach Vacation", style: "wearing unbuttoned tropical floral shirt, sunglasses, maldives ocean background, bright sunlight, relaxed holiday vibe, cocktail in hand" },
  { id: "wedding_groom", name: "Indian Groom", style: "wearing grand sherwani with embroidery, turban (sehra), flower garland, royal wedding mandap background, golden lighting" },
  { id: "magazine_cover", name: "Vogue Cover", style: "high fashion editorial shot, bold outfit, studio lighting, text overlay style of a magazine cover, sharp cheekbones, confident gaze" },
  { id: "ceo_forbes", name: "Tech Billionaire", style: "wearing simple black t-shirt, arms crossed, silicon valley office glass background, confident smirk, forbes photoshoot style" },
  { id: "monk_peace", name: "Zen Monk", style: "wearing saffron robes, bald or shaved head, sitting in meditation in a garden, soft sunlight, peaceful serene expression" },
  { id: "singer_concert", name: "Pop Star", style: "holding a microphone, performing on stage, dramatic spotlight, smoke effects, emotional singing expression, concert atmosphere" },
  { id: "artist_studio", name: "The Painter", style: "wearing paint-splattered overalls, holding a brush and palette, art studio background with canvas, bohemian lighting, creative vibe" },
  { id: "saree_glam", name: "Saree Glam", style: "wearing a luxurious silk saree, traditional jewelry, bindis, temple background or royal palace, elegant cinematic lighting" },
  { id: "suit_corporate", name: "Corporate Sharp", style: "wearing a tailored three-piece suit, tie, luxury watch, skyscraper boardroom background, power pose, succesful vibe" },
  { id: "chef_ramsay", name: "Head Chef", style: "wearing crisp white chef whites, apron, crossing arms, busy kitchen background with flames, stern perfectionist expression" }
];

// --- EXECUTION ---

if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const generate = async () => {
    console.log(`\n🎨 Starting Persona Cover Generation`);
    console.log(`Target Directory: ${OUTPUT_DIR}\n`);

    for (const persona of PERSONAS) {
        const prompt = buildPrompt(persona.name, persona.style);
        const filename = `${persona.id}.jpg`;
        const filepath = path.join(OUTPUT_DIR, filename);
        
        // Using Pollinations for generation
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${WIDTH}&height=${HEIGHT}&nologo=true&seed=42&model=flux`;

        process.stdout.write(`Generating ${filename}... `);
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(filepath, Buffer.from(buffer));
            console.log(`✅ Done`);
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }
    console.log(`\n✨ All covers generated successfully.`);
};

generate();